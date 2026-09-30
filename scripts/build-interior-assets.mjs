import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const source = fileURLToPath(new URL("docs/interior-art/", root));
const output = fileURLToPath(new URL("public/game/interior/", root));
await mkdir(output, { recursive: true });

// Individual measured bounds in the original atlas; never sample the old room PNG.
const pieces = [
  ["tv", 30, 36, 266, 270, 80, 96],
  ["window", 350, 42, 252, 260, 64, 64],
  ["table", 658, 42, 274, 266, 64, 56],
  ["chair", 1018, 42, 190, 264, 32, 48],
  ["fireplace", 36, 306, 246, 332, 112, 160],
  ["bed", 350, 316, 250, 322, 88, 152],
  ["plant", 664, 356, 240, 276, 48, 72],
  ["rug", 936, 362, 304, 248, 96, 64],
  ["lamp-off", 57, 639, 205, 278, 32, 56],
  ["lamp-on", 372, 639, 211, 278, 32, 56],
  ["chest", 650, 679, 252, 216, 32, 40],
  ["door", 958, 672, 271, 220, 96, 56],
];

async function spritePixels(file, box, width, height) {
  const rgba = await sharp(file).extract(box).resize(width, height, { kernel: "nearest" })
    .ensureAlpha().raw().toBuffer();
  for (let index = 3; index < rgba.length; index += 4) rgba[index] = rgba[index] >= 128 ? 255 : 0;
  return rgba;
}
async function png(rgba, width, height) {
  return sharp(rgba, { raw: { width, height, channels: 4 } })
    .png({ palette: true, colours: 64, dither: 0 }).toBuffer();
}
const frames = {};
const layers = [];
function addFrame(name, index, w, h, input) {
  const x = index % 4 * 128;
  const y = Math.floor(index / 4) * 192;
  frames[name] = { frame: { x, y, w, h }, rotated: false, trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w, h }, sourceSize: { w, h } };
  layers.push({ input, left: x, top: y });
}
for (const [index, [name, left, top, width, height, w, h]] of pieces.entries()) {
  const rgba = await spritePixels(`${source}/furniture-source.png`, { left, top, width, height }, w, h);
  addFrame(name, index, w, h, await png(rgba, w, h));
  if (name === "bed") {
    // Independent blanket/footboard foreground. It covers the lower body in bed.
    const cover = Buffer.from(rgba);
    for (let y = 0; y < 61; y++) for (let x = 0; x < w; x++) cover[(y * w + x) * 4 + 3] = 0;
    addFrame("bed-cover", 12, w, h, await png(cover, w, h));
  }
}
await sharp({ create: { width: 512, height: 768, channels: 4, background: "#00000000" } })
  .composite(layers).png().toFile(`${output}/furniture.png`);
await writeFile(`${output}/furniture.json`, JSON.stringify({ frames, meta: {
  image: "furniture.png", size: { w: 512, h: 768 }, scale: "1",
} }, null, 2) + "\n");

// Compile reusable wooden materials into small floor, wall and frame tiles.
const materials = [];
for (const [left, top, width, height] of [[32, 930, 246, 242], [349, 930, 241, 242], [659, 930, 245, 242]]) {
  materials.push(await sharp(`${source}/furniture-source.png`).extract({ left, top, width, height })
    .resize(64, 64, { kernel: "nearest" }).removeAlpha().raw().toBuffer());
}
const tiles = Buffer.alloc(192 * 16 * 4);
function sample(material, x, y, variation = 0) {
  const index = (((y + variation * 11) % 64) * 64 + ((x + variation * 17) % 64)) * 3;
  return [...materials[material].subarray(index, index + 3), 255];
}
function put(frame, x, y, color) { tiles.set(color, (y * 192 + frame * 16 + x) * 4); }
for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
  for (let variant = 0; variant < 4; variant++) {
    let floor = sample(0, x, y, variant);
    if (y === 15 || (variant === 3 && x === 15)) floor = [120, 67, 30, 255];
    else if (y === 0) floor = [209, 144, 63, 255];
    else if (variant === 3 && x === 13 && (y === 3 || y === 12)) floor = [101, 66, 37, 255];
    put(variant, x, y, floor);
    put(4 + variant, x, y, x === 15 ? [123, 77, 32, 255] : sample(1, x, y, variant));
  }
  put(8, x, y, y < 2 || y > 13 ? [72, 41, 23, 255] : sample(2, x, y));
  put(9, x, y, x < 2 || x > 13 ? [72, 41, 23, 255] : sample(2, y, x));
  put(10, x, y, [37, 25, 20, 255]);
  put(11, x, y, y % 8 === 7 ? [96, 52, 25, 255] : sample(0, x, y, 1));
}
await sharp(tiles, { raw: { width: 192, height: 16, channels: 4 } }).png().toFile(`${output}/tiles.png`);

// New poses preserve the two existing characters. Native frames use the same 2x scale.
const poses = [
  ["masculine-sit", 235, 91, 282, 499, 48, 48, 40, 40],
  ["feminine-sit", 789, 111, 300, 488, 48, 48, 40, 40],
  ["masculine-lie", 213, 642, 241, 561, 32, 64, 32, 64],
  ["feminine-lie", 782, 651, 276, 550, 32, 64, 32, 64],
];
const poseFrames = {};
const poseLayers = [];
for (const [i, [name, left, top, width, height, w, h, fitW, fitH]] of poses.entries()) {
  const cropped = await sharp(`${source}/poses-source.png`).extract({ left, top, width, height })
    .resize(fitW, fitH, { fit: "inside", kernel: "nearest" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let p = 3; p < cropped.data.length; p += 4) cropped.data[p] = cropped.data[p] >= 128 ? 255 : 0;
  const frame = await sharp({ create: { width: w, height: h, channels: 4, background: "#00000000" } })
    .composite([{ input: await png(cropped.data, cropped.info.width, cropped.info.height),
      left: Math.floor((w - cropped.info.width) / 2), top: h - cropped.info.height }]).png().toBuffer();
  const x = i * 64;
  poseFrames[name] = { frame: { x, y: 0, w, h }, rotated: false, trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w, h }, sourceSize: { w, h } };
  poseLayers.push({ input: frame, left: x, top: 0 });
}
await sharp({ create: { width: 256, height: 64, channels: 4, background: "#00000000" } })
  .composite(poseLayers).png().toFile(`${output}/poses.png`);
await writeFile(`${output}/poses.json`, JSON.stringify({ frames: poseFrames, meta: {
  image: "poses.png", size: { w: 256, h: 64 }, scale: "1",
} }, null, 2) + "\n");
console.log("Interior: 12 reusable tiles, 13 furniture frames and 4 character poses compiled.");
