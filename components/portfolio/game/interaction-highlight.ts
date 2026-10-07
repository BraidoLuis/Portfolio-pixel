import type { Scene } from "phaser";
import { EXTERIOR_OBJECTS } from "./exterior-map";
import { HOUSE_OBJECTS } from "./house-map";
import { inView } from "./exterior-life";

export type InteractionHighlight = { update: (objectId?: string) => void; destroy: () => void };

/** Steady pixel corners guide the same target as E; no glow/tween or physics. */
export function createInteractionHighlight(scene: Scene, area: "house" | "world"): InteractionHighlight {
  const objects = new Map((area === "house" ? HOUSE_OBJECTS : EXTERIOR_OBJECTS.filter(({ kind }) =>
    kind === "chest" || kind === "sign")).map((object) => [object.id, object]));
  const graphic = scene.add.graphics().setDepth(4900).setName("interaction-highlight").setVisible(false);
  let previous: string | undefined;
  let destroyed = false;
  const update = (objectId?: string) => {
    if (destroyed) return;
    const object = objectId ? objects.get(objectId) : undefined;
    const bounds = object ? { x: object.x - object.width / 2 - 4, y: object.y - object.height - 4,
      width: object.width + 8, height: object.height + 8 } : undefined;
    if (!bounds || !inView(bounds, scene.cameras.main.worldView)) {
      graphic.setVisible(false);
      if (previous !== undefined) graphic.clear();
      previous = undefined;
      return;
    }
    graphic.setVisible(true);
    if (previous === objectId) return;
    previous = objectId;
    graphic.clear().fillStyle(0xffe9a9, 0.7);
    for (const [x, directionX] of [[bounds.x, 1], [bounds.x + bounds.width - 2, -1]]) {
      for (const [y, directionY] of [[bounds.y, 1], [bounds.y + bounds.height - 2, -1]]) {
        graphic.fillRect(x + (directionX < 0 ? -6 : 0), y, 8, 2);
        graphic.fillRect(x, y + (directionY < 0 ? -6 : 0), 2, 8);
      }
    }
  };
  const destroy = () => {
    if (destroyed) return;
    destroyed = true; scene.events.off("shutdown", destroy); graphic.destroy();
  };
  scene.events.once("shutdown", destroy);
  return { update, destroy };
}
