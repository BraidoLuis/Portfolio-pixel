/** Remove only light, nearly neutral pixels touching transparent exterior.
 * Skin, eyes and clothing highlights inside the silhouette stay intact. */
export function cleanCharacterAlpha(data, width, height, passes = 3) {
  let cleared = 0;
  for (let index = 0; index < width * height; index++) {
    const alpha = index * 4 + 3;
    data[alpha] = data[alpha] >= 128 ? 255 : 0;
  }
  for (let pass = 0; pass < passes; pass++) {
    const fringe = [];
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const offset = index * 4;
      if (!data[offset + 3]) continue;
      const r = data[offset], g = data[offset + 1], b = data[offset + 2];
      if (Math.min(r, g, b) < 170 || Math.max(r, g, b) - Math.min(r, g, b) > 25) continue;
      let exterior = false;
      for (let dy = -1; dy <= 1 && !exterior; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= width || yy >= height || !data[(yy * width + xx) * 4 + 3]) {
          exterior = true;
          break;
        }
      }
      if (exterior) fringe.push(index);
    }
    for (const index of fringe) data[index * 4 + 3] = 0;
    cleared += fringe.length;
    if (!fringe.length) break;
  }
  return cleared;
}
