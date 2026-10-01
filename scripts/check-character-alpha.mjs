import assert from "node:assert/strict";
import sharp from "sharp";

for (const [filename, maximum] of [
  ["public/game/character-masculine-walksheet.png", 4],
  ["public/game/character-feminine-walksheet.png", 4],
  ["public/game/character-motion/atlas.png", 0],
]) {
  const { data, info } = await sharp(filename).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let paleEdge = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * 4;
    const alpha = data[i + 3];
    assert(alpha === 0 || alpha === 255, `${filename}: antialiased alpha at ${x},${y}`);
    if (!alpha) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (Math.min(r, g, b) < 175 || Math.max(r, g, b) - Math.min(r, g, b) > 25) continue;
    const edge = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([xx, yy]) =>
      xx < 0 || yy < 0 || xx >= info.width || yy >= info.height || !data[(yy * info.width + xx) * 4 + 3]);
    if (edge) paleEdge++;
  }
  assert(paleEdge <= maximum, `${filename}: ${paleEdge} pale halo pixels`);
  console.log(`${filename}: ${paleEdge} pale edge pixels, binary transparency.`);
}
