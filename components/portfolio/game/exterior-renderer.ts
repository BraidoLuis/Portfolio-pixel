import type { Scene } from "phaser";
import type { Position } from "./collision-geometry";
import { EXTERIOR_TILE_SOURCE_SIZE, getExteriorTileFrame } from "./exterior-art";
import { EXTERIOR_OBJECTS, EXTERIOR_TILES, TILE_SIZE } from "./exterior-map";
import { createExteriorAtmosphere } from "./exterior-atmosphere";
import { createExteriorLife, type FoliagePart } from "./exterior-life-renderer";
import { createEnvironmentEncounters } from "./environment-encounters-renderer";

export type ExteriorView = { update: (elapsedMs: number, feet?: Position) => void; destroy: () => void };

export function preloadExterior(scene: Scene) {
  scene.load.image("exterior-terrain", "/game/exterior/terrain.png");
  scene.load.atlas("exterior-objects", "/game/exterior/objects.png", "/game/exterior/objects.json");
}

export function buildExterior(scene: Scene, onLeafRustle?: () => void): ExteriorView {
  const data = EXTERIOR_TILES.map((row, y) => row.map((kind, x) => getExteriorTileFrame(kind, x, y)));
  const map = scene.make.tilemap({ data, tileWidth: EXTERIOR_TILE_SOURCE_SIZE, tileHeight: EXTERIOR_TILE_SOURCE_SIZE });
  const tileset = map.addTilesetImage("exterior-terrain");
  if (!tileset) throw new Error("O tileset do exterior não carregou");
  map.createLayer(0, tileset, 0, 0)!.setScale(TILE_SIZE / EXTERIOR_TILE_SOURCE_SIZE).setDepth(0);

  const foliage: FoliagePart[] = [];
  for (const object of EXTERIOR_OBJECTS) {
    const base = scene.add.image(object.x, object.y, "exterior-objects", object.kind)
      .setName(object.id).setOrigin(0.5, 1).setDisplaySize(object.width, object.height)
      .setDepth(object.depth ?? object.y);
    const tree = object.kind === "pine" || object.kind === "oak" || object.kind === "pink";
    if (!tree && object.kind !== "grass" && object.kind !== "flowers" && object.kind !== "bush") continue;
    const frame = base.frame;
    // Crop existing art; fixed trunks/roots and moving foliage share the exact
    // original foot depth. Both remain behind or in front of the avatar together.
    const cut = tree ? object.kind === "pine" ? 52 : 44 : frame.height - 4;
    base.setCrop(0, cut, frame.width, frame.height - cut);
    const crown = scene.add.image(object.x, object.y, "exterior-objects", object.kind)
      .setName(`${object.id}-foliage`).setOrigin(0.5, 1).setDisplaySize(object.width, object.height)
      .setDepth(object.depth ?? object.y).setCrop(0, 0, frame.width, cut);
    foliage.push({ object, crown });
  }
  const atmosphere = createExteriorAtmosphere(scene);
  const life = createExteriorLife(scene, foliage);
  const encounters = createEnvironmentEncounters(scene, onLeafRustle);
  const preference = typeof window === "undefined" ? undefined : window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = preference?.matches ?? false;
  const onPreferenceChange = (event: MediaQueryListEvent) => { reducedMotion = event.matches; };
  preference?.addEventListener("change", onPreferenceChange);
  let destroyed = false;
  let previousFrame = -1;
  let previousReduced = !reducedMotion;
  const update = (elapsedMs: number, feet?: Position) => {
    if (destroyed) return;
    const view = scene.cameras.main.worldView;
    const frame = Math.floor(elapsedMs / 50);
    if (frame !== previousFrame || previousReduced !== reducedMotion) {
      atmosphere.update(elapsedMs, reducedMotion, view);
      previousFrame = frame;
      previousReduced = reducedMotion;
    }
    life.update(elapsedMs, feet, reducedMotion, view);
    encounters.update(elapsedMs, feet, reducedMotion, view);
  };
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    preference?.removeEventListener("change", onPreferenceChange);
    scene.events.off("shutdown", destroy);
    atmosphere.destroy();
    life.destroy();
    encounters.destroy();
  };
  scene.events.once("shutdown", destroy);
  return { update, destroy };
}
