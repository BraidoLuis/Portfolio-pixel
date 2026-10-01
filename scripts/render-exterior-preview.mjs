import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { loadTypeScript } from "./check-exterior.mjs";

const root = new URL("../", import.meta.url);
const output = fileURLToPath(new URL("docs/exterior-art/", root));
const assets = fileURLToPath(new URL("public/game/exterior/", root));
const { EXTERIOR_TILES, EXTERIOR_OBJECTS, TILE_SIZE } = loadTypeScript("components/portfolio/game/exterior-map.ts");
const { getExteriorTileFrame, EXTERIOR_TILE_SOURCE_SIZE } = loadTypeScript("components/portfolio/game/exterior-art.ts");
const atlas = JSON.parse(await readFile(`${assets}/objects.json`, "utf8"));
const terrain = await sharp(`${assets}/terrain.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const width = EXTERIOR_TILES[0].length * TILE_SIZE;
const height = EXTERIOR_TILES.length * TILE_SIZE;
const ground = Buffer.alloc(width * height * 4);
const tileColumns = terrain.info.width / EXTERIOR_TILE_SOURCE_SIZE;
EXTERIOR_TILES.forEach((row, r) => row.forEach((kind, c) => {
  const frame = getExteriorTileFrame(kind, c, r);
  for (let y = 0; y < TILE_SIZE; y++) for (let x = 0; x < TILE_SIZE; x++) {
    const sx = (frame % tileColumns) * EXTERIOR_TILE_SOURCE_SIZE + Math.floor(x * EXTERIOR_TILE_SOURCE_SIZE / TILE_SIZE);
    const sy = Math.floor(frame / tileColumns) * EXTERIOR_TILE_SOURCE_SIZE + Math.floor(y * EXTERIOR_TILE_SOURCE_SIZE / TILE_SIZE);
    const source = (sy * terrain.info.width + sx) * 4;
    const target = ((r * TILE_SIZE + y) * width + c * TILE_SIZE + x) * 4;
    terrain.data.copy(ground, target, source, source + 4);
  }
}));
const layers = [];
const cache = new Map();
for (const object of [...EXTERIOR_OBJECTS].sort((a, b) => (a.depth ?? a.y) - (b.depth ?? b.y))) {
  const frame = atlas.frames[object.kind].frame;
  const key = `${object.kind}:${object.width}:${object.height}`;
  if (!cache.has(key)) cache.set(key, await sharp(`${assets}/objects.png`)
    .extract({ left: frame.x, top: frame.y, width: frame.w, height: frame.h })
    .resize(object.width, object.height, { kernel: "nearest" }).png().toBuffer());
  const x = Math.round(object.x - object.width / 2);
  const y = Math.round(object.y - object.height);
  const left = Math.max(0, x);
  const top = Math.max(0, y);
  const clippedWidth = Math.min(width, x + object.width) - left;
  const clippedHeight = Math.min(height, y + object.height) - top;
  if (clippedWidth <= 0 || clippedHeight <= 0) continue;
  const input = x < 0 || y < 0 || clippedWidth !== object.width || clippedHeight !== object.height
    ? await sharp(cache.get(key)).extract({ left: left - x, top: top - y, width: clippedWidth, height: clippedHeight }).png().toBuffer()
    : cache.get(key);
  layers.push({ input, left, top });
}
await mkdir(output, { recursive: true });
await sharp(ground, { raw: { width, height, channels: 4 } }).composite(layers)
  .png().toFile(`${output}/exterior-preview.png`);
console.log(`Rendered ${width}x${height} preview from ${EXTERIOR_TILES.flat().length} tiles and ${layers.length} individual sprites.`);
