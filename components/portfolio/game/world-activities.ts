import type { Position } from "./collision-geometry";
import { EXTERIOR_OBJECTS, type WorldInteraction } from "./exterior-map";
import { canOccupyWorld } from "./world-walkability";

export type WorldActivityKind = "fish" | "flowers" | "stones";
export type WorldActivity = WorldInteraction & {
  id: WorldActivityKind;
  activity: WorldActivityKind;
  prompt: string;
  response?: string;
};

// All three activities reuse existing scenery and add no collision geometry.
const dock = EXTERIOR_OBJECTS.find((object) => object.id === "dock")!;
const flowers = EXTERIOR_OBJECTS.find((object) => object.id === "garden-flowers-0")!;
const stones = EXTERIOR_OBJECTS.find((object) => object.id === "accent-16")!;

export type FishingSpot = {
  position: Position;
  facing: "up";
  hand: Position;
  rodTip: Position;
  bobber: Position;
  exitCandidates: readonly Position[];
};

/** The complete 80px player's footprint stands on the existing dock. */
export const FISHING_SPOT: FishingSpot = {
  position: { x: dock.x, y: dock.y - 92 },
  facing: "up",
  hand: { x: dock.x + 14, y: dock.y - 84 },
  rodTip: { x: dock.x + 28, y: dock.y - 140 },
  bobber: { x: dock.x + 48, y: dock.y - 122 },
  exitCandidates: [
    { x: dock.x, y: dock.y - 40 },
    { x: dock.x, y: dock.y - 8 },
    { x: dock.x - 32, y: dock.y + 16 },
  ],
};

export const WORLD_ACTIVITIES: readonly WorldActivity[] = [
  {
    id: "fish", activity: "fish", objectId: dock.id,
    x: dock.x, y: dock.y - 60, radius: 56,
    label: "Pescar", prompt: "Pressione E para pescar",
  },
  {
    id: "flowers", activity: "flowers", objectId: flowers.id,
    x: flowers.x - 12, y: flowers.y + 18, radius: 54,
    label: "Observar as flores", prompt: "Pressione E para observar as flores",
    response: "As flores dançam com a brisa. Um instante de calma entre descobertas.",
  },
  {
    id: "stones", activity: "stones", objectId: stones.id,
    x: stones.x, y: stones.y - 20, radius: 48,
    label: "Examinar as pedras", prompt: "Pressione E para examinar as pedras",
    response: "Pedras lisas, marcadas pelo tempo. O lago guarda histórias silenciosas.",
  },
];

export const FISHING_CAST_DURATION = 900;
export const FISHING_BITE_AT = 4000;
export const FISHING_REEL_AT = 4350;
export const FISHING_CATCH_AT = 5200;
export const FISHING_READY_AT = 6500;
export type FishingPhase = "cast" | "waiting" | "bite" | "reel" | "caught" | "ready";

export function getFishingPhase(elapsedMs: number): FishingPhase {
  if (elapsedMs < FISHING_CAST_DURATION) return "cast";
  if (elapsedMs < FISHING_BITE_AT) return "waiting";
  if (elapsedMs < FISHING_REEL_AT) return "bite";
  if (elapsedMs < FISHING_CATCH_AT) return "reel";
  if (elapsedMs < FISHING_READY_AT) return "caught";
  return "ready";
}

/** Scene owns the clock/physics; a landed fish emits one event per attempt. */
export class FishingController {
  current: FishingSpot | null = null;
  phase: FishingPhase = "ready";
  private previous?: Position;
  private elapsed = 0;
  private catchReported = false;

  begin(previous: Position): FishingSpot | undefined {
    if (this.current || !canOccupyWorld(FISHING_SPOT.position)) return undefined;
    this.previous = { ...previous };
    this.current = FISHING_SPOT;
    this.startAttempt();
    return this.current;
  }

  /** E starts another attempt only after the previous fish has been displayed. */
  retry(): boolean {
    if (!this.current || this.phase !== "ready") return false;
    this.startAttempt();
    return true;
  }

  tick(elapsedMs: number): { phase: FishingPhase; caught: boolean } {
    if (!this.current) return { phase: this.phase, caught: false };
    this.elapsed = Math.max(this.elapsed, Number.isFinite(elapsedMs) ? elapsedMs : 0);
    this.phase = getFishingPhase(this.elapsed);
    const caught = this.elapsed >= FISHING_CATCH_AT && !this.catchReported;
    if (caught) this.catchReported = true;
    return { phase: this.phase, caught };
  }

  private startAttempt() {
    this.elapsed = 0;
    this.catchReported = false;
    this.phase = "cast";
  }

  leave(): Position | undefined {
    if (!this.current) return undefined;
    const candidates = [...this.current.exitCandidates, ...(this.previous ? [this.previous] : [])];
    const exit = candidates.find(canOccupyWorld);
    if (!exit) return undefined;
    this.reset();
    return { ...exit };
  }

  reset() {
    this.current = null;
    this.previous = undefined;
    this.elapsed = 0;
    this.catchReported = false;
    this.phase = "ready";
  }
}

/** Shared deterministic world-space motion for rendering, previews and tests. */
export function getFishingAnimation(spot: FishingSpot, elapsedMs: number) {
  const elapsed = Math.max(0, elapsedMs);
  const phase = getFishingPhase(elapsed);
  const progress = Math.min(1, elapsed / FISHING_CAST_DURATION);
  const eased = 1 - (1 - progress) ** 2;
  const castArc = Math.sin(progress * Math.PI);
  // Match the raised right hands in the two original cast frames. At release
  // the avatar changes to its held-rod pose and the grip returns to the hip.
  const handOffset = phase === "cast" ? progress < 0.45 ? { x: 4, y: -16 } : { x: 8, y: -34 } : { x: 0, y: 0 };
  const hand = { x: spot.hand.x + handOffset.x, y: spot.hand.y + handOffset.y };
  const bob = phase === "waiting" ? Math.sin((elapsed - FISHING_CAST_DURATION) * Math.PI * 2 / 1800) * 2 : 0;
  const biteProgress = Math.max(0, Math.min(1, (elapsed - FISHING_BITE_AT) / (FISHING_REEL_AT - FISHING_BITE_AT)));
  const reelProgress = Math.max(0, Math.min(1, (elapsed - FISHING_REEL_AT) / (FISHING_CATCH_AT - FISHING_REEL_AT)));
  const reelEase = 1 - (1 - reelProgress) ** 2;
  const isReeling = phase === "reel" || phase === "caught";
  const lifted = { x: spot.position.x + 36, y: spot.position.y - 44 };
  const fish = {
    x: spot.bobber.x + (lifted.x - spot.bobber.x) * reelEase,
    y: spot.bobber.y + (lifted.y - spot.bobber.y) * reelEase - Math.sin(reelProgress * Math.PI) * 34
      + (phase === "caught" ? Math.sin((elapsed - FISHING_CATCH_AT) / 100) * 2 : 0),
    visible: isReeling,
    wiggle: Math.sin(elapsed / 70),
  };
  const bobber = phase === "ready" ? { x: spot.hand.x + 14, y: spot.hand.y - 20 }
    : isReeling ? { x: fish.x + 4, y: fish.y - 12 }
      : {
        x: hand.x + (spot.bobber.x - hand.x) * eased + (phase === "bite" ? Math.sin(biteProgress * Math.PI * 4) * 3 : 0),
        y: hand.y + (spot.bobber.y - hand.y) * eased - castArc * 54 + bob
          + (phase === "bite" ? Math.sin(biteProgress * Math.PI) * 9 : 0),
      };
  const characterPose: "cast" | "hold" | "reel" = phase === "cast" ? "cast" : phase === "bite" || isReeling ? "reel" : "hold";
  return {
    phase,
    characterPose,
    poseProgress: phase === "cast" ? progress : phase === "bite" ? biteProgress * 0.25 : 0.25 + reelProgress * 0.75,
    progress,
    hand,
    rodTip: {
      x: spot.rodTip.x + handOffset.x - castArc * 18 - reelEase * 12,
      y: spot.rodTip.y + handOffset.y - castArc * 4 - reelEase * 8 + (phase === "bite" ? Math.sin(biteProgress * Math.PI * 2) * 4 : 0),
    },
    bobber,
    fish,
    ripplePhase: Math.max(0, elapsed - FISHING_CAST_DURATION) % 1600 / 1600,
    splash: elapsed >= FISHING_CAST_DURATION && elapsed < FISHING_CAST_DURATION + 240
      || elapsed >= FISHING_BITE_AT && elapsed < FISHING_REEL_AT + 200,
    settled: phase === "waiting" || phase === "bite",
    waterActive: elapsed >= FISHING_CAST_DURATION && elapsed < FISHING_CATCH_AT,
  };
}
