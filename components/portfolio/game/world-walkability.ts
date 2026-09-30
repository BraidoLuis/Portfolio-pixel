import { footHitsBox, getFootBounds, type Position } from "./collision-geometry";
import {
  EXTERIOR_COLUMNS,
  EXTERIOR_OBJECTS,
  EXTERIOR_ROWS,
  EXTERIOR_TILES,
  TILE_SIZE,
} from "./exterior-map";
import { WORLD_PLAYER_SIZE } from "./world-config";

const blockers = EXTERIOR_OBJECTS.flatMap((object) => object.collision ? [object.collision] : []);
const platforms = EXTERIOR_OBJECTS.flatMap((object) => object.walkable ? [object.walkable] : []);

/** Every tile touched by the character's actual feet must support the player. */
export function canOccupyWorld(position: Position): boolean {
  const foot = getFootBounds(position, WORLD_PLAYER_SIZE);
  if (foot.left < 0 || foot.right > EXTERIOR_COLUMNS * TILE_SIZE ||
      foot.top < 0 || foot.bottom > EXTERIOR_ROWS * TILE_SIZE) return false;

  if (blockers.some((box) => footHitsBox(foot, box))) return false;
  const onPlatform = platforms.some((area) => foot.left >= area.x &&
    foot.right <= area.x + area.width && foot.top >= area.y && foot.bottom <= area.y + area.height);

  const firstColumn = Math.floor(foot.left / TILE_SIZE);
  const lastColumn = Math.floor((foot.right - 0.001) / TILE_SIZE);
  const firstRow = Math.floor(foot.top / TILE_SIZE);
  const lastRow = Math.floor((foot.bottom - 0.001) / TILE_SIZE);
  for (let row = firstRow; row <= lastRow; row += 1) {
    for (let column = firstColumn; column <= lastColumn; column += 1) {
      const tile = EXTERIOR_TILES[row][column];
      if (tile === "cliff" || (tile === "water" && !onPlatform)) return false;
    }
  }
  return true;
}
