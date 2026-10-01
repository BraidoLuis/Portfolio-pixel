// The artwork is pixel-classified, never blurred or made translucent. Integrating
// a small smooth kernel over the neighboring cells rounds both convex AND
// concave bends while retaining the walkable grid as the gameplay authority.
const RADIUS = 15.5;
const neighborBits = [[7, 0, 1], [6, 8, 2], [5, 4, 3]];

function integral(distance) {
  const value = Math.max(0, Math.min(1, (distance + RADIUS) / (RADIUS * 2)));
  return value * value * (3 - 2 * value);
}

function axisWeights(coordinate) {
  const before = integral(-coordinate);
  const through = integral(16 - coordinate);
  return [before, through - before, 1 - through];
}

export function dirtCoverage(mask, x, y) {
  const horizontal = axisWeights(x + 0.5);
  const vertical = axisWeights(y + 0.5);
  let coverage = 0;
  for (let row = 0; row < 3; row++) for (let column = 0; column < 3; column++) {
    if (mask & (1 << neighborBits[row][column])) coverage += horizontal[column] * vertical[row];
  }
  return coverage;
}

export function groundEdge(mask, x, y, variant) {
  // A continuous 32px field joins between tiles, rather than repeating the same
  // tuft at every border. Texture variant bit 2 never moves a shared boundary.
  const px = x + (variant & 1) * 16 + 0.5;
  const py = y + ((variant >> 1) & 1) * 16 + 0.5;
  const angle = Math.PI * 2 / 32;
  const ripple = Math.sin((px * 3 + py) * angle) * 0.025 +
    Math.sin((px + py * 2) * angle) * 0.017 +
    Math.sin((px * 7 - py * 3) * angle) * 0.009;
  return dirtCoverage(mask, x, y) - 0.5 + ripple;
}
