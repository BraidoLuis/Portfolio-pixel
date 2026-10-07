import type { GameObjects, Scene } from "phaser";
import type { Position } from "./collision-geometry";
import { BUTTERFLY_HOMES, FIREFLY_HOMES, FROG_HOME, FROG_LANDING, FROG_PERCH_DEPTH, LEAF_TREES,
  ProximityEncounter, encounterBounds, getButterflyFlight, getFirefly, getFrogLeap } from "./environment-encounters";
import { inView, type ViewBounds } from "./exterior-life";
import { drawPixelRipple } from "./fishing-renderer";
import { getWorldLighting } from "./world-time";

export type EncountersView = {
  update: (now: number, feet: Position | undefined, reducedMotion: boolean, view: ViewBounds) => void;
  destroy: () => void;
};
type Leaf = { x: number; y: number; direction: number; born: number; pink: boolean };

const pixel = (graphics: GameObjects.Graphics, color: number, x: number, y: number,
  width = 2, height = 2, alpha = 1) =>
  graphics.fillStyle(color, alpha).fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, width, height);

export function createEnvironmentEncounters(scene: Scene, onLeafRustle?: () => void): EncountersView {
  const graphic = (name: string, depth: number) => scene.add.graphics().setName(name).setDepth(depth).setVisible(false);
  const butterflies = BUTTERFLY_HOMES.map((home, index) => ({
    home, encounter: new ProximityEncounter(home, 62, 2800, 6500),
    graphic: graphic("ambient-butterfly-" + index, home.y + 18), signature: "",
  }));
  const frog = graphic("ambient-shore-frog", FROG_PERCH_DEPTH);
  const frogEncounter = new ProximityEncounter(FROG_HOME, 72, 14000, 4000, true);
  const leavesGraphic = graphic("ambient-foot-leaves", 4);
  const fireflies = graphic("ambient-fireflies", 2101);
  let leaves: Leaf[] = [];
  let previousFeet: Position | undefined;
  let nextLeavesAt = 0;
  let previousFrame = -1;
  let previousReduced = false;
  let frogSignature = "";
  let destroyed = false;
  const hide = (node: GameObjects.Graphics) => {
    if (node.visible) node.setVisible(false).clear();
  };

  const update = (now: number, feet: Position | undefined, reducedMotion: boolean, view: ViewBounds) => {
    if (destroyed) return;
    const frame = Math.floor(now / 50);
    if (frame === previousFrame && previousReduced === reducedMotion) return;
    previousFrame = frame; previousReduced = reducedMotion;
    const lighting = getWorldLighting(now);
    const daylight = lighting.darkness < 0.3;
    for (const butterfly of butterflies) {
      const visible = inView(encounterBounds(butterfly.home), view);
      const age = butterfly.encounter.update(now, feet, !reducedMotion && daylight, visible);
      if (!visible || !daylight) { hide(butterfly.graphic); butterfly.signature = ""; continue; }
      const flying = age !== undefined && !reducedMotion;
      const position = flying ? getButterflyFlight(butterfly.home, age, butterfly.home.variant) : butterfly.home;
      const wing = flying ? Math.floor(age / 100) % 2 : 0;
      const signature = Math.round(position.x / 2) + ":" + Math.round(position.y / 2) + ":" + wing;
      if (signature === butterfly.signature && butterfly.graphic.visible) continue;
      butterfly.signature = signature;
      butterfly.graphic.setVisible(true).clear();
      const color = [0xf6d99c, 0xe9a9bf, 0x9fcbd8][butterfly.home.variant];
      const spread = flying && wing ? 4 : 2;
      pixel(butterfly.graphic, 0x593d35, position.x, position.y - 4, 2, 6);
      pixel(butterfly.graphic, color, position.x - spread, position.y - 4, spread, 4);
      pixel(butterfly.graphic, color, position.x + 2, position.y - 4, spread, 4);
      pixel(butterfly.graphic, 0xffedc8, position.x - spread, position.y - 4);
    }

    const frogVisible = inView({ x: FROG_HOME.x - 12, y: FROG_HOME.y - 40,
      width: FROG_LANDING.x - FROG_HOME.x + 30, height: 68 }, view);
    const frogAge = frogEncounter.update(now, feet, !reducedMotion, frogVisible);
    const frogHidden = frogAge !== undefined && frogAge >= 1220;
    if (!frogVisible || frogHidden) { hide(frog); frogSignature = ""; }
    else {
      const signature = frogAge === undefined ? "perched" : String(frame);
      if (signature !== frogSignature || !frog.visible) {
        frogSignature = signature;
        frog.setVisible(true).clear();
        if (frogAge !== undefined && frogAge >= 520) {
          frog.setDepth(1);
          const progress = (frogAge - 520) / 700;
          drawPixelRipple(frog, FROG_LANDING, 4 + progress * 8, (1 - progress) * 0.42);
          if (progress < 0.3) {
            pixel(frog, 0xc7f2de, FROG_LANDING.x - 6, FROG_LANDING.y - 4 - progress * 12, 2, 2, 1 - progress * 3);
            pixel(frog, 0xc7f2de, FROG_LANDING.x + 6, FROG_LANDING.y - 4 - progress * 12, 2, 2, 1 - progress * 3);
          }
        } else {
          const position = frogAge === undefined ? FROG_HOME : getFrogLeap(frogAge);
          frog.setDepth(Math.max(FROG_PERCH_DEPTH, position.y + 8));
          pixel(frog, 0x425c38, position.x - 6, position.y - 4, 12, 6);
          pixel(frog, 0x7d9a4a, position.x - 4, position.y - 6, 8, 6);
          pixel(frog, 0xb5bf67, position.x - 4, position.y - 8, 2, 4);
          pixel(frog, 0xb5bf67, position.x + 2, position.y - 8, 2, 4);
          pixel(frog, 0x302e29, position.x - 4, position.y - 8);
          pixel(frog, 0x302e29, position.x + 2, position.y - 8);
          pixel(frog, 0x425c38, position.x - 8, position.y, 4, 2);
          pixel(frog, 0x425c38, position.x + 4, position.y, 4, 2);
        }
      }
    }

    const moved = feet && previousFeet ? Math.hypot(feet.x - previousFeet.x, feet.y - previousFeet.y) : 0;
    previousFeet = feet ? { ...feet } : undefined;
    if (reducedMotion) leaves = [];
    leaves = leaves.filter((leaf) => now - leaf.born < 1000);
    if (!reducedMotion && feet && moved >= 2 && moved < 24 && now >= nextLeavesAt &&
      inView(encounterBounds(feet, 24), view)) {
      const tree = LEAF_TREES.find((tree) => Math.hypot(tree.x - feet.x, tree.y - feet.y) < 56);
      if (tree) {
        nextLeavesAt = now + 900;
        leaves.push(...[-1, 1].map((direction) => ({ x: feet.x + direction * 6,
          y: feet.y, direction, born: now, pink: tree.kind === "pink" })));
        onLeafRustle?.();
      }
    }
    const visibleLeaves = leaves.filter((leaf) => inView(encounterBounds(leaf, 20), view));
    if (!visibleLeaves.length) hide(leavesGraphic);
    else {
      leavesGraphic.setVisible(true).clear();
      for (const leaf of visibleLeaves) {
        const progress = (now - leaf.born) / 1000;
        const x = leaf.x + leaf.direction * progress * 12;
        const y = leaf.y - Math.sin(progress * Math.PI) * 6;
        pixel(leavesGraphic, leaf.pink ? 0xe9a9bf : 0xa99a50, x, y, 4, 2, (1 - progress) * 0.8);
        pixel(leavesGraphic, leaf.pink ? 0xb96886 : 0x6b7d42, x + 2, y + 2, 2, 2, (1 - progress) * 0.8);
      }
    }

    const activeFireflies = !reducedMotion && lighting.period === "night"
      ? FIREFLY_HOMES.flatMap((home) => !inView(encounterBounds(home, 40), view) ? [] :
        [0, 1, 2].flatMap((index) => { const firefly = getFirefly(home, index, now); return firefly ? [firefly] : []; }))
      : [];
    if (!activeFireflies.length) hide(fireflies);
    else {
      fireflies.setVisible(true).clear();
      for (const firefly of activeFireflies) {
        pixel(fireflies, 0xc6d67a, firefly.x - 2, firefly.y - 2, 6, 6, firefly.alpha * 0.12);
        pixel(fireflies, 0xeee6a4, firefly.x, firefly.y, 2, 2, firefly.alpha);
      }
    }
  };
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    scene.events.off("shutdown", destroy);
    [...butterflies.map((butterfly) => butterfly.graphic), frog, leavesGraphic, fireflies].forEach((node) => node.destroy());
    leaves = []; previousFeet = undefined;
  };
  scene.events.once("shutdown", destroy);
  return { update, destroy };
}
