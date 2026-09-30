import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { loadTypeScript } from "./check-exterior.mjs";
import { dirtCoverage, groundEdge } from "./exterior-terrain-shapes.mjs";

const {
  getExteriorTileFrame, getExteriorGroundMask, EXTERIOR_TERRAIN_FRAME_COUNT,
  EXTERIOR_TILESET_COLUMNS, EXTERIOR_TILE_SOURCE_SIZE,
} = loadTypeScript("components/portfolio/game/exterior-art.ts");
const { EXTERIOR_TILES } = loadTypeScript("components/portfolio/game/exterior-map.ts");
const terrain = await sharp(fileURLToPath(new URL("../public/game/exterior/terrain.png", import.meta.url)))
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
assert.equal(terrain.info.width, EXTERIOR_TILESET_COLUMNS * EXTERIOR_TILE_SOURCE_SIZE);
assert(terrain.info.width <= 4096 && terrain.info.height <= 4096, "Atlas must fit modest GPU texture limits");
assert(terrain.info.height >= Math.ceil(EXTERIOR_TERRAIN_FRAME_COUNT / EXTERIOR_TILESET_COLUMNS) * EXTERIOR_TILE_SOURCE_SIZE);

// Convex dirt and concave grass must both round. The old four-neighbor tiles
// passed the first check but could never paint the matching concave corner.
assert(dirtCoverage(256 | 4 | 8 | 16, 0, 0) < 0.5, "Cut the convex dirt corner");
assert(dirtCoverage(1 | 2 | 4, 15, 0) > 0.5, "Fill the concave grass corner");
for (let mask = 0; mask < 512; mask++) {
  for (const [x, y] of [[0, 0], [7, 7], [15, 15], [3, 12]]) {
    assert(Math.abs(dirtCoverage(mask, x, y) + dirtCoverage(mask ^ 511, x, y) - 1) < 1e-10);
  }
}

let samples = 0;
let joins = 0;
for (let row = 0; row < EXTERIOR_TILES.length; row++) {
  for (let column = 0; column < EXTERIOR_TILES[row].length; column++) {
    const kind = EXTERIOR_TILES[row][column];
    const frame = getExteriorTileFrame(kind, column, row);
    assert(frame >= 0 && frame < EXTERIOR_TERRAIN_FRAME_COUNT);
    const left = frame % EXTERIOR_TILESET_COLUMNS * 16;
    const top = Math.floor(frame / EXTERIOR_TILESET_COLUMNS) * 16;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      assert.equal(terrain.data[((top + y) * terrain.info.width + left + x) * 4 + 3], 255);
      samples++;
    }
    if (kind !== "path" && kind !== "grass") continue;
    const phase = (column & 1) + ((row & 1) << 1);
    const mask = getExteriorGroundMask(column, row);
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const next = EXTERIOR_TILES[row + dy]?.[column + dx];
      if (next !== "path" && next !== "grass") continue;
      const nextPhase = ((column + dx) & 1) + (((row + dy) & 1) << 1);
      const nextMask = getExteriorGroundMask(column + dx, row + dy);
      for (let offset = 0; offset < 16; offset++) {
        const here = groundEdge(mask, dx ? 15.5 : offset, dy ? 15.5 : offset, phase);
        const there = groundEdge(nextMask, dx ? -0.5 : offset, dy ? -0.5 : offset, nextPhase);
        assert(Math.abs(here - there) < 1e-10, `Broken terrain join at ${column},${row}`);
        joins++;
      }
    }
  }
}
console.log(`Terrain passed: ${samples} opaque pixels, ${joins} continuous border samples, 512 complementary masks, convex/concave curves and atlas bounds.`);
