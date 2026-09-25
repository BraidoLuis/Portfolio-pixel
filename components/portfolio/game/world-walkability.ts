import {
  footHitsBox,
  footHitsPolygon,
  getFootBounds,
  polygonContainsPoint,
  type FootBounds,
  type Position,
} from "./collision-geometry";
import {
  SCENE_SIZE,
  WORLD_COLLISIONS,
  WORLD_MARKED_WALKABLE_POLYGONS,
  WORLD_PLAYER_SIZE,
  WORLD_SOLID_POLYGONS,
} from "./world-config";

function footFitsMarkedPath(foot: FootBounds): boolean {
  const xs = [foot.left + 1, (foot.left + foot.right) / 2, foot.right - 1];
  const ys = [foot.top + 1, foot.bottom - 1];

  // Cada ponto pode cair em um polígono diferente ao cruzar uma emenda.
  return xs.every((x) => ys.every((y) =>
    WORLD_MARKED_WALKABLE_POLYGONS.some((polygon) => polygonContainsPoint(polygon, x, y)),
  ));
}

export function canOccupyWorld(position: Position): boolean {
  const foot = getFootBounds(position, WORLD_PLAYER_SIZE);
  const { width, height } = SCENE_SIZE.world;
  if (foot.left < 0 || foot.right > width || foot.top < 0 || foot.bottom > height) {
    return false;
  }
  if (WORLD_COLLISIONS.some((box) => footHitsBox(foot, box))) return false;
  if (WORLD_SOLID_POLYGONS.some((polygon) => footHitsPolygon(foot, polygon))) return false;
  return footFitsMarkedPath(foot);
}
