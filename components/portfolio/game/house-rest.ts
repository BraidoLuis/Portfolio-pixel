import type { Position } from "./collision-geometry";
import { HOUSE_MARKER, HOUSE_REST_SPOTS, type HouseRestId, type HouseRestSpot } from "./house-map";
import { chooseFreeHouseExit } from "./house-walkability";

/** One physical key press performs one action, even across a change of pose. */
export class InteractionPressGate {
  private held = new Set<string>();
  private lastAcceptedAt = Number.NEGATIVE_INFINITY;

  press(code: string, repeat: boolean, now: number): boolean {
    if (repeat || this.held.has(code)) return false;
    this.held.add(code);
    return this.tap(now);
  }

  release(code: string) {
    this.held.delete(code);
  }

  /** Touch buttons share the keyboard cooldown but have no held key. */
  tap(now: number): boolean {
    if (!Number.isFinite(now) || now - this.lastAcceptedAt < 180) return false;
    this.lastAcceptedAt = now;
    return true;
  }

  reset() {
    this.held.clear();
    this.lastAcceptedAt = Number.NEGATIVE_INFINITY;
  }
}

/** Physics/rendering remain in Phaser; this owns entry and safe exit state. */
export class HouseRestController {
  current: HouseRestSpot | null = null;
  private previous?: Position;

  enter(id: HouseRestId, previous: Position): HouseRestSpot | undefined {
    if (this.current) return undefined;
    const spot = HOUSE_REST_SPOTS.find((candidate) => candidate.id === id);
    if (!spot) return undefined;
    this.previous = { ...previous };
    this.current = spot;
    return spot;
  }

  leave(): Position | undefined {
    if (!this.current) return undefined;
    const exit = chooseFreeHouseExit(this.current.id, this.previous);
    if (!exit) return undefined;
    this.reset();
    return exit;
  }

  reset() {
    this.current = null;
    this.previous = undefined;
  }
}

export function getRestPoseFrame(character: "masculine" | "feminine", kind: "sit" | "lie") {
  return `${character}-${kind}` as const;
}

/** World coordinates keep the marker attached during camera movement/zoom. */
export function getTutorialMarkerY(timeMs: number): number {
  return HOUSE_MARKER.y - Math.sin(timeMs * Math.PI * 2 / 1800) * 5;
}
