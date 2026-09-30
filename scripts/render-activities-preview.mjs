import { EventEmitter } from "node:events";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { loadTypeScript } from "./check-exterior.mjs";

const root = new URL("../", import.meta.url);
const assets = fileURLToPath(new URL("public/game/exterior/", root));
const output = fileURLToPath(new URL("docs/exterior-art/", root));
const { EXTERIOR_TILES, EXTERIOR_OBJECTS, TILE_SIZE } = loadTypeScript("components/portfolio/game/exterior-map.ts");
const { getExteriorTileFrame, EXTERIOR_TILE_SOURCE_SIZE } = loadTypeScript("components/portfolio/game/exterior-art.ts");
const { FISHING_SPOT, getFishingAnimation } = loadTypeScript("components/portfolio/game/world-activities.ts");
const { getFishingPoseFrame } = loadTypeScript("components/portfolio/game/character-motion.ts");
const { WORLD_PLAYER_SIZE } = loadTypeScript("components/portfolio/game/world-config.ts");
const { createFishingView } = loadTypeScript("components/portfolio/game/fishing-renderer.ts");
const atlas = JSON.parse(await readFile(`${assets}/objects.json`, "utf8"));
const motionAssets = fileURLToPath(new URL("public/game/character-motion/", root));
const motionAtlas = JSON.parse(await readFile(`${motionAssets}/atlas.json`, "utf8"));
const terrain = await sharp(`${assets}/terrain.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const crop = { x: 920, y: 744, size: 256 };
const ground = Buffer.alloc(crop.size * crop.size * 4);
const tileColumns = terrain.info.width / EXTERIOR_TILE_SOURCE_SIZE;
for (let y = 0; y < crop.size; y += 1) for (let x = 0; x < crop.size; x += 1) {
  const worldX = x + crop.x;
  const worldY = y + crop.y;
  const column = Math.floor(worldX / TILE_SIZE);
  const row = Math.floor(worldY / TILE_SIZE);
  const frame = getExteriorTileFrame(EXTERIOR_TILES[row][column], column, row);
  const sx = frame % tileColumns * EXTERIOR_TILE_SOURCE_SIZE + Math.floor(worldX % TILE_SIZE / 2);
  const sy = Math.floor(frame / tileColumns) * EXTERIOR_TILE_SOURCE_SIZE + Math.floor(worldY % TILE_SIZE / 2);
  const source = (sy * terrain.info.width + sx) * 4;
  terrain.data.copy(ground, (y * crop.size + x) * 4, source, source + 4);
}

const layers = [];
for (const object of EXTERIOR_OBJECTS) {
  const left = Math.round(object.x - object.width / 2 - crop.x);
  const top = Math.round(object.y - object.height - crop.y);
  if (left + object.width <= 0 || top + object.height <= 0 || left >= crop.size || top >= crop.size) continue;
  const frame = atlas.frames[object.kind].frame;
  const input = await sharp(`${assets}/objects.png`)
    .extract({ left: frame.x, top: frame.y, width: frame.w, height: frame.h })
    .resize(object.width, object.height, { kernel: "nearest" }).png().toBuffer();
  layers.push({ input, left, top, depth: object.depth ?? object.y });
}

const recorded = [];
const scene = {
  events: new EventEmitter(),
  add: {
    graphics() {
      const item = {
        rectangles: [],
        setDepth(value) { this.depth = value; return this; },
        setName() { return this; },
        fillStyle(color, alpha = 1) { this.color = color; this.alpha = alpha; return this; },
        fillRect(x, y, width, height) { this.rectangles.push({ x, y, width, height, color: this.color, alpha: this.alpha }); return this; },
        clear() { this.rectangles = []; return this; },
        destroy() {},
      };
      recorded.push(item);
      return item;
    },
  },
};
const view = createFishingView(scene, FISHING_SPOT);
async function graphicsBuffer(graphics) {
  const data = Buffer.alloc(crop.size * crop.size * 4);
  for (const rect of graphics.rectangles) {
    const red = rect.color >> 16 & 255;
    const green = rect.color >> 8 & 255;
    const blue = rect.color & 255;
    for (let y = Math.max(0, rect.y - crop.y); y < Math.min(crop.size, rect.y - crop.y + rect.height); y += 1) {
      for (let x = Math.max(0, rect.x - crop.x); x < Math.min(crop.size, rect.x - crop.x + rect.width); x += 1) {
        const index = (y * crop.size + x) * 4;
        const oldAlpha = data[index + 3] / 255;
        const alpha = rect.alpha + oldAlpha * (1 - rect.alpha);
        [red, green, blue].forEach((channel, component) => {
          data[index + component] = Math.round((channel * rect.alpha + data[index + component] * oldAlpha * (1 - rect.alpha)) / alpha);
        });
        data[index + 3] = Math.round(alpha * 255);
      }
    }
  }
  return sharp(data, { raw: { width: crop.size, height: crop.size, channels: 4 } }).png().toBuffer();
}

async function render(character, time) {
  view.update(time);
  const motion = getFishingAnimation(FISHING_SPOT, time);
  const pose = motion.characterPose === "cast" ? motion.poseProgress < 0.45 ? "cast-0" : "cast-1"
    : motion.characterPose === "reel" ? "reel" : "hold";
  const frame = motionAtlas.frames[getFishingPoseFrame(character, pose)].frame;
  const player = await sharp(`${motionAssets}/atlas.png`)
    .extract({ left: frame.x, top: frame.y, width: frame.w, height: frame.h })
    .resize(WORLD_PLAYER_SIZE, WORLD_PLAYER_SIZE, { kernel: "nearest" }).png().toBuffer();
  const sorted = [...layers, {
    input: player, left: FISHING_SPOT.position.x - WORLD_PLAYER_SIZE / 2 - crop.x,
    top: FISHING_SPOT.position.y - WORLD_PLAYER_SIZE / 2 - crop.y,
    depth: FISHING_SPOT.position.y + WORLD_PLAYER_SIZE * 0.43,
  }];
  for (const graphic of recorded) sorted.push({ input: await graphicsBuffer(graphic), left: 0, top: 0, depth: graphic.depth });
  sorted.sort((a, b) => a.depth - b.depth);
  const clipped = [];
  for (const layer of sorted) {
    const size = await sharp(layer.input).metadata();
    const left = Math.max(0, layer.left);
    const top = Math.max(0, layer.top);
    const width = Math.min(crop.size, layer.left + size.width) - left;
    const height = Math.min(crop.size, layer.top + size.height) - top;
    if (width <= 0 || height <= 0) continue;
    const input = await sharp(layer.input).extract({ left: left - layer.left, top: top - layer.top, width, height }).png().toBuffer();
    clipped.push({ input, left, top });
  }
  const composed = await sharp(ground, { raw: { width: crop.size, height: crop.size, channels: 4 } })
    .composite(clipped).png().toBuffer();
  return sharp(composed).resize(512, 512, { kernel: "nearest" }).png().toBuffer();
}

const sheet = [];
const steps = [[450, "Lançamento"], [4800, "Retirada"], [5500, "Peixe capturado"]];
for (const [row, character] of ["masculine", "feminine"].entries()) {
  for (const [column, [time, caption]] of steps.entries()) {
    sheet.push({ input: await render(character, time), left: column * 512, top: row * 548 + 36 });
    const label = `${character === "masculine" ? "Masculino" : "Feminino"} / ${caption} (${time} ms)`;
    const labelSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="36"><text x="12" y="25" font-family="sans-serif" font-size="16" fill="#f5e4bd">${label}</text></svg>`;
    sheet.push({ input: Buffer.from(labelSvg), left: column * 512, top: row * 548 });
  }
}
view.destroy();
await mkdir(output, { recursive: true });
await sharp({ create: { width: 1536, height: 1096, channels: 4, background: "#17110d" } })
  .composite(sheet).png().toFile(`${output}/fishing-preview.png`);
console.log(`Fishing preview uses actual tiles, scenery, character cast/reel frames and recorded fish/effect pixels: ${output}/fishing-preview.png`);
