import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { loadTypeScript } from "./check-exterior.mjs";
import { groundEdge } from "./exterior-terrain-shapes.mjs";

const {
  EXTERIOR_TILE_SOURCE_SIZE: tileSize,
  EXTERIOR_TILESET_COLUMNS: tileColumns,
  EXTERIOR_GROUND_VARIANTS: groundVariants,
  EXTERIOR_WATER_FRAME: waterFrame,
  EXTERIOR_CLIFF_FRAME: cliffFrame,
  EXTERIOR_CLIFF_FRAME_COUNT: cliffFrameCount,
  EXTERIOR_STAIRS_FRAME: stairsFrame,
  EXTERIOR_TERRAIN_FRAME_COUNT: frameCount,
} = loadTypeScript("components/portfolio/game/exterior-art.ts");

// Asset compilation only: slice the original art, quantize to a common pixel
// scale, and pack reusable sprites/materials. No part of exterior-world.png is used.
const root = new URL("../", import.meta.url);
const source = fileURLToPath(new URL("docs/exterior-art/", root));
const destination = fileURLToPath(new URL("public/game/exterior/", root));
await mkdir(destination, { recursive: true });

// Measured source bounds; the generated sheet has variable-height rows.
const sprites = [
  ["house", 18, 8, 332, 399, 128, 128],
  ["pine", 354, 8, 269, 400, 48, 64],
  ["oak", 628, 18, 315, 390, 56, 64],
  ["pink", 945, 26, 309, 382, 56, 64],
  ["chest", 32, 467, 280, 209, 24, 24],
  ["sign", 350, 412, 254, 278, 24, 32],
  ["rocks", 618, 422, 320, 268, 32, 24],
  ["stump", 944, 433, 310, 250, 24, 24],
  ["bush", 18, 700, 305, 250, 24, 24],
  ["flowers", 331, 700, 273, 251, 24, 24],
  ["fence", 610, 763, 403, 182, 48, 24],
  ["lantern", 1035, 682, 199, 267, 24, 48],
  ["grass", 14, 957, 322, 286, 16, 16],
  ["reeds", 348, 955, 260, 296, 24, 32],
  ["lilies", 619, 977, 294, 263, 24, 24],
  ["dock", 939, 951, 296, 293, 32, 32],
];
const frames = {};
const composites = [];
const terrainOnly = process.argv.includes("--terrain-only");
for (const [index, [name, left, top, width, height, w, h]] of (terrainOnly ? [] : sprites).entries()) {
  const rgba = await sharp(`${source}/objects-source.png`)
    .extract({ left, top, width, height })
    .resize(w, h, { fit: "fill", kernel: "nearest" })
    .ensureAlpha().raw().toBuffer();
  // Binary alpha keeps the pixel silhouettes crisp and removes translucent matte.
  for (let pixel = 0; pixel < rgba.length; pixel += 4) {
    rgba[pixel + 3] = rgba[pixel + 3] >= 128 ? 255 : 0;
  }
  const input = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .png({ palette: true, colours: 64, dither: 0 }).toBuffer();
  const x = (index % 4) * 128;
  const y = Math.floor(index / 4) * 128;
  composites.push({ input, left: x, top: y });
  frames[name] = {
    frame: { x, y, w, h }, rotated: false, trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w, h }, sourceSize: { w, h },
  };
}
if (!terrainOnly) {
  await sharp({ create: { width: 512, height: 512, channels: 4, background: "#00000000" } })
    .composite(composites).png().toFile(`${destination}/objects.png`);
  await writeFile(`${destination}/objects.json`, JSON.stringify({ frames, meta: {
    image: "objects.png", format: "RGBA8888", size: { w: 512, h: 512 }, scale: "1",
  } }, null, 2) + "\n");
}

// The four material samples provide actual illustrated texture. Edge masks make
// connected paths/water; they are NOT crops from an illustration of the world.
const materials = [];
for (const [left, top] of [[0, 0], [627, 0], [0, 627], [627, 627]]) {
  materials.push(await sharp(`${source}/materials-source.png`)
    .extract({ left, top, width: 627, height: 627 })
    .resize(64, 64, { kernel: "nearest" }).removeAlpha()
    .png({ palette: true, colours: 24, dither: 0 }).toBuffer()
    .then((buffer) => sharp(buffer).removeAlpha().raw().toBuffer()));
}
const atlasWidth = tileColumns * tileSize;
const atlasHeight = Math.ceil(frameCount / tileColumns) * tileSize;
const pixels = Buffer.alloc(atlasWidth * atlasHeight * 4);
function sample(material, x, y, variant = 0) {
  const px = ((x + (variant & 1) * 16 + (variant >> 2) * 32) % 64 + 64) % 64;
  const py = ((y + ((variant >> 1) & 1) * 16 + (variant >> 2) * 32) % 64 + 64) % 64;
  const offset = (py * 64 + px) * 3;
  const color = [...materials[material].subarray(offset, offset + 3)];
  // Calm the grass texture so sprites, trails and interactive objects read first.
  if (material === 0) return [...color.map((channel, i) => Math.round(channel * 0.64 + [101, 134, 47][i] * 0.36)), 255];
  if (material === 1) return [...color.map((channel, i) => Math.round(channel * 0.86 + [211, 166, 79][i] * 0.14)), 255];
  return [...color, 255];
}
function put(frame, x, y, color) {
  const offset = ((Math.floor(frame / tileColumns) * tileSize + y) * atlasWidth + (frame % tileColumns) * tileSize + x) * 4;
  pixels.set(color, offset);
}
function shapeEdge(mask, x, y) {
  // N/E/S/W disconnected edges; tiny stepped grass tongues soften tile corners.
  const distances = [];
  if (!(mask & 1)) distances.push(y - (x % 5 === 0 ? 1 : 0));
  if (!(mask & 2)) distances.push(15 - x - (y % 7 === 0 ? 1 : 0));
  if (!(mask & 4)) distances.push(15 - y - (x % 7 === 2 ? 1 : 0));
  if (!(mask & 8)) distances.push(x - (y % 5 === 0 ? 1 : 0));
  // Rounded outer corners retain stepped pixel edges instead of square paving.
  if (!(mask & 1) && !(mask & 8) && x < 7 && y < 7) distances.push(7 - Math.hypot(x - 7, y - 7));
  if (!(mask & 1) && !(mask & 2) && x > 8 && y < 7) distances.push(7 - Math.hypot(x - 8, y - 7));
  if (!(mask & 4) && !(mask & 8) && x < 7 && y > 8) distances.push(7 - Math.hypot(x - 7, y - 8));
  if (!(mask & 4) && !(mask & 2) && x > 8 && y > 8) distances.push(7 - Math.hypot(x - 8, y - 8));
  return distances.length ? Math.min(...distances) : 16;
}
for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
  for (let variant = 0; variant < groundVariants; variant++) for (let mask = 0; mask < 512; mask++) {
    const edge = groundEdge(mask, x, y, variant);
    const grass = sample(0, x, y, variant);
    const dirt = sample(1, x, y, variant);
    // Narrow, irregular moss/ochre pixels tie the illustrated materials together.
    // The central dirt never receives a painted outline or a repeating tile rim.
    const color = edge < -0.018 ? grass : edge < 0.018
      ? dirt.map((channel, index) => index === 3 ? 255 : Math.round(channel * 0.62 + grass[index] * 0.38))
      : dirt;
    put(mask * groundVariants + variant, x, y, color);
  }
  for (let variant = 0; variant < 4; variant++) for (let mask = 0; mask < 16; mask++) {
    const edge = shapeEdge(mask, x, y);
    // Grass bank, irregular limestone shoreline, wet edge, then water.
    const stone = ((x * 3 + y * 5) % 11) < 4 ? [169, 164, 115, 255] : [114, 118, 85, 255];
    put(waterFrame + variant * 16 + mask, x, y, edge < 1 ? sample(0, x, y, variant) : edge < 3 ? stone : edge < 4 ? [45, 115, 124, 255] : sample(2, x, y, variant));
  }
  for (let mask = 0; mask < cliffFrameCount; mask++) {
    const side = ((mask & 1) && x < 2) || ((mask & 2) && x > 13);
    const top = 2 + ((x * 5 + mask * 3) % 11 === 0 ? 1 : 0);
    const seam = (x === (5 + (mask & 3) * 2) && y >= 6 && y <= 11) ||
      (x === (11 - (mask & 3)) && y >= 11);
    const stone = sample(3, x, y, mask % 4);
    const color = y < top ? sample(0, x, y, mask % 4)
      : y === top ? [68, 79, 33, 255]
      : side ? y < 7 ? sample(0, x, y, mask % 4) : [75, 70, 42, 255]
      : y === 15 ? [65, 55, 34, 255]
      : seam ? [73, 64, 40, 255]
      : (x + y * 3 + mask) % 17 === 0 ? [176, 142, 83, 255] : stone;
    put(cliffFrame + mask, x, y, color);
  }
  for (let variant = 0; variant < 16; variant++) {
    const step = y % 4;
    // Rail AND landing bits let inner stair tiles join cleanly while the first
    // and last treads pick up a few weathered dirt pixels from the approaches.
    const edge = ((variant & 1) && x === 0) || ((variant & 2) && x === 15);
    const landing = ((variant & 4) && y < 2) || ((variant & 8) && y > 13);
    const worn = ((x * 7 + y * 3 + variant * 5) % 17) < 4;
    const colors = [[225, 189, 109, 255], [177, 130, 70, 255], [143, 98, 53, 255], [73, 51, 34, 255]];
    const rail = edge && (x < 2 || x > 13);
    const railPost = rail && (y === 1 || y === 9);
    const color = railPost ? [198, 155, 76, 255]
      : rail ? [93, 64, 39, 255]
      : landing && worn ? sample(1, x, y, variant % 8)
      : step === 1 && worn ? [196, 154, 83, 255]
      : step === 2 && (x + variant) % 7 === 0 ? [109, 72, 42, 255]
      : colors[step];
    put(stairsFrame + variant, x, y, color);
  }
}
await sharp(pixels, { raw: { width: atlasWidth, height: atlasHeight, channels: 4 } })
  .png().toFile(`${destination}/terrain.png`);
console.log(`Compiled ${terrainOnly ? "terrain only (existing sprites preserved)" : `${sprites.length} sprites and terrain`}: ${frameCount} reusable connected frames into ${destination}`);
