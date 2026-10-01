import type { GameObjects, Scene } from "phaser";
import { HOUSE_MARKER, HOUSE_OBJECTS, HOUSE_TILES, HOUSE_TILE_SIZE } from "./house-map";
import { getTutorialMarkerY } from "./house-rest";

export type HouseView = {
  objects: Map<string, GameObjects.Image>;
  bedCover: GameObjects.Image;
};

export function preloadHouse(scene: Scene) {
  scene.load.image("house-tiles", "/game/interior/tiles.png");
  scene.load.atlas("house-furniture", "/game/interior/furniture.png", "/game/interior/furniture.json");
  scene.load.atlas("house-poses", "/game/interior/poses.png", "/game/interior/poses.json");
}

export function buildHouse(scene: Scene): HouseView {
  const map = scene.make.tilemap({ data: HOUSE_TILES.map((row) => [...row]), tileWidth: 16, tileHeight: 16 });
  const tileset = map.addTilesetImage("house-tiles");
  if (!tileset) throw new Error("Os tiles do quarto não carregaram");
  map.createLayer(0, tileset, 0, 0)!.setScale(HOUSE_TILE_SIZE / 16).setDepth(0);
  const objects = new Map<string, GameObjects.Image>();
  for (const object of HOUSE_OBJECTS) {
    objects.set(object.id, scene.add.image(object.x, object.y, "house-furniture", object.kind)
      .setOrigin(0.5, 1).setName(object.id).setDisplaySize(object.width, object.height)
      .setFlipX(object.flipX ?? false).setDepth(object.depth ?? object.y));
  }
  const bed = HOUSE_OBJECTS.find((object) => object.id === "bed")!;
  const bedCover = scene.add.image(bed.x, bed.y, "house-furniture", "bed-cover")
    .setOrigin(0.5, 1).setDisplaySize(bed.width, bed.height).setDepth(851).setVisible(false);
  const marker = scene.add.text(HOUSE_MARKER.x, HOUSE_MARKER.y, "?", {
    fontFamily: "Stardew Valley", fontSize: "30px", fontStyle: "bold",
    color: "#ffe9a9", stroke: "#5d2e1d", strokeThickness: 5,
  }).setOrigin(0.5).setDepth(1200);
  // World coordinates and normal scrollFactor=1 keep it attached during pan/zoom.
  const animateMarker = () => marker.setY(getTutorialMarkerY(scene.time.now));
  scene.events.on("update", animateMarker);
  scene.events.once("shutdown", () => scene.events.off("update", animateMarker));
  return { objects, bedCover };
}
