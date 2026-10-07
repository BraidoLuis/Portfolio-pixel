import type { Position } from "./collision-geometry";
import { EXTERIOR_OBJECTS } from "./exterior-map";
import { AMBIENT_FISH_POINTS, type ViewBounds } from "./exterior-life";

export const BUTTERFLY_HOMES = ["garden-flowers-0", "garden-flowers-3", "garden-flowers-4"]
  .map((id) => EXTERIOR_OBJECTS.find((object) => object.id === id)!)
  .map((object, index) => ({ x: object.x, y: object.y - 18, variant: index }));
export const LEAF_TREES = EXTERIOR_OBJECTS.filter(({ kind }) => ["pine", "oak", "pink"].includes(kind));
// Perched on an existing shore stone: no new obstacle or changes to the bank.
const shore = EXTERIOR_OBJECTS.find(({ id }) => id === "shore-15")!;
export const FROG_PERCH_DEPTH = (shore.depth ?? shore.y) + 1;
export const FROG_HOME = { x: shore.x, y: shore.y - shore.height + 6 };
export const FROG_LANDING = AMBIENT_FISH_POINTS.reduce((best, point) =>
  Math.hypot(point.x - FROG_HOME.x, point.y - FROG_HOME.y) <
  Math.hypot(best.x - FROG_HOME.x, best.y - FROG_HOME.y) ? point : best);
export const FIREFLY_HOMES = [BUTTERFLY_HOMES[0], BUTTERFLY_HOMES[1],
  EXTERIOR_OBJECTS.find(({ id }) => id === "reeds-0")!].map(({ x, y }) => ({ x, y: y - 12 }));

export function encounterBounds(home: Position, radius = 64): ViewBounds {
  return { x: home.x - radius, y: home.y - radius, width: radius * 2, height: radius * 2 };
}

/** A pass triggers one encounter. Waiting nearby cannot start an endless loop. */
export class ProximityEncounter {
  startedAt?: number;
  private armed = true;
  private readyAt = 0;
  constructor(readonly home: Position, readonly radius: number, readonly duration: number,
    readonly cooldown: number, readonly returnWhenAway = false) {}

  update(now: number, feet?: Position, enabled = true, allowStart = true): number | undefined {
    if (!enabled) { this.reset(); return undefined; }
    const distance = feet ? Math.hypot(feet.x - this.home.x, feet.y - this.home.y) : Infinity;
    if (distance > this.radius + 24) this.armed = true;
    if (this.startedAt !== undefined && now - this.startedAt >= this.duration &&
      (!this.returnWhenAway || distance > this.radius + 24)) {
      this.readyAt = this.startedAt + this.duration + this.cooldown;
      this.startedAt = undefined;
    }
    if (allowStart && this.startedAt === undefined && feet && distance < this.radius && this.armed && now >= this.readyAt) {
      this.startedAt = now;
      this.armed = false;
    }
    return this.startedAt === undefined ? undefined : Math.max(0, now - this.startedAt);
  }

  reset() { this.startedAt = undefined; this.armed = true; this.readyAt = 0; }
}

export function getButterflyFlight(home: Position, age: number, variant: number): Position {
  const progress = Math.min(1, age / 2800);
  const direction = variant % 2 ? -1 : 1;
  // Starts and ends at the flower, with a short loop and no rotation/blur.
  return { x: home.x + Math.sin(progress * Math.PI * 2) * 22 * direction,
    y: home.y - Math.sin(progress * Math.PI) * 30 };
}

export function getFrogLeap(age: number): Position {
  const progress = Math.min(1, age / 520);
  return { x: FROG_HOME.x + (FROG_LANDING.x - FROG_HOME.x) * progress,
    y: FROG_HOME.y + (FROG_LANDING.y - FROG_HOME.y) * progress - Math.sin(progress * Math.PI) * 28 };
}

export function getFirefly(home: Position, index: number, elapsedMs: number) {
  const phase = (elapsedMs + index * 1370 + Math.round(home.x * 7)) % 9000;
  if (phase >= 1700) return undefined;
  const progress = phase / 1700;
  return { x: home.x + (index - 1) * 16 + Math.sin(progress * Math.PI) * 4,
    y: home.y - index * 6 - Math.sin(progress * Math.PI) * 6,
    alpha: Math.sin(progress * Math.PI) * 0.72 };
}
