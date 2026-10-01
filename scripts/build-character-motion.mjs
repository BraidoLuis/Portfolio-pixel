import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { cleanCharacterAlpha } from "./character-alpha.mjs";

const root = new URL("../", import.meta.url);
const source = fileURLToPath(new URL("docs/character-motion/", root));
const output = fileURLToPath(new URL("public/game/character-motion/", root));
await mkdir(output, { recursive: true });
const frames = {};
const composites = [];
const columns = 8;
const frameSize = 256;
let frameIndex = 0;

async function addFrame(name, nativeFrame) {
  const { data, info } = await sharp(nativeFrame).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  cleanCharacterAlpha(data, info.width, info.height, 2);
  const input = await sharp(data, { raw: info }).resize(frameSize, frameSize, { kernel: "nearest" }).png().toBuffer();
  const x = frameIndex % columns * frameSize;
  const y = Math.floor(frameIndex / columns) * frameSize;
  frames[name] = { frame: { x, y, w: frameSize, h: frameSize }, rotated: false, trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: frameSize, h: frameSize }, sourceSize: { w: frameSize, h: frameSize } };
  composites.push({ input, left: x, top: y });
  frameIndex++;
}

for (const character of ["masculine", "feminine"]) {
  const filename = `${source}/${character}-source.png`;
  const { width, height } = await sharp(filename).metadata();
  const nativeFrames = [];
  for (let row = 0; row < 3; row++) for (let column = 0; column < 4; column++) {
    const left = Math.floor(column * width / 4);
    const top = Math.floor(row * height / 3);
    const cellWidth = Math.floor((column + 1) * width / 4) - left;
    const cellHeight = Math.floor((row + 1) * height / 3) - top;
    const { data, info } = await sharp(filename).extract({ left, top, width: cellWidth, height: cellHeight })
      .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] < 128) continue;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x);
      y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    if (x1 < x0 || y1 < y0) throw new Error(`Empty source pose ${character}:${row},${column}`);
    if (x0 === 0 && y0 === 0 && x1 === info.width - 1 && y1 === info.height - 1) {
      throw new Error(`Source must have real transparent alpha: ${filename}`);
    }
    // The original 256px walk frames have ~208px bodies and a 236px foot baseline.
    // Compile to a 64px native grid, then enlarge without interpolation.
    const sprite = await sharp(data, { raw: info }).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
      .resize(52, 52, { fit: "inside", kernel: "nearest" }).raw().toBuffer({ resolveWithObject: true });
    for (let offset = 3; offset < sprite.data.length; offset += 4) sprite.data[offset] = sprite.data[offset] >= 128 ? 255 : 0;
    const body = await sharp(sprite.data, { raw: sprite.info }).png({ palette: true, colours: 48, dither: 0 }).toBuffer();
    nativeFrames.push(await sharp({ create: { width: 64, height: 64, channels: 4, background: "#00000000" } })
      .composite([{ input: body, left: Math.floor((64 - sprite.info.width) / 2), top: 59 - sprite.info.height }]).png().toBuffer());
  }
  for (const [row, rightDirection, leftDirection] of [[0, "up-right", "up-left"], [1, "down-right", "down-left"]]) {
    for (let frame = 0; frame < 4; frame++) {
      const nativeFrame = nativeFrames[row * 4 + frame];
      await addFrame(`${character}-${rightDirection}-${frame}`, nativeFrame);
      // Mirroring genuine three-quarter drawings preserves direction without rotating a cardinal sprite.
      await addFrame(`${character}-${leftDirection}-${frame}`, await sharp(nativeFrame).flop().png().toBuffer());
    }
  }
  for (const [frame, pose] of ["cast-0", "cast-1", "reel", "hold"].entries()) {
    await addFrame(`${character}-${pose}`, nativeFrames[8 + frame]);
  }
}

const height = Math.ceil(frameIndex / columns) * frameSize;
await sharp({ create: { width: columns * frameSize, height, channels: 4, background: "#00000000" } })
  .composite(composites).png().toFile(`${output}/atlas.png`);
await writeFile(`${output}/atlas.json`, JSON.stringify({ frames, meta: {
  image: "atlas.png", size: { w: columns * frameSize, h: height }, scale: "1",
} }, null, 2) + "\n");
console.log(`Compiled ${frameIndex} motion frames: 32 diagonal walk frames + 8 fishing poses.`);
