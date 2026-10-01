import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { loadTypeScript } from "./check-exterior.mjs";

const motion = loadTypeScript("components/portfolio/game/character-motion.ts");
const root = new URL("../", import.meta.url);
const atlasFile = new URL("public/game/character-motion/atlas.png", root);
const { frames } = JSON.parse(await readFile(new URL("public/game/character-motion/atlas.json", root), "utf8"));
const atlas = await sharp(fileURLToPath(atlasFile)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
assert.equal(Object.keys(frames).length, 40);

for (const [dx, dy, expected] of [[-1, -1, "up-left"], [1, -1, "up-right"], [-1, 1, "down-left"], [1, 1, "down-right"]]) {
  assert.equal(motion.getDiagonalDirection(dx, dy), expected);
  assert.equal(motion.getMovementFacing(dx, dy), expected);
}
assert.equal(motion.getDiagonalDirection(0, -1), null);
assert.equal(motion.getMovementFacing(0, 0, "up-right"), "up-right");

for (const character of ["masculine", "feminine"]) {
  for (const direction of motion.DIAGONAL_DIRECTIONS) {
    const hashes = new Set();
    for (let index = 0; index < 4; index++) {
      const key = motion.getDiagonalFrame(character, direction, index);
      const { x, y, w, h } = frames[key].frame;
      assert.equal(w, 256); assert.equal(h, 256);
      const data = await sharp(atlas.data, { raw: atlas.info }).extract({ left: x, top: y, width: w, height: h }).raw().toBuffer();
      let opaque = 0, maxY = -1;
      for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
        const alpha = data[(py * w + px) * 4 + 3];
        assert(alpha === 0 || alpha === 255, "Pixel art must have binary alpha");
        if (alpha) { opaque++; maxY = Math.max(maxY, py); }
      }
      assert(opaque > 6000 && opaque < 30000, `${key}: isolated sprite occupancy`);
      assert.equal(maxY, 235, `${key}: same foot baseline as all other motion frames`);
      hashes.add(createHash("sha256").update(data).digest("hex"));
    }
    assert.equal(hashes.size, 4, `${character}/${direction}: four distinct gait drawings`);
  }
  for (const pose of ["cast-0", "cast-1", "reel", "hold"]) assert(frames[motion.getFishingPoseFrame(character, pose)]);
}
console.log("Character motion passed: both characters, all four diagonals, 32 distinct walking frames, 8 fishing poses, consistent canvas/feet and transparent crisp pixels.");
