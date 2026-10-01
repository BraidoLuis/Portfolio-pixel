import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { cleanCharacterAlpha } from "./character-alpha.mjs";

// The image tool supplied original female poses on a painted gray checker.
// Flood only the neutral/light background connected to the outer image edge.
// Eyes and dress highlights enclosed by dark outlines remain untouched.
const source = fileURLToPath(new URL("../docs/character-motion/feminine-generated-opaque.png", import.meta.url));
const target = fileURLToPath(new URL("../docs/character-motion/feminine-source.png", import.meta.url));
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const seen = new Uint8Array(width * height);
const queue = new Int32Array(width * height);
let tail = 0;
const background = (index) => {
  const offset = index * 4;
  const red = data[offset], green = data[offset + 1], blue = data[offset + 2];
  return Math.min(red, green, blue) >= 125 &&
    Math.max(red, green, blue) - Math.min(red, green, blue) <= 17;
};
function seed(index) {
  if (seen[index] || !background(index)) return;
  seen[index] = 1;
  queue[tail++] = index;
}
for (let x = 0; x < width; x++) { seed(x); seed((height - 1) * width + x); }
for (let y = 0; y < height; y++) { seed(y * width); seed(y * width + width - 1); }
let head = 0;
while (head < tail) {
  const index = queue[head++];
  const x = index % width;
  const y = (index - x) / width;
  if (x > 0) seed(index - 1);
  if (x + 1 < width) seed(index + 1);
  if (y > 0) seed(index - width);
  if (y + 1 < height) seed(index + width);
}
for (let index = 0; index < seen.length; index++) data[index * 4 + 3] = seen[index] ? 0 : 255;
const fringe = cleanCharacterAlpha(data, width, height);
await sharp(data, { raw: { width, height, channels: 4 } }).png().toFile(target);
console.log(`Cleared ${tail} connected checker pixels and ${fringe} pale edge pixels.`);
