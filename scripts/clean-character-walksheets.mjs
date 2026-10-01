import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { cleanCharacterAlpha } from "./character-alpha.mjs";

for (const character of ["masculine", "feminine"]) {
  const source = fileURLToPath(new URL(`../docs/character-motion/${character}-walksheet-source.png`, import.meta.url));
  const target = fileURLToPath(new URL(`../public/game/character-${character}-walksheet.png`, import.meta.url));
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const removed = cleanCharacterAlpha(data, info.width, info.height);
  await sharp(data, { raw: info }).png().toFile(target);
  console.log(`${character}: removed ${removed} pale fringe pixels; 16 original poses preserved.`);
}
