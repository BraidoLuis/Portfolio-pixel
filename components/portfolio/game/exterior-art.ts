import { EXTERIOR_TILES, type GroundTile } from "./exterior-map";

export const EXTERIOR_TILE_SOURCE_SIZE = 16;
export const EXTERIOR_TILESET_COLUMNS = 32;
export const EXTERIOR_GROUND_VARIANTS = 8;
export const EXTERIOR_WATER_FRAME = 512 * EXTERIOR_GROUND_VARIANTS;
export const EXTERIOR_CLIFF_FRAME = EXTERIOR_WATER_FRAME + 64;
export const EXTERIOR_STAIRS_FRAME = EXTERIOR_CLIFF_FRAME + 4;
export const EXTERIOR_TERRAIN_FRAME_COUNT = EXTERIOR_STAIRS_FRAME + 16;

/** Clockwise neighbors, plus the center bit, describe reusable terrain pieces.
 * Grass participates too: a concave dirt bend can round into the adjacent grass
 * instead of retaining a hard 90-degree corner at the tile boundary.
 */
export const EXTERIOR_NEIGHBOR_OFFSETS = [
  [0, -1], [1, -1], [1, 0], [1, 1],
  [0, 1], [-1, 1], [-1, 0], [-1, -1],
] as const;

export function getExteriorGroundMask(
  column: number,
  row: number,
  grid: readonly (readonly GroundTile[])[] = EXTERIOR_TILES,
): number {
  const isPath = (x: number, y: number) => grid[y]?.[x] === "path" || grid[y]?.[x] === "stairs";
  return EXTERIOR_NEIGHBOR_OFFSETS.reduce(
    (mask, [dx, dy], bit) => mask | (Number(isPath(column + dx, row + dy)) << bit),
    Number(isPath(column, row)) << 8,
  );
}

/** The playable scene, static preview and minimap use identical tile frames. */
export function getExteriorTileFrame(kind: GroundTile, column: number, row: number): number {
  const hash = Math.imul(column + 1, 374761393) ^ Math.imul(row + 1, 668265263);
  // The first two bits keep the edge texture phase continuous across cells;
  // the last bit distributes two different material samples without a checkerboard.
  const variant = (column & 1) + ((row & 1) << 1) +
    ((Math.imul(hash ^ (hash >>> 13), 1274126177) >>> 30) & 1) * 4;
  if (kind === "grass" || kind === "path") {
    return getExteriorGroundMask(column, row) * EXTERIOR_GROUND_VARIANTS + variant;
  }
  if (kind === "cliff") return EXTERIOR_CLIFF_FRAME + variant % 4;
  if (kind === "stairs") {
    const edge = (x: number, y: number) => Number(EXTERIOR_TILES[y]?.[x] !== "stairs");
    return EXTERIOR_STAIRS_FRAME + edge(column - 1, row) + edge(column + 1, row) * 2 +
      edge(column, row - 1) * 4 + edge(column, row + 1) * 8;
  }

  const connects = (x: number, y: number) => {
    const neighbor = EXTERIOR_TILES[y]?.[x];
    return neighbor === kind;
  };
  const mask = Number(connects(column, row - 1)) |
    (Number(connects(column + 1, row)) << 1) |
    (Number(connects(column, row + 1)) << 2) |
    (Number(connects(column - 1, row)) << 3);
  return EXTERIOR_WATER_FRAME + variant % 4 * 16 + mask;
}
