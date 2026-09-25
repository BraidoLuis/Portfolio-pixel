export type Point = [number, number];

export type CollisionBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RectangleArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ForegroundRegion = RectangleArea & {
  key: string;
  baseline: number;
  polygons: Point[][];
};

export const SCENE_SIZE = {
  // O interior original é quadrado. Usar a mesma proporção evita esticar o PNG.
  house: { width: 960, height: 960 },
  world: { width: 1254, height: 1254 },
} as const;

export const SPAWN_POINTS = {
  house: { x: 480, y: 808 },
  world: { x: 625, y: 990 },
} as const;

export const HOUSE_COLLISIONS: CollisionBox[] = [
  { x: 170, y: 256, width: 170, height: 205 },
  { x: 475, y: 264, width: 162, height: 131 },
  { x: 740, y: 248, width: 195, height: 211 },
  { x: 774, y: 674, width: 180, height: 315 },
  { x: 615, y: 728, width: 54, height: 77 },
  { x: 122, y: 712, width: 78, height: 147 },
];

export const WORLD_COLLISIONS: CollisionBox[] = [
  { x: 625, y: 103, width: 82, height: 72 },
  { x: 558, y: 135, width: 18, height: 58 },
  { x: 695, y: 135, width: 18, height: 58 },
  { x: 195, y: 390, width: 58, height: 56 },
  { x: 270, y: 390, width: 58, height: 56 },
  { x: 245, y: 455, width: 58, height: 56 },
  { x: 982, y: 385, width: 58, height: 56 },
  { x: 1055, y: 385, width: 58, height: 56 },
  { x: 1012, y: 455, width: 58, height: 56 },
  { x: 550, y: 315, width: 42, height: 62 },
  { x: 785, y: 410, width: 42, height: 62 },
  { x: 446, y: 488, width: 48, height: 42 },
  { x: 692, y: 586, width: 44, height: 54 },
  { x: 625, y: 482, width: 112, height: 76 },
  { x: 695, y: 1028, width: 44, height: 52 },
  { x: 625, y: 862, width: 350, height: 160 },
  { x: 505, y: 970, width: 112, height: 34 },
  { x: 714, y: 970, width: 126, height: 34 },
  { x: 782, y: 922, width: 92, height: 90 },
];

// O retângulo da fachada começa abaixo do topo do telhado. Esta área fecha
// somente a inclinação real, preservando os caminhos dos dois lados da casa.
export const WORLD_SOLID_POLYGONS: Point[][] = [
  [[625, 675], [800, 790], [800, 820], [450, 820], [450, 790]],
  [[532, 684], [572, 684], [572, 753], [532, 753]], // Chaminé.
];

export const HOUSE_FLOOR_AREAS: RectangleArea[] = [
  { x: 75, y: 205, width: 810, height: 662 },
  { x: 405, y: 867, width: 150, height: 71 },
];

export const WORLD_SPECIAL_WALKABLE_AREAS: RectangleArea[] = [
  { x: 535, y: 28, width: 180, height: 158 },
  { x: 586, y: 165, width: 78, height: 132 },
  { x: 530, y: 625, width: 190, height: 170 },
  { x: 564, y: 940, width: 122, height: 108 },
];

export const HIDDEN_HOUSE_PATHS: Point[][] = [
  [[260, 850], [340, 765], [550, 680], [600, 755], [475, 815], [405, 900], [350, 1010], [260, 1010]],
  [[655, 735], [715, 680], [895, 775], [985, 860], [985, 990], [900, 1010], [850, 900], [785, 825]],
];

export const WORLD_FOREGROUND_REGIONS: ForegroundRegion[] = [
  {
    key: "house",
    x: 375,
    y: 625,
    width: 500,
    height: 430,
    baseline: 992,
    polygons: [
      [[98, 118], [250, 52], [365, 118], [365, 194], [410, 232], [410, 320], [88, 320], [88, 232], [98, 211]],
      [[157, 58], [188, 58], [188, 143], [157, 143]],
      [[73, 317], [412, 317], [412, 341], [295, 341], [295, 360], [183, 360], [183, 341], [73, 341]],
      [[183, 341], [295, 341], [295, 400], [183, 400]],
    ],
  },
];
