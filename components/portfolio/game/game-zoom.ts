export const ZOOM_LIMITS = { min: -1, max: 3 } as const;

export type ZoomState = {
  area: "house" | "world";
  step: number;
  min: number;
  max: number;
};
