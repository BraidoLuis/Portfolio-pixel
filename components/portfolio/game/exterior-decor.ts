/** Reusable native pixel pieces. All cells are 2px; no smooth vector outlines. */
export type PixelRect = { x: number; y: number; width: number; height: number; color: number; alpha: number };

const goldPalette: Record<string, number> = {
  o: 0x5b341d, d: 0x92601f, b: 0xc08b2b, g: 0xe7b745, y: 0xffdc69, h: 0xfff0af,
};
const pile = [
  "       ooo       ",
  "      ogygo      ",
  "     odhhydo     ",
  "   ooooggoooo    ",
  "  odgygoohygdo   ",
  " ogyhggoghhggo   ",
  " odggddoggdgdooo ",
  "ooghygodhyggyggo ",
  "odggbddggddggbdo ",
  " ooddooooodddoo  ",
];
const coin = [" ooo ", "oyhgo", "ogbgo", " odd "];

function piece(rows: readonly string[], palette: Record<string, number>, x: number, y: number, scale = 2): PixelRect[] {
  return rows.flatMap((row, rowIndex) => [...row].flatMap((key, column) => key === " " ? [] : [{
    x: x + column * scale, y: y + rowIndex * scale, width: scale, height: scale, color: palette[key], alpha: 1,
  }]));
}

// Treasure stays beside/behind the chest, leaving the southern approach empty.
export const PROJECTS_GOLD: readonly PixelRect[] = [
  ...piece(pile, goldPalette, 566, 150), ...piece(pile, goldPalette, 690, 150),
  ...piece(pile, goldPalette, 592, 108), ...piece(pile, goldPalette, 682, 106),
  ...piece(coin, goldPalette, 574, 178), ...piece(coin, goldPalette, 704, 178),
  ...piece(coin, goldPalette, 558, 162), ...piece(coin, goldPalette, 720, 158),
  ...piece(coin, goldPalette, 608, 98), ...piece(coin, goldPalette, 672, 94),
];

export const GOLD_SPARKLE_POINTS = [{ x: 580, y: 150 }, { x: 706, y: 162 }, { x: 604, y: 110 }];

/** Small stepped cloud clusters reuse a 4px source grid, softened only by opacity. */
const cloudRows = [
  "              aaaaaa                  ",
  "          aaaabbbbbbbaaaa              ",
  "       aaabbbcccccccccbbbaa            ",
  "      abbbcccccccccccccccbbbaa         ",
  "   aaabcccccccccccccccccccccbbba       ",
  " aabccccccccccccccccccccccccccbbbaa    ",
  "abcccccccccccccccccccccccccccccccbaa  ",
  "abbcccccccccccccccccccccccccccccccbba ",
  " aabbbbccccccccccccccccccccccccbbbbaa ",
  "   aaaabbbbbbbbbbbbbbbbbbbbbbbbaaaa   ",
  "       aaaaaaaaaaaaaaaaaaaaaaaa       ",
];
export const CLOUD_PIXELS = piece(cloudRows, { a: 0xa5bac2, b: 0xd1dcdc, c: 0xf5ecd5 }, 0, 0, 4);

/** Digital radial glow. Static per-pixel alpha avoids animated vector gradients. */
export const LANTERN_GLOW: readonly PixelRect[] = (() => {
  const pixels: PixelRect[] = [];
  for (let y = -160; y < 160; y += 4) for (let x = -160; x < 160; x += 4) {
    const distance = Math.hypot(x + 2, y + 2) / 160;
    if (distance >= 1) continue;
    pixels.push({ x, y, width: 4, height: 4, color: 0xffb752, alpha: (1 - distance) ** 1.25 * 0.62 });
  }
  return pixels;
})();

export function getCloudPosition(elapsedMs: number, index: number) {
  const period = 110_000;
  const phase = ((elapsedMs + index * 47_000) % period + period) % period;
  const active = phase < 76_000;
  return {
    active,
    x: Math.round((-170 + phase / 76_000 * 1620) / 2) * 2,
    y: index === 0 ? 332 : 864,
  };
}
