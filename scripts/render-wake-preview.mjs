import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { loadTypeScript } from "./check-exterior.mjs";

// Static composition from the existing room and actual pose/covers. The prompt
// uses a fallback font; Phaser's camera and text metrics still need browser QA.
const root = new URL("../", import.meta.url);
const assets = fileURLToPath(new URL("public/game/interior/", root));
const output = fileURLToPath(new URL("docs/interior-art/", root));
const { HOUSE_OBJECTS, HOUSE_REST_SPOTS } = loadTypeScript("components/portfolio/game/house-map.ts");
const { getRestPoseFrame } = loadTypeScript("components/portfolio/game/house-rest.ts");
const bed = HOUSE_OBJECTS.find((object) => object.id === "bed");
const spot = HOUSE_REST_SPOTS.find((item) => item.id === "bed");
const furniture = JSON.parse(await readFile(`${assets}/furniture.json`, "utf8"));
const poses = JSON.parse(await readFile(`${assets}/poses.json`, "utf8"));
const scene = await readFile(new URL("components/portfolio/game/phaser-game.tsx", root), "utf8");
const message = scene.match(/"(Um novo dia começa[^"\n]+)"/)?.[1];
assert(message, "Preview must use the production wake-up message");
const lines = message.split(/(?<=mundo\.) /);
async function sprite(atlasName, frameName, width, height) {
  const frame = (atlasName === "poses" ? poses : furniture).frames[frameName].frame;
  return sharp(`${assets}/${atlasName}.png`)
    .extract({ left: frame.x, top: frame.y, width: frame.w, height: frame.h })
    .resize(width, height, { kernel: "nearest" }).png().toBuffer();
}
const layers = [];
for (const [index, character] of ["masculine", "feminine"].entries()) {
  const prompt = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="354" height="62"><rect width="354" height="62" fill="#f6d99c"/>${lines.map((line, i) => `<text x="177" y="${24 + i * 23}" text-anchor="middle" font-family="monospace" font-size="17" font-weight="bold" fill="#4b2b22">${line}</text>`).join("")}</svg>`);
  const composed = await sharp(`${output}/room-preview.png`).composite([
    { input: await sprite("poses", getRestPoseFrame(character, "lie"), spot.width, spot.height), left: spot.x - spot.width / 2, top: spot.y - spot.height / 2 },
    { input: await sprite("furniture", "bed-cover", bed.width, bed.height), left: bed.x - bed.width / 2, top: bed.y - bed.height },
    { input: prompt, left: spot.x - 72 - 177, top: spot.y - spot.height / 2 - 12 - 62 },
  ]).png().toBuffer();
  const input = await sharp(composed).extract({ left: 448, top: 448, width: 448, height: 448 })
    .resize(672, 672, { kernel: "nearest" }).png().toBuffer();
  layers.push({ input, left: index * 672, top: 36 });
  const label = character === "masculine" ? "Masculino / nova partida" : "Feminino / nova partida";
  layers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="672" height="36"><text x="12" y="25" font-family="sans-serif" font-size="16" fill="#f5e4bd">${label}</text></svg>`), left: index * 672, top: 0 });
}
await sharp({ create: { width: 1344, height: 708, channels: 4, background: "#17110d" } })
  .composite(layers).png().toFile(`${output}/wake-up-preview.png`);
console.log(`Wake-up preview: ${output}/wake-up-preview.png`);
