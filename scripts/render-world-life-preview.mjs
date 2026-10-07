import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import { loadTypeScript } from "./check-exterior.mjs";

const { buildExterior } = loadTypeScript("components/portfolio/game/exterior-renderer.ts");
const atlas = JSON.parse(await readFile("public/game/exterior/objects.json", "utf8"));
const terrain = await sharp("public/game/exterior/terrain.png").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const sprites = new Map();
const width = 1280, height = 1280;
const output = process.argv[2] ?? "docs/exterior-art";

// Record the production renderer, including exact atmosphere depth/alpha and
// sprite dimensions, then rasterize its crisp pixel primitives without Phaser.
function createPreview() {
  const draws = [];
  const generated = new Map();
  let tileData;
  function item(kind, values = {}) {
    const node = {
      kind, depth: 0, x: 0, y: 0, alpha: 1, visible: true, rects: [], ...values,
      setDepth(value) { this.depth = value; return this; },
      setName(value) { this.name = value; return this; },
      setOrigin() { return this; },
      setX(x) { this.x = x; return this; },
      setCrop(x, y, width, height) { this.crop = { x, y, width, height }; return this; },
      generateTexture(key) { generated.set(key, this.rects.map((rect) => ({ ...rect, x: rect.x - 160, y: rect.y - 160 }))); return this; },
      setDisplaySize(w, h) { this.width = w; this.height = h; return this; },
      setPosition(x, y) { this.x = x; this.y = y; return this; },
      setAlpha(value) { this.alpha = value; return this; },
      setVisible(value) { this.visible = value; return this; },
      setScale() { return this; },
      fillStyle(color, alpha = 1) { this.fill = { color, alpha }; return this; },
      fillRect(x, y, w, h) { this.rects.push({ x, y, width: w, height: h, ...this.fill }); return this; },
      clear() { this.rects = []; return this; }, destroy() { this.visible = false; },
    };
    draws.push(node); return node;
  }
  const scene = {
    cameras: { main: { worldView: { x: 0, y: 0, width, height } } },
    textures: { exists(key) { return generated.has(key); } },
    make: { tilemap({ data }) { tileData = data; return { addTilesetImage() { return {}; }, createLayer() { return item("ground"); } }; } },
    add: {
      image(x, y, texture, frameName) {
        if (generated.has(texture)) return item("graphics", { x, y, rects: generated.get(texture) });
        const frame = atlas.frames[frameName].frame;
        return item("sprite", { x, y, frameName, frame: { width: frame.w, height: frame.h } });
      },
      graphics() { return item("graphics"); },
      rectangle(x, y, w, h, color) { return item("rectangle", { x, y, width: w, height: h, color }); },
    },
    events: { once() {}, off() {} },
  };
  const view = buildExterior(scene);
  const render = async (elapsed, file, feet) => {
    view.update(elapsed, feet);
    const data = Buffer.alloc(width * height * 4);
    const blend = (x, y, color, alpha) => {
      if (x < 0 || y < 0 || x >= width || y >= height || alpha <= 0) return;
      const p = (y * width + x) * 4;
      for (let channel = 0; channel < 3; channel++) data[p + channel] = Math.round(((color >>> (16 - channel * 8)) & 255) * alpha + data[p + channel] * (1 - alpha));
      data[p + 3] = 255;
    };
    const fill = (rect, node) => {
      const x = Math.round(rect.x + node.x), y = Math.round(rect.y + node.y);
      for (let sy = 0; sy < rect.height; sy++) for (let sx = 0; sx < rect.width; sx++) blend(x + sx, y + sy, rect.color, rect.alpha * node.alpha);
    };
    for (const node of draws.sort((a, b) => a.depth - b.depth)) {
      if (!node.visible || node.alpha <= 0) continue;
      if (node.kind === "ground") {
        const columns = terrain.info.width / 16;
        tileData.forEach((row, r) => row.forEach((frame, c) => {
          for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
            const source = ((Math.floor(frame / columns) * 16 + Math.floor(y / 2)) * terrain.info.width + frame % columns * 16 + Math.floor(x / 2)) * 4;
            const target = ((r * 32 + y) * width + c * 32 + x) * 4;
            terrain.data.copy(data, target, source, source + 4);
          }
        }));
      } else if (node.kind === "sprite") {
        const key = `${node.frameName}-${node.width}-${node.height}`;
        if (!sprites.has(key)) {
          const frame = atlas.frames[node.frameName].frame;
          sprites.set(key, await sharp("public/game/exterior/objects.png").extract({ left: frame.x, top: frame.y, width: frame.w, height: frame.h })
            .resize(node.width, node.height, { kernel: "nearest" }).ensureAlpha().raw().toBuffer());
        }
        const source = sprites.get(key);
        for (let y = 0; y < node.height; y++) for (let x = 0; x < node.width; x++) {
          if (node.crop) {
            const sx = x * node.frame.width / node.width, sy = y * node.frame.height / node.height;
            if (sx < node.crop.x || sx >= node.crop.x + node.crop.width || sy < node.crop.y || sy >= node.crop.y + node.crop.height) continue;
          }
          const p = (y * node.width + x) * 4;
          blend(Math.round(node.x - node.width / 2 + x), Math.round(node.y - node.height + y), (source[p] << 16) | (source[p + 1] << 8) | source[p + 2], source[p + 3] / 255);
        }
      } else if (node.kind === "rectangle") fill({ x: -node.width / 2, y: -node.height / 2, width: node.width, height: node.height, color: node.color, alpha: 1 }, node);
      else node.rects.forEach((rect) => fill(rect, node));
    }
    if (file) await sharp(data, { raw: { width, height, channels: 4 } }).png().toFile(file);
    return data;
  };
  return { render, destroy: () => view.destroy() };
}
await mkdir(output, { recursive: true });
const preview = createPreview();
const render = preview.render;
await render(24_000, `${output}/day-preview.png`);
await render(168_000, `${output}/night-preview.png`);
await sharp(`${output}/day-preview.png`).extract({ left: 480, top: 48, width: 320, height: 304 }).resize(640, 608, { kernel: "nearest" }).toFile(`${output}/projects-preview.png`);
preview.destroy();
console.log("Rendered day, night and Projects chest directly from production exterior + atmosphere draw calls.");

if (process.argv.includes("--motion")) {
  const { EXTERIOR_OBJECTS } = loadTypeScript("components/portfolio/game/exterior-map.ts");
  const { BUTTERFLY_HOMES, FROG_HOME } = loadTypeScript("components/portfolio/game/environment-encounters.ts");
  const tree = EXTERIOR_OBJECTS.find(({ kind, x, y }) => kind === "oak" && x > 80 && x < 1200 && y > 144 && y < 1160);
  const originalRandom = Math.random;
  Math.random = () => 0.42; // Stable scene seed across recorded animation frames.
  try {
    for (const [period, base] of [["day", 24000], ["night", 168000]]) {
      const lakeFrames = [], foliageFrames = [], gardenFrames = [];
      const lakePreview = createPreview(), foliagePreview = createPreview(), gardenPreview = createPreview();
      for (let frame = 0; frame < 32; frame++) {
        const feet = { x: tree.x + (frame < 16 ? 26 + frame % 8 * 3 : 200), y: tree.y - 12 };
        const frogFeet = frame >= 2 && frame < 18 ? { x: FROG_HOME.x - 32, y: FROG_HOME.y } : undefined;
        const flowerFeet = frame >= 2 && frame < 24 ? { x: BUTTERFLY_HOMES[0].x + 24, y: BUTTERFLY_HOMES[0].y } : undefined;
        const data = await lakePreview.render(base + frame * 100, undefined, frogFeet);
        const foliageData = await foliagePreview.render(base + frame * 100, undefined, feet);
        const gardenData = await gardenPreview.render(base + frame * 100, undefined, flowerFeet);
        lakeFrames.push(await sharp(data, { raw: { width, height, channels: 4 } })
          .extract({ left: 920, top: 744, width: 320, height: 256 }).raw().toBuffer());
        foliageFrames.push(await sharp(foliageData, { raw: { width, height, channels: 4 } })
          .extract({ left: Math.round(tree.x - 96), top: Math.round(tree.y - 144), width: 192, height: 176 }).raw().toBuffer());
        gardenFrames.push(await sharp(gardenData, { raw: { width, height, channels: 4 } })
          .extract({ left: 560, top: 384, width: 160, height: 136 }).raw().toBuffer());
      }
      lakePreview.destroy(); foliagePreview.destroy(); gardenPreview.destroy();
      for (const [name, frames, w, h] of [["lake", lakeFrames, 320, 256], ["foliage", foliageFrames, 192, 176], ["garden", gardenFrames, 160, 136]]) {
        await sharp(Buffer.concat(frames), { raw: { width: w, height: h * frames.length, channels: 4, pageHeight: h } })
          .webp({ lossless: true, loop: 0, delay: 100 }).toFile(`${output}/${name}-${period}.webp`);
      }
    }
  } finally { Math.random = originalRandom; }
  console.log("Rendered reproducible lake/frog, foliage/leaves and garden/butterfly/firefly motion, day/night, using persistent production views.");
}
