import type { PanelType } from "../store/portfolio-store";
import type { CollisionBox, RectangleArea } from "./world-config";

/** The renderer, collision system and auxiliary maps share this tile grid. */
export const TILE_SIZE = 32;
export const EXTERIOR_COLUMNS = 40;
export const EXTERIOR_ROWS = 40;
export type GroundTile = "grass" | "path" | "water" | "cliff" | "stairs";
export type ExteriorObjectKind =
  | "house" | "pine" | "oak" | "pink" | "chest" | "sign" | "rocks"
  | "stump" | "bush" | "flowers" | "fence" | "lantern" | "grass"
  | "reeds" | "lilies" | "dock";

export type ExteriorObject = {
  id: string;
  kind: ExteriorObjectKind;
  /** World-space foot/baseline anchor; every sprite uses origin (0.5, 1). */
  x: number;
  y: number;
  width: number;
  height: number;
  collision?: CollisionBox;
  /** Platforms allow walking over water only while the whole footprint fits. */
  walkable?: RectangleArea;
  depth?: number;
};

export type WorldInteraction = {
  x: number;
  y: number;
  radius: number;
  label: string;
  panel?: Exclude<PanelType, null>;
  destination?: "house" | "world";
  sound?: "chest-open" | "door-open" | "map-open";
  objectId?: string;
};

const tiles: GroundTile[][] = Array.from(
  { length: EXTERIOR_ROWS },
  () => Array<GroundTile>(EXTERIOR_COLUMNS).fill("grass"),
);

function rectangle(kind: GroundTile, left: number, top: number, right: number, bottom: number) {
  for (let row = top; row <= bottom; row += 1) {
    for (let column = left; column <= right; column += 1) tiles[row][column] = kind;
  }
}

function clearing(column: number, row: number, radiusX: number, radiusY: number) {
  for (let y = Math.floor(row - radiusY); y <= Math.ceil(row + radiusY); y += 1) {
    for (let x = Math.floor(column - radiusX); x <= Math.ceil(column + radiusX); x += 1) {
      if (((x - column) / radiusX) ** 2 + ((y - row) / radiusY) ** 2 <= 1) {
        tiles[y][x] = "path";
      }
    }
  }
}

// Northern terrace and the broad junction joining all three upper chest areas.
rectangle("path", 18, 4, 21, 21);
clearing(19.5, 4.5, 3.5, 2.5);
clearing(9, 12, 4.5, 3.5);
clearing(30, 12, 4.5, 3.5);
rectangle("path", 10, 13, 29, 15);
rectangle("path", 15, 12, 24, 16);
rectangle("path", 25, 8, 28, 13);
rectangle("path", 27, 7, 30, 9);
rectangle("path", 29, 8, 31, 12);
// A little flower island divides the junction without narrowing either branch.
rectangle("grass", 19, 13, 20, 14);

// Continuous loop: north of the roof, both sides of the house, and the porch.
rectangle("path", 13, 20, 26, 21);
rectangle("path", 12, 21, 14, 30);
rectangle("path", 25, 21, 27, 30);
rectangle("path", 13, 30, 26, 32);
rectangle("path", 18, 28, 21, 39);
rectangle("path", 11, 29, 14, 31);
rectangle("path", 26, 29, 29, 31);
// Western steps link the upper clearing directly to the certification clearing.
rectangle("path", 9, 15, 11, 22);
rectangle("path", 10, 21, 13, 24);
clearing(6.5, 27.5, 3.5, 2.5);
rectangle("path", 8, 27, 13, 29);
// A short lakeside spur ends at the dock, clear of the eastern house route.
rectangle("path", 28, 30, 32, 31);

// Terraces use blocking cliff tiles, with explicit three/four-tile stair gaps.
rectangle("cliff", 0, 6, 9, 6);
rectangle("cliff", 10, 7, 17, 7);
rectangle("cliff", 22, 7, 24, 7);
rectangle("cliff", 32, 6, 39, 6);
rectangle("stairs", 18, 7, 21, 8);
rectangle("cliff", 0, 18, 8, 18);
rectangle("cliff", 12, 18, 17, 18);
rectangle("stairs", 9, 18, 11, 19);
rectangle("cliff", 23, 18, 35, 18);
rectangle("stairs", 36, 18, 38, 19);
rectangle("path", 36, 14, 38, 17);
rectangle("path", 34, 14, 36, 15);
rectangle("path", 36, 20, 38, 21);
rectangle("cliff", 0, 36, 5, 36);
rectangle("cliff", 34, 35, 39, 35);

// Organic pond outline, expressed as individual water tiles, never a polygon.
const pondRows = [
  [24, 32, 35], [25, 30, 37], [26, 30, 37],
  [27, 30, 37], [28, 31, 37], [29, 32, 36],
] as const;
pondRows.forEach(([row, left, right]) => rectangle("water", left, row, right, row));

export const EXTERIOR_TILES: readonly (readonly GroundTile[])[] = tiles;
const objects: ExteriorObject[] = [];

function object(
  id: string, kind: ExteriorObjectKind, x: number, y: number,
  width: number, height: number, collision?: CollisionBox,
  extra?: Pick<ExteriorObject, "depth" | "walkable">,
) {
  objects.push({ id, kind, x, y, width, height, ...(collision ? { collision } : {}), ...extra });
}

function trunk(x: number, y: number, width = 22, height = 18): CollisionBox {
  return { x, y: y - height / 2, width, height };
}

object("house", "house", 640, 928, 256, 256,
  { x: 640, y: 852, width: 192, height: 104 }, { depth: 912 });

const chests = [
  ["projects", 640, 160],
  ["skills-1", 256, 384], ["skills-2", 352, 384], ["skills-3", 304, 448],
  ["experiences-1", 928, 384], ["experiences-2", 1024, 384], ["experiences-3", 976, 448],
  ["certifications", 224, 896],
] as const;
chests.forEach(([id, x, y]) => {
  // The same 24px chest art stays crisp at integer 4x scale. Only its base
  // blocks movement; the terrace and the broad stair approach remain open.
  const projects = id === "projects";
  object(id, "chest", x, y, projects ? 96 : 48, projects ? 96 : 48,
    trunk(x, y, projects ? 80 : 40, projects ? 40 : 24));
});

const signs = [
  ["sign-north", 528, 352], ["sign-map", 768, 432],
  ["sign-chests", 720, 624], ["sign-exit", 736, 1000],
] as const;
signs.forEach(([id, x, y]) => object(id, "sign", x, y, 48, 64, trunk(x, y, 12, 16)));

object("dock", "dock", 1024, 976, 64, 96, undefined, {
  depth: 2,
  walkable: { x: 992, y: 892, width: 64, height: 84 },
});

// Hand-placed accents make the clearings and their approaches recognizable.
const accents = [
  ["stump", 528, 176], ["stump", 752, 176], ["rocks", 704, 336],
  ["rocks", 384, 160], ["rocks", 176, 48], ["rocks", 1120, 176],
  ["rocks", 352, 288], ["stump", 176, 240], ["stump", 752, 288],
  ["rocks", 512, 400], ["stump", 240, 544], ["rocks", 1120, 480],
  ["stump", 896, 560], ["rocks", 160, 720], ["stump", 352, 816],
  ["stump", 784, 968], ["rocks", 1024, 1056], ["stump", 352, 1072],
  ["rocks", 192, 1120], ["stump", 848, 1168], ["rocks", 976, 1184],
] as const;
accents.forEach(([kind, x, y], index) => object(`accent-${index}`, kind, x, y,
  kind === "rocks" ? 64 : 48, 48, trunk(x, y, kind === "rocks" ? 42 : 30, 22)));

// Fence runs protect the garden, leaving both 96-pixel side routes unobstructed.
[[512, 816], [512, 880], [768, 816], [768, 880]].forEach(([x, y], index) =>
  object(`garden-fence-${index}`, "fence", x, y, 64, 48, trunk(x, y, 52, 12)));
[[544, 1152], [736, 1152]].forEach(([x, y], index) =>
  object(`lantern-${index}`, "lantern", x, y, 48, 96, trunk(x, y, 16, 16)));

[[632, 460], [658, 472], [610, 466], [552, 968], [698, 968], [572, 876]].forEach(([x, y], index) =>
  object(`garden-flowers-${index}`, "flowers", x, y, 48, 48, undefined, { depth: 3 }));

// Shore stones follow the tile boundary, with an opening for the dock.
const shore = [
  [1012, 780], [1048, 772], [1084, 772], [1120, 780], [1152, 800],
  [1188, 816], [1206, 848], [1206, 884], [1198, 920], [1170, 952],
  [1134, 968], [1098, 968], [1070, 964], [988, 924], [964, 890],
  [950, 854], [956, 820], [980, 800],
];
shore.forEach(([x, y], index) => object(`shore-${index}`, "rocks", x, y, 32, 32,
  trunk(x, y, 22, 14)));
[[1080, 824], [1050, 870], [1112, 914]].forEach(([x, y], index) =>
  object(`lilies-${index}`, "lilies", x, y, 32, 32, undefined, { depth: 2 }));
[[1172, 912], [1100, 952]].forEach(([x, y], index) =>
  object(`reeds-${index}`, "reeds", x, y, 48, 48, undefined, { depth: 3 }));

function groundAt(x: number, y: number) {
  return tiles[Math.floor(y / TILE_SIZE)]?.[Math.floor(x / TILE_SIZE)];
}

function noise(x: number, y: number, salt = 0) {
  let value = Math.imul(x + 1, 374761393) + Math.imul(y + 1, 668265263) + Math.imul(salt + 1, 1442695041);
  value = Math.imul(value ^ value >>> 13, 1274126177);
  return ((value ^ value >>> 16) >>> 0) / 4294967296;
}

function nearLandmark(x: number, y: number, margin: number) {
  return chests.some(([, cx, cy]) => Math.hypot(cx - x, cy - y) < margin) ||
    signs.some(([, sx, sy]) => Math.hypot(sx - x, sy - y) < margin * 0.7) ||
    (x > 484 && x < 796 && y > 650 && y < 960);
}

// Deterministic groves: a canopy may overhang a route, while its feet never do.
for (let row = 0; row < 15; row += 1) {
  for (let column = 0; column < 16; column += 1) {
    const x = 32 + column * 80 + Math.floor(noise(column, row, 1) * 24);
    const y = 80 + row * 80 + Math.floor(noise(column, row, 2) * 24);
    if (y > 1272 || nearLandmark(x, y, 94)) continue;
    if (![-28, 0, 28].every((dx) => [-20, 0, 20].every((dy) => groundAt(x + dx, y + dy) === "grass"))) continue;
    if (objects.some((item) => item.collision && Math.hypot(item.x - x, item.y - y) < 58)) continue;
    if (noise(column, row, 3) < 0.2) continue;
    const kind = noise(column, row, 4) < 0.08 ? "pink" : noise(column, row, 5) < 0.5 ? "pine" : "oak";
    object(`grove-${column}-${row}`, kind, x, y, kind === "pine" ? 96 : 112, 128, trunk(x, y));
  }
}

// Small reusable botanical sprites soften tile edges without adding blockers.
for (let row = 1; row < 39; row += 1) {
  for (let column = 1; column < 39; column += 1) {
    if (tiles[row][column] !== "grass") continue;
    const chance = noise(column, row, 8);
    if (chance > 0.32) continue;
    const x = column * TILE_SIZE + 12 + Math.floor(noise(column, row, 9) * 12);
    const y = row * TILE_SIZE + 24;
    if (nearLandmark(x, y, 50)) continue;
    if (objects.some((item) => Math.hypot(item.x - x, item.y - y) < 28)) continue;
    const kind = chance < 0.12 ? "flowers" : chance < 0.18 ? "bush" : "grass";
    const size = kind === "bush" ? 48 : 32;
    object(`botanical-${column}-${row}`, kind, x, y, size, size, undefined,
      kind === "bush" ? undefined : { depth: 3 });
  }
}

// Added after the deterministic groves/botanicals so their existing positions
// never change. Every 16px base is entirely on grass, outside the path grid.
[[496, 736], [784, 752], [432, 624], [848, 560], [944, 1040]].forEach(([x, y], index) =>
  object(`path-lantern-${index}`, "lantern", x, y, 48, 96, trunk(x, y, 16, 16)));

export const EXTERIOR_OBJECTS: readonly ExteriorObject[] = objects;

export const WORLD_INTERACTIONS: WorldInteraction[] = [
  { x: 640, y: 132, radius: 132, label: "Projetos", panel: "projects", sound: "chest-open", objectId: "projects" },
  { x: 256, y: 368, radius: 88, label: "Habilidades", panel: "skills", sound: "chest-open", objectId: "skills-1" },
  { x: 352, y: 368, radius: 88, label: "Habilidades", panel: "skills", sound: "chest-open", objectId: "skills-2" },
  { x: 304, y: 432, radius: 88, label: "Habilidades", panel: "skills", sound: "chest-open", objectId: "skills-3" },
  { x: 928, y: 368, radius: 88, label: "Experiências", panel: "experiences", sound: "chest-open", objectId: "experiences-1" },
  { x: 1024, y: 368, radius: 88, label: "Experiências", panel: "experiences", sound: "chest-open", objectId: "experiences-2" },
  { x: 976, y: 432, radius: 88, label: "Experiências", panel: "experiences", sound: "chest-open", objectId: "experiences-3" },
  { x: 224, y: 880, radius: 96, label: "Certificações", panel: "certifications", sound: "chest-open", objectId: "certifications" },
  { x: 528, y: 326, radius: 78, label: "Caminho de Projetos", panel: "map", sound: "map-open", objectId: "sign-north" },
  { x: 768, y: 406, radius: 78, label: "Mapa geral", panel: "map", sound: "map-open", objectId: "sign-map" },
  { x: 720, y: 598, radius: 80, label: "Mapa dos baús", panel: "map", sound: "map-open", objectId: "sign-chests" },
  { x: 736, y: 974, radius: 82, label: "Ver caminho dos baús", panel: "map", sound: "map-open", objectId: "sign-exit" },
  { x: 640, y: 910, radius: 84, label: "Entrar na casa", destination: "house", sound: "door-open", objectId: "house" },
];

export const WORLD_LANDMARKS = [
  { id: "projects", label: "Projetos", number: 1, x: 640, y: 160 },
  { id: "skills", label: "Habilidades", number: 2, x: 304, y: 408 },
  { id: "experiences", label: "Experiências", number: 3, x: 976, y: 408 },
  { id: "certifications", label: "Certificações", number: 4, x: 224, y: 896 },
  { id: "house", label: "Casa", number: 5, x: 640, y: 896 },
] as const;

/** Sprite center on the front path; feet land at y=1001.4. */
export const EXTERIOR_SPAWN = { x: 640, y: 972 } as const;
