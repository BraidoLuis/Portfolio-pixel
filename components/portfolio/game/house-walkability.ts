import { footHitsBox, getFootBounds, type Position } from "./collision-geometry";
import {
  HOUSE_COLLISIONS,
  HOUSE_COLUMNS,
  HOUSE_PLAYER_SIZE,
  HOUSE_REST_SPOTS,
  HOUSE_ROWS,
  HOUSE_TILES,
  HOUSE_TILE_SIZE,
  type HouseRestId,
} from "./house-map";

/** The full, shared character footprint must be supported by walkable tiles. */
export function canOccupyHouse(position: Position): boolean {
  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) return false;
  const foot = getFootBounds(position, HOUSE_PLAYER_SIZE);
  if (foot.left < 0 || foot.top < 0 || foot.right > HOUSE_COLUMNS * HOUSE_TILE_SIZE ||
      foot.bottom > HOUSE_ROWS * HOUSE_TILE_SIZE) return false;
  if (HOUSE_COLLISIONS.some((box) => footHitsBox(foot, box))) return false;

  const firstColumn = Math.floor(foot.left / HOUSE_TILE_SIZE);
  const lastColumn = Math.floor((foot.right - 0.001) / HOUSE_TILE_SIZE);
  const firstRow = Math.floor(foot.top / HOUSE_TILE_SIZE);
  const lastRow = Math.floor((foot.bottom - 0.001) / HOUSE_TILE_SIZE);
  for (let row = firstRow; row <= lastRow; row += 1) {
    for (let column = firstColumn; column <= lastColumn; column += 1) {
      const tile = HOUSE_TILES[row][column];
      if (!((tile >= 0 && tile <= 3) || tile === 11)) return false;
    }
  }
  return true;
}

/** Never stand the actor up inside furniture or outside the room. */
export function chooseFreeHouseExit(restId: HouseRestId, previous?: Position): Position | undefined {
  const rest = HOUSE_REST_SPOTS.find((spot) => spot.id === restId);
  if (!rest) return undefined;
  const candidates = previous ? [...rest.exitCandidates, previous] : rest.exitCandidates;
  const free = candidates.find(canOccupyHouse);
  return free ? { ...free } : undefined;
}
