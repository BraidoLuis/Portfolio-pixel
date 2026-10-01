import type { Scene } from "phaser";
import { EXTERIOR_TILE_SOURCE_SIZE, getExteriorTileFrame } from "./exterior-art";
import { EXTERIOR_OBJECTS, EXTERIOR_TILES, TILE_SIZE } from "./exterior-map";
import { createExteriorAtmosphere, type ExteriorAtmosphereView } from "./exterior-atmosphere";

export function preloadExterior(scene: Scene) {
  scene.load.image("exterior-terrain", "/game/exterior/terrain.png");
  scene.load.atlas("exterior-objects", "/game/exterior/objects.png", "/game/exterior/objects.json");
}

export function buildExterior(scene: Scene): ExteriorAtmosphereView {
  const data = EXTERIOR_TILES.map((row, y) => row.map((kind, x) => getExteriorTileFrame(kind, x, y)));
  // Actual reusable 16px source tiles, displayed at an integer 2x pixel scale.
  const map = scene.make.tilemap({ data, tileWidth: EXTERIOR_TILE_SOURCE_SIZE, tileHeight: EXTERIOR_TILE_SOURCE_SIZE });
  const tileset = map.addTilesetImage("exterior-terrain");
  if (!tileset) throw new Error("O tileset do exterior não carregou");
  map.createLayer(0, tileset, 0, 0)!.setScale(TILE_SIZE / EXTERIOR_TILE_SOURCE_SIZE).setDepth(0);

  for (const object of EXTERIOR_OBJECTS) {
    scene.add.image(object.x, object.y, "exterior-objects", object.kind)
      .setName(object.id)
      .setOrigin(0.5, 1)
      .setDisplaySize(object.width, object.height)
      .setDepth(object.depth ?? object.y);
  }
  return createExteriorAtmosphere(scene);
}
