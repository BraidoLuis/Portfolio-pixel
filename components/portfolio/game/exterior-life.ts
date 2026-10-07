import type { Position } from "./collision-geometry";
import { EXTERIOR_OBJECTS, EXTERIOR_TILES, TILE_SIZE, type ExteriorObject } from "./exterior-map";

export type ViewBounds = { x: number; y: number; width: number; height: number };
export const AMBIENT_FISH_INTERVAL_MS = 2000;
export const AMBIENT_FISH_AIR_MS = 680;
export const AMBIENT_FISH_DURATION_MS = 1280;

export function inView(bounds: ViewBounds, view?: ViewBounds): boolean {
  return !view || bounds.x + bounds.width >= view.x && bounds.x <= view.x + view.width &&
    bounds.y + bounds.height >= view.y && bounds.y <= view.y + view.height;
}

/** Includes the entire fish arc, spray and final ripple, not just its origin. */
export function fishEnvelope(point: Position): ViewBounds {
  return { x: point.x - 28, y: point.y - 34, width: 56, height: 50 };
}

export function isOpenWater(bounds: ViewBounds): boolean {
  const right = bounds.x + bounds.width;
  const bottom = bounds.y + bounds.height;
  for (let row = Math.floor(bounds.y / TILE_SIZE); row <= Math.floor((bottom - 0.001) / TILE_SIZE); row += 1) {
    for (let column = Math.floor(bounds.x / TILE_SIZE); column <= Math.floor((right - 0.001) / TILE_SIZE); column += 1) {
      if (EXTERIOR_TILES[row]?.[column] !== "water") return false;
    }
  }
  // Conservative sprite bounds also exclude lilies, reeds, shore stones and dock.
  return !EXTERIOR_OBJECTS.some((object) => bounds.x < object.x + object.width / 2 + 2 &&
    right > object.x - object.width / 2 - 2 && bounds.y < object.y + 2 && bottom > object.y - object.height - 2);
}

/** Generated once from the existing terrain; no per-frame map/object scans. */
export const AMBIENT_FISH_POINTS: readonly Position[] = EXTERIOR_TILES.flatMap((row, y) =>
  row.flatMap((tile, x) => tile !== "water" ? [] : [4, 8, 12, 16, 20, 24, 28].flatMap((dy) =>
    [4, 8, 12, 16, 20, 24, 28].flatMap((dx) => {
      const point = { x: x * TILE_SIZE + dx, y: y * TILE_SIZE + dy };
      return isOpenWater(fishEnvelope(point)) ? [point] : [];
    }),
  )),
).sort((a, b) => randomUnit(a.x * 1280 + a.y) - randomUnit(b.x * 1280 + b.y));

function randomUnit(value: number): number {
  let bits = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  bits = Math.imul(bits ^ (bits >>> 16), 0x45d9f3b);
  return ((bits ^ (bits >>> 16)) >>> 0) / 4294967296;
}

/** World-clock slots prevent catch-up bursts after hidden tabs or slow frames. */
export function getAmbientFishJump(elapsedMs: number, seed: number) {
  const slot = Math.floor(Math.max(0, elapsedMs) / AMBIENT_FISH_INTERVAL_MS);
  const age = elapsedMs - slot * AMBIENT_FISH_INTERVAL_MS;
  if (slot < 1 || age >= AMBIENT_FISH_DURATION_MS || !AMBIENT_FISH_POINTS.length) return undefined;
  // Alternate two shuffled pools so consecutive jumps never share a point.
  // Each slot makes a fresh random selection, with a seed for reproducible QA.
  const parity = AMBIENT_FISH_POINTS.length > 1 ? slot % 2 : 0;
  const poolSize = Math.ceil((AMBIENT_FISH_POINTS.length - parity) / 2);
  const index = Math.floor(randomUnit(seed + slot * 101) * poolSize) * 2 + parity;
  const center = AMBIENT_FISH_POINTS[index];
  const direction = randomUnit(seed + slot * 17) < 0.5 ? -1 : 1;
  const travel = 16 + Math.floor(randomUnit(seed + slot * 31) * 9);
  const height = 22 + randomUnit(seed + slot * 47) * 8;
  const progress = Math.min(1, age / AMBIENT_FISH_AIR_MS);
  const x = center.x + direction * (progress - 0.5) * travel;
  return {
    slot, age, center, direction,
    variant: Math.floor(randomUnit(seed + slot * 71) * 3),
    fish: { x, y: center.y + 6 - Math.sin(progress * Math.PI) * height },
    entry: { x: center.x - direction * travel / 2, y: center.y },
    landing: { x: center.x + direction * travel / 2, y: center.y },
    airborne: age < AMBIENT_FISH_AIR_MS,
    rippleProgress: Math.max(0, (age - AMBIENT_FISH_AIR_MS) / (AMBIENT_FISH_DURATION_MS - AMBIENT_FISH_AIR_MS)),
  };
}

/** Distance uses the feet, with a wider reach for overhanging tree crowns. */
export function getFoliageOffset(object: ExteriorObject, feet: Position, elapsedMs: number): number {
  const tree = object.kind === "pine" || object.kind === "oak" || object.kind === "pink";
  const radiusX = tree ? object.width / 2 + 30 : object.width / 2 + 18;
  const radiusY = tree ? 58 : 30;
  const distance = Math.hypot((feet.x - object.x) / radiusX, (feet.y - object.y + 12) / radiusY);
  if (distance >= 1) return 0;
  const strength = Math.min(1, (1 - distance) * 3);
  const phase = object.x * 0.07 + object.y * 0.03;
  // Integer source-pixel steps, no rotations or blurred scaling.
  return Math.round(Math.sin(elapsedMs / (tree ? 230 : 180) + phase) * strength) * 2;
}
