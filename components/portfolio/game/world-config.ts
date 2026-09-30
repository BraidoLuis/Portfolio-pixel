import { EXTERIOR_COLUMNS, EXTERIOR_ROWS, EXTERIOR_SPAWN, TILE_SIZE } from "./exterior-map";

import { HOUSE_SPAWN } from "./house-map";
export { HOUSE_COLLISIONS, HOUSE_FLOOR_AREAS } from "./house-map";

export type Point = [number, number];

/** Collision rectangles use a center anchor. */
export type CollisionBox = { x: number; y: number; width: number; height: number };

/** Floor/platform rectangles use their top-left corner. */
export type RectangleArea = { x: number; y: number; width: number; height: number };

export type ForegroundRegion = RectangleArea & {
  key: string;
  baseline: number;
  polygons: Point[][];
};

export const SCENE_SIZE = {
  house: { width: 960, height: 960 },
  world: { width: EXTERIOR_COLUMNS * TILE_SIZE, height: EXTERIOR_ROWS * TILE_SIZE },
} as const;

export const WORLD_PLAYER_SIZE = 80;

export const SPAWN_POINTS = {
  house: HOUSE_SPAWN,
  world: EXTERIOR_SPAWN,
} as const;
