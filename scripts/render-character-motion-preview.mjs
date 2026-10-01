import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const output = fileURLToPath(new URL("docs/character-motion/", root));
await mkdir(output, { recursive: true });
const atlas = fileURLToPath(new URL("public/game/character-motion/atlas.png", root));
const { frames } = JSON.parse(await readFile(new URL("public/game/character-motion/atlas.json", root), "utf8"));
const layers = [];
const rows = ["up-right", "up-left", "down-right", "down-left", "fishing"];
const labels = ["Nordeste", "Noroeste", "Sudeste", "Sudoeste", "Arremesso / recolher / espera"];
const w = 1040, h = 650;
let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#20272a"/><g fill="#f7dc9a" font-family="sans-serif" font-size="16"><text x="175" y="25">Masculino</text><text x="675" y="25">Feminino</text>`;
for (const [row, direction] of rows.entries()) {
  svg += `<text x="12" y="${row * 120 + 55}">${labels[row]}</text>`;
  for (const [characterIndex, character] of ["masculine", "feminine"].entries()) for (let frame = 0; frame < 4; frame++) {
    const name = direction === "fishing"
      ? `${character}-${["cast-0", "cast-1", "reel", "hold"][frame]}`
      : `${character}-${direction}-${frame}`;
    const { x, y, w, h } = frames[name].frame;
    layers.push({ input: await sharp(atlas).extract({ left: x, top: y, width: w, height: h })
      .resize(96, 96, { kernel: "nearest" }).png().toBuffer(), left: characterIndex * 500 + frame * 100 + 40, top: row * 120 + 50 });
  }
}
svg += "</g></svg>";
await sharp(Buffer.from(svg)).composite(layers).png().toFile(`${output}/motion-preview.png`);
console.log("Motion contact sheet written: docs/character-motion/motion-preview.png");
