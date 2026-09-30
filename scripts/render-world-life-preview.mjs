import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import { loadTypeScript } from "./check-exterior.mjs";

const { buildExterior } = loadTypeScript("components/portfolio/game/exterior-renderer.ts");
const atlas = JSON.parse(await readFile("public/game/exterior/objects.json", "utf8"));
const terrain = await sharp("public/game/exterior/terrain.png").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const sprites = new Map();
const width = 1280, height = 1280;

// Record the production renderer, including exact atmosphere depth/alpha and
// sprite dimensions, then rasterize its crisp pixel primitives without Phaser.
async function render(elapsed, file) {
  const draws = [];
  let tileData;
  function item(kind, values = {}) {
    const node = {
      kind, depth: 0, x: 0, y: 0, alpha: 1, visible: true, rects: [], ...values,
      setDepth(value) { this.depth = value; return this; },
      setName(value) { this.name = value; return this; },
      setOrigin() { return this; },
      setDisplaySize(w, h) { this.width = w; this.height = h; return this; },
      setPosition(x, y) { this.x = x; this.y = y; return this; },
      setAlpha(value) { this.alpha = value; return this; },
      setVisible(value) { this.visible = value; return this; },
      setScale() { return this; },
      fillStyle(color, alpha = 1) { this.fill = { color, alpha }; return this; },
      fillRect(x, y, w, h) { this.rects.push({ x, y, width: w, height: h, ...this.fill }); return this; },
      clear() { this.rects = []; return this; }, destroy() {},
    };
    draws.push(node); return node;
  }
  const scene = {
    make: { tilemap({ data }) { tileData = data; return { addTilesetImage() { return {}; }, createLayer() { return item("ground"); } }; } },
    add: {
      image(x, y, texture, frame) { return item("sprite", { x, y, frame }); },
      graphics() { return item("graphics"); },
      rectangle(x, y, w, h, color) { return item("rectangle", { x, y, width: w, height: h, color }); },
    },
    events: { once() {}, off() {} },
  };
  buildExterior(scene).update(elapsed);
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
      const key = `${node.frame}-${node.width}-${node.height}`;
      if (!sprites.has(key)) {
        const frame = atlas.frames[node.frame].frame;
        sprites.set(key, await sharp("public/game/exterior/objects.png").extract({ left: frame.x, top: frame.y, width: frame.w, height: frame.h })
          .resize(node.width, node.height, { kernel: "nearest" }).ensureAlpha().raw().toBuffer());
      }
      const source = sprites.get(key);
      for (let y = 0; y < node.height; y++) for (let x = 0; x < node.width; x++) {
        const p = (y * node.width + x) * 4;
        blend(Math.round(node.x - node.width / 2 + x), Math.round(node.y - node.height + y), (source[p] << 16) | (source[p + 1] << 8) | source[p + 2], source[p + 3] / 255);
      }
    } else if (node.kind === "rectangle") fill({ x: -node.width / 2, y: -node.height / 2, width: node.width, height: node.height, color: node.color, alpha: 1 }, node);
    else node.rects.forEach((rect) => fill(rect, node));
  }
  await sharp(data, { raw: { width, height, channels: 4 } }).png().toFile(file);
}
await mkdir("docs/exterior-art", { recursive: true });
await render(24_000, "docs/exterior-art/day-preview.png");
await render(168_000, "docs/exterior-art/night-preview.png");
await sharp("docs/exterior-art/day-preview.png").extract({ left: 480, top: 48, width: 320, height: 304 }).resize(640, 608, { kernel: "nearest" }).toFile("docs/exterior-art/projects-preview.png");
console.log("Rendered day, night and Projects chest directly from production exterior + atmosphere draw calls.");
