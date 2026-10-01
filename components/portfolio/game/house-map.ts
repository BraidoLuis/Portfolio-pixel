import type { PanelType } from "../store/portfolio-store";
import type { Position } from "./collision-geometry";
import type { CollisionBox, RectangleArea } from "./world-config";

/** One logical pixel is displayed at 2x, exactly as in the exterior atlas. */
export const HOUSE_TILE_SIZE = 32;
export const HOUSE_PLAYER_SIZE = 96;
export const HOUSE_COLUMNS = 30;
export const HOUSE_ROWS = 30;

export type HouseObjectKind =
  | "tv" | "window" | "table" | "chair" | "fireplace" | "bed"
  | "plant" | "rug" | "chest" | "door";

export type HouseObject = {
  id: string;
  kind: HouseObjectKind;
  /** Bottom-center sprite anchor in world coordinates. */
  x: number;
  y: number;
  width: number;
  height: number;
  depth?: number;
  flipX?: boolean;
  collision?: CollisionBox;
};

export type HouseRestId = "chair-left" | "chair-right" | "bed";
export type HouseInteraction = {
  id: string;
  objectId: string;
  x: number;
  y: number;
  radius: number;
  label: string;
  panel?: Exclude<PanelType, null>;
  destination?: "house" | "world";
  action?: "toggle-fire";
  restId?: HouseRestId;
  sound?: "chest-open" | "door-open" | "tv-turn-on" | "ui-select";
};

export type HouseRestSpot = {
  id: HouseRestId;
  kind: "sit" | "lie";
  /** Center of the posed character, rather than its feet. */
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  facing: "left" | "right" | "down";
  exitCandidates: Position[];
};

// Frames 0–3 are floorboards, 4–7 paneling, 8/9 structural beams,
// 10 dark foundation, and 11 the entry threshold. -1 leaves black space.
const tiles: number[][] = Array.from({ length: HOUSE_ROWS }, () =>
  Array<number>(HOUSE_COLUMNS).fill(-1));

for (let row = 1; row <= 27; row += 1) {
  for (let column = 1; column <= 28; column += 1) {
    if (column === 1 || column === 28) {
      tiles[row][column] = 9;
    } else if (row === 1 || row === 27) {
      tiles[row][column] = 8;
    } else if (row < 7) {
      tiles[row][column] = 4 + ((column + Math.floor(row / 2)) % 4);
    } else {
      tiles[row][column] = (column + row * 3 + Math.floor(column / 3)) % 4;
    }
  }
}
for (let row = 27; row <= 28; row += 1) {
  for (let column = 13; column <= 16; column += 1) tiles[row][column] = 11;
}

export const HOUSE_TILES: readonly (readonly number[])[] = tiles;

/** Rectangles describe the same floor tile runs; no traced background polygons. */
export const HOUSE_FLOOR_AREAS: RectangleArea[] = [
  { x: 2 * HOUSE_TILE_SIZE, y: 7 * HOUSE_TILE_SIZE, width: 26 * HOUSE_TILE_SIZE, height: 20 * HOUSE_TILE_SIZE },
  { x: 13 * HOUSE_TILE_SIZE, y: 27 * HOUSE_TILE_SIZE, width: 4 * HOUSE_TILE_SIZE, height: 2 * HOUSE_TILE_SIZE },
];

export const HOUSE_OBJECTS: readonly HouseObject[] = [
  { id: "window", kind: "window", x: 312, y: 208, width: 128, height: 128, depth: 2 },
  { id: "rug", kind: "rug", x: 400, y: 600, width: 192, height: 128, depth: 1 },
  { id: "tv", kind: "tv", x: 176, y: 352, width: 160, height: 192,
    collision: { x: 176, y: 312, width: 144, height: 80 } },
  { id: "table", kind: "table", x: 480, y: 336, width: 128, height: 112, depth: 340,
    collision: { x: 480, y: 296, width: 112, height: 80 } },
  { id: "chair-left", kind: "chair", x: 384, y: 336, width: 64, height: 96,
    collision: { x: 384, y: 310, width: 40, height: 52 } },
  { id: "chair-right", kind: "chair", x: 576, y: 336, width: 64, height: 96, flipX: true,
    collision: { x: 576, y: 310, width: 40, height: 52 } },
  { id: "fireplace", kind: "fireplace", x: 768, y: 352, width: 224, height: 320,
    collision: { x: 768, y: 304, width: 192, height: 96 } },
  { id: "bed", kind: "bed", x: 784, y: 848, width: 176, height: 304,
    collision: { x: 784, y: 714, width: 160, height: 268 } },
  { id: "tutorial", kind: "chest", x: 624, y: 784, width: 64, height: 80,
    collision: { x: 624, y: 756, width: 56, height: 56 } },
  { id: "plant", kind: "plant", x: 144, y: 816, width: 96, height: 144,
    collision: { x: 144, y: 790, width: 56, height: 52 } },
  { id: "exit", kind: "door", x: 480, y: 944, width: 192, height: 112, depth: 2 },
];

export const HOUSE_COLLISIONS: CollisionBox[] = HOUSE_OBJECTS.flatMap((object) =>
  object.collision ? [object.collision] : []);

export const HOUSE_INTERACTIONS: readonly HouseInteraction[] = [
  { id: "tutorial", objectId: "tutorial", x: 624, y: 784, radius: 84,
    label: "Abrir guia do portfólio", panel: "intro", sound: "chest-open" },
  { id: "tv", objectId: "tv", x: 176, y: 352, radius: 98,
    label: "Ligar TV", panel: "tv", sound: "tv-turn-on" },
  { id: "fireplace", objectId: "fireplace", x: 768, y: 352, radius: 104,
    label: "Apagar lareira", action: "toggle-fire" },
  { id: "chair-left", objectId: "chair-left", x: 384, y: 344, radius: 66,
    label: "Sentar na cadeira", restId: "chair-left", sound: "ui-select" },
  { id: "chair-right", objectId: "chair-right", x: 576, y: 344, radius: 66,
    label: "Sentar na cadeira", restId: "chair-right", sound: "ui-select" },
  { id: "bed", objectId: "bed", x: 680, y: 688, radius: 84,
    label: "Deitar na cama", restId: "bed", sound: "ui-select" },
  { id: "exit", objectId: "exit", x: 480, y: 880, radius: 54,
    label: "Sair da casa", destination: "world", sound: "door-open" },
];

export const HOUSE_REST_SPOTS: readonly HouseRestSpot[] = [
  { id: "chair-left", kind: "sit", x: 392, y: 278, width: 96, height: 96,
    depth: 337, facing: "right",
    exitCandidates: [{ x: 352, y: 326 }, { x: 384, y: 344 }, { x: 328, y: 288 }] },
  { id: "chair-right", kind: "sit", x: 568, y: 278, width: 96, height: 96,
    depth: 337, facing: "left",
    exitCandidates: [{ x: 608, y: 326 }, { x: 576, y: 344 }, { x: 632, y: 288 }] },
  { id: "bed", kind: "lie", x: 784, y: 650, width: 64, height: 128,
    depth: 850, facing: "down",
    exitCandidates: [{ x: 680, y: 656 }, { x: 680, y: 688 }, { x: 752, y: 518 }] },
];

const chest = HOUSE_OBJECTS.find((object) => object.id === "tutorial")!;
export const HOUSE_MARKER = { x: chest.x, y: chest.y - chest.height - 20 };
export const HOUSE_LIGHTS = {
  fire: { x: 768, y: 280 },
} as const;
export const HOUSE_SPAWN = { x: 480, y: 808 } as const;
