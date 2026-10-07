import type { GameObjects, Scene } from "phaser";
import type { Position } from "./collision-geometry";
import type { ExteriorObject } from "./exterior-map";
import { AMBIENT_FISH_AIR_MS, fishEnvelope, getAmbientFishJump, getFoliageOffset, inView, type ViewBounds } from "./exterior-life";
import { drawPixelFish, drawPixelRipple } from "./fishing-renderer";

export type FoliagePart = { object: ExteriorObject; crown: GameObjects.Image };
export type ExteriorLifeView = {
  update: (elapsedMs: number, feet: Position | undefined, reducedMotion: boolean, view: ViewBounds) => void;
  destroy: () => void;
};

/** One reused graphics buffer, no timers, particles, physics bodies or audio. */
export function createExteriorLife(scene: Scene, foliage: readonly FoliagePart[]): ExteriorLifeView {
  const water = scene.add.graphics().setDepth(1).setName("ambient-lake-life").setVisible(false);
  const seed = Math.floor(Math.random() * 0x7fffffff);
  let destroyed = false;
  let painted = false;
  let previousFrame = -1;
  let previousReduced = false;

  const update = (elapsedMs: number, feet: Position | undefined, reducedMotion: boolean, view: ViewBounds) => {
    if (destroyed) return;
    const frame = Math.floor(elapsedMs / 50);
    if (frame === previousFrame && reducedMotion === previousReduced) return;
    previousFrame = frame;
    previousReduced = reducedMotion;
    for (const { object, crown } of foliage) {
      const visible = inView({ x: object.x - object.width / 2 - 2, y: object.y - object.height,
        width: object.width + 4, height: object.height }, view);
      crown.setVisible(visible);
      const offset = visible && !reducedMotion && feet ? getFoliageOffset(object, feet, elapsedMs) : 0;
      if (crown.x !== object.x + offset) crown.setX(object.x + offset);
    }
    const jump = reducedMotion ? undefined : getAmbientFishJump(elapsedMs, seed);
    if (!jump || !inView(fishEnvelope(jump.center), view)) {
      water.setVisible(false);
      if (painted) { water.clear(); painted = false; }
      return;
    }
    water.setVisible(true).clear();
    painted = true;
    const spray = (point: Position, progress: number) => {
      if (progress < 0 || progress > 1) return;
      water.fillStyle(0xc7f2de, (1 - progress) * 0.65);
      for (const direction of [-1, 1]) {
        const x = Math.round((point.x + direction * (4 + progress * 6)) / 2) * 2;
        const y = Math.round((point.y - Math.sin(progress * Math.PI) * 8) / 2) * 2;
        water.fillRect(x, y, 2, 2);
      }
    };
    if (jump.airborne) {
      const progress = jump.age / AMBIENT_FISH_AIR_MS;
      drawPixelRipple(water, jump.entry, 4 + progress * 8, (1 - progress) * 0.24);
      spray(jump.entry, jump.age / 200);
      drawPixelFish(water, jump.fish, Math.sin(jump.age / 75), jump.direction, jump.variant,
        Math.min(1, jump.age / 90, (AMBIENT_FISH_AIR_MS - jump.age) / 90));
    } else {
      spray(jump.landing, (jump.age - AMBIENT_FISH_AIR_MS) / 220);
      drawPixelRipple(water, jump.landing, 5 + jump.rippleProgress * 8, (1 - jump.rippleProgress) * 0.45);
    }
  };
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    scene.events.off("shutdown", destroy);
    water.destroy();
  };
  scene.events.once("shutdown", destroy);
  return { update, destroy };
}
