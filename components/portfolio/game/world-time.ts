/** Four real-time minutes per day. The game owns one monotonic clock outside
 * either scene, so entering the house does not restart the sky or the lamps. */
export const WORLD_DAY_DURATION_MS = 240_000;

export type WorldLighting = {
  phase: number;
  period: "day" | "dusk" | "night" | "dawn";
  darkness: number;
  warmth: number;
  lamps: number;
};

const smooth = (fraction: number) => {
  const t = Math.max(0, Math.min(1, fraction));
  return t * t * (3 - 2 * t);
};

/** Pure and periodic; the minimap and house deliberately do not use this tint. */
export function getWorldLighting(elapsedMs: number, durationMs = WORLD_DAY_DURATION_MS): WorldLighting {
  const duration = Math.max(1, durationMs);
  const phase = ((elapsedMs % duration) + duration) % duration / duration;
  if (phase < 0.42) return { phase, period: "day", darkness: 0, warmth: 0, lamps: 0 };
  if (phase < 0.62) {
    const t = smooth((phase - 0.42) / 0.2);
    return { phase, period: "dusk", darkness: t * 0.52, warmth: Math.sin(t * Math.PI) * 0.19, lamps: smooth((t - 0.26) / 0.6) };
  }
  if (phase < 0.8) return { phase, period: "night", darkness: 0.52, warmth: 0, lamps: 1 };
  const t = smooth((phase - 0.8) / 0.2);
  return { phase, period: "dawn", darkness: (1 - t) * 0.52, warmth: Math.sin(t * Math.PI) * 0.13, lamps: 1 - smooth(t / 0.74) };
}
