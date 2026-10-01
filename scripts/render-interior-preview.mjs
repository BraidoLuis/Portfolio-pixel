import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { loadTypeScript } from "./check-exterior.mjs";

const root = new URL("../", import.meta.url);
const assets = fileURLToPath(new URL("public/game/interior/", root));
const output = fileURLToPath(new URL("docs/interior-art/", root));
const {
  HOUSE_TILES, HOUSE_TILE_SIZE, HOUSE_OBJECTS, HOUSE_REST_SPOTS,
  HOUSE_MARKER, HOUSE_SPAWN, HOUSE_PLAYER_SIZE,
} = loadTypeScript("components/portfolio/game/house-map.ts");
const { getRestPoseFrame, getTutorialMarkerY } = loadTypeScript("components/portfolio/game/house-rest.ts");
const furniture = JSON.parse(await readFile(`${assets}/furniture.json`, "utf8"));
const poses = JSON.parse(await readFile(`${assets}/poses.json`, "utf8"));
const terrain = await sharp(`${assets}/tiles.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const width = HOUSE_TILES[0].length * HOUSE_TILE_SIZE;
const height = HOUSE_TILES.length * HOUSE_TILE_SIZE;
const sourceSize = 16;
const tileColumns = terrain.info.width / sourceSize;
const ground = Buffer.alloc(width * height * 4);
// The black outside area is opaque, as on the Phaser camera background.
for (let alpha = 3; alpha < ground.length; alpha += 4) ground[alpha] = 255;
for (let row = 0; row < HOUSE_TILES.length; row += 1) {
  for (let column = 0; column < HOUSE_TILES[row].length; column += 1) {
    const frame = HOUSE_TILES[row][column];
    if (frame < 0) continue;
    for (let y = 0; y < HOUSE_TILE_SIZE; y += 1) {
      for (let x = 0; x < HOUSE_TILE_SIZE; x += 1) {
        const sx = frame % tileColumns * sourceSize + Math.floor(x * sourceSize / HOUSE_TILE_SIZE);
        const sy = Math.floor(frame / tileColumns) * sourceSize + Math.floor(y * sourceSize / HOUSE_TILE_SIZE);
        const source = (sy * terrain.info.width + sx) * 4;
        const target = ((row * HOUSE_TILE_SIZE + y) * width + column * HOUSE_TILE_SIZE + x) * 4;
        terrain.data.copy(ground, target, source, source + 4);
      }
    }
  }
}

const spriteCache = new Map();
async function sprite(atlasName, frameName, targetWidth, targetHeight, flipX = false) {
  const key = `${atlasName}/${frameName}/${targetWidth}/${targetHeight}/${flipX}`;
  if (!spriteCache.has(key)) {
    const atlas = atlasName === "poses" ? poses : furniture;
    const frame = atlas.frames[frameName]?.frame;
    assert(frame, `Missing ${atlasName} atlas frame: ${frameName}`);
    let pipeline = sharp(`${assets}/${atlasName}.png`)
      .extract({ left: frame.x, top: frame.y, width: frame.w, height: frame.h })
      .resize(targetWidth, targetHeight, { kernel: "nearest" });
    if (flipX) pipeline = pipeline.flop();
    spriteCache.set(key, await pipeline.png().toBuffer());
  }
  return spriteCache.get(key);
}

const objectLayers = [];
for (const object of HOUSE_OBJECTS) {
  objectLayers.push({
    input: await sprite("furniture", object.kind, object.width, object.height, object.flipX),
    left: Math.round(object.x - object.width / 2),
    top: Math.round(object.y - object.height),
    depth: object.depth ?? object.y,
  });
}
const markerSize = 48;
const marker = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${markerSize}" height="${markerSize}"><text x="24" y="35" text-anchor="middle" font-family="monospace" font-size="30" font-weight="bold" fill="#ffe9a9" stroke="#5d2e1d" stroke-width="5" paint-order="stroke">?</text></svg>`);
objectLayers.push({ input: marker, left: Math.round(HOUSE_MARKER.x - markerSize / 2),
  top: Math.round(getTutorialMarkerY(0) - markerSize / 2), depth: 1200 });

async function renderScene(additional = []) {
  const sorted = [...objectLayers, ...additional].sort((a, b) => a.depth - b.depth);
  const clipped = [];
  for (const layer of sorted) {
    const metadata = await sharp(layer.input).metadata();
    const left = Math.max(0, layer.left);
    const top = Math.max(0, layer.top);
    const clippedWidth = Math.min(width, layer.left + metadata.width) - left;
    const clippedHeight = Math.min(height, layer.top + metadata.height) - top;
    if (clippedWidth <= 0 || clippedHeight <= 0) continue;
    const input = left === layer.left && top === layer.top && clippedWidth === metadata.width && clippedHeight === metadata.height
      ? layer.input
      : await sharp(layer.input).extract({ left: left - layer.left, top: top - layer.top,
        width: clippedWidth, height: clippedHeight }).png().toBuffer();
    clipped.push({ input, left, top });
  }
  return sharp(ground, { raw: { width, height, channels: 4 } }).composite(clipped).png().toBuffer();
}

await mkdir(output, { recursive: true });
await sharp(await renderScene()).png().toFile(`${output}/room-preview.png`);

const walkingFrame = await sharp(fileURLToPath(new URL("public/game/character-masculine-walksheet.png", root)))
  .extract({ left: 0, top: 0, width: 256, height: 256 })
  .resize(HOUSE_PLAYER_SIZE, HOUSE_PLAYER_SIZE, { kernel: "nearest" }).png().toBuffer();
await sharp(await renderScene([{ input: walkingFrame,
  left: Math.round(HOUSE_SPAWN.x - HOUSE_PLAYER_SIZE / 2),
  top: Math.round(HOUSE_SPAWN.y - HOUSE_PLAYER_SIZE / 2),
  depth: HOUSE_SPAWN.y + HOUSE_PLAYER_SIZE * 0.43,
}])).png().toFile(`${output}/room-player-preview.png`);

const cellSize = 384;
const labelHeight = 36;
const cellLayers = [];
const bed = HOUSE_OBJECTS.find((object) => object.id === "bed");
assert(bed, "Missing bed object");
const characters = ["masculine", "feminine"];
const captions = { "chair-left": "Cadeira esquerda", "chair-right": "Cadeira direita", bed: "Cama" };
for (let row = 0; row < characters.length; row += 1) {
  const character = characters[row];
  for (let column = 0; column < HOUSE_REST_SPOTS.length; column += 1) {
    const spot = HOUSE_REST_SPOTS[column];
    const extra = [{
      input: await sprite("poses", getRestPoseFrame(character, spot.kind), spot.width, spot.height, spot.facing === "left"),
      left: Math.round(spot.x - spot.width / 2), top: Math.round(spot.y - spot.height / 2), depth: spot.depth,
    }];
    if (spot.kind === "lie") extra.push({
      input: await sprite("furniture", "bed-cover", bed.width, bed.height),
      left: Math.round(bed.x - bed.width / 2), top: Math.round(bed.y - bed.height), depth: 851,
    });
    const cropCenterY = spot.kind === "lie" ? bed.y - bed.height / 2 : spot.y;
    const left = Math.max(0, Math.min(width - cellSize, Math.round(spot.x - cellSize / 2)));
    const top = Math.max(0, Math.min(height - cellSize, Math.round(cropCenterY - cellSize / 2)));
    const input = await sharp(await renderScene(extra)).extract({ left, top, width: cellSize, height: cellSize }).png().toBuffer();
    cellLayers.push({ input, left: column * cellSize, top: row * (cellSize + labelHeight) + labelHeight });
    const label = `${character === "masculine" ? "Masculino" : "Feminino"} / ${captions[spot.id]}`;
    cellLayers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize}" height="${labelHeight}"><text x="12" y="25" font-family="sans-serif" font-size="16" fill="#f5e4bd">${label}</text></svg>`),
      left: column * cellSize, top: row * (cellSize + labelHeight) });
  }
}
await sharp({ create: { width: cellSize * 3, height: (cellSize + labelHeight) * 2,
  channels: 4, background: "#17110d" } }).composite(cellLayers).png().toFile(`${output}/poses-preview.png`);
console.log(`Interior preview: ${width}x${height}, ${HOUSE_TILES.flat().filter((tile) => tile >= 0).length} tiles, ${HOUSE_OBJECTS.length} furniture sprites.`);
console.log(`Written: ${output}/room-preview.png\n${output}/room-player-preview.png\n${output}/poses-preview.png`);
