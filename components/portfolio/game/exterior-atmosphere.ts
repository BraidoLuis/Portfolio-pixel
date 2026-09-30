import type { GameObjects, Scene } from "phaser";
import { CLOUD_PIXELS, GOLD_SPARKLE_POINTS, LANTERN_GLOW, PROJECTS_GOLD, getCloudPosition, type PixelRect } from "./exterior-decor";
import { EXTERIOR_OBJECTS } from "./exterior-map";
import { getWorldLighting } from "./world-time";

export type ExteriorAtmosphereView = { update: (elapsedMs: number) => void; destroy: () => void };

function drawPixels(graphics: GameObjects.Graphics, pixels: readonly PixelRect[], x = 0, y = 0) {
  for (const pixel of pixels) graphics.fillStyle(pixel.color, pixel.alpha)
    .fillRect(pixel.x + x, pixel.y + y, pixel.width, pixel.height);
}

/** Effects remain in world coordinates and below the 5000-depth prompts.
 * Overlay bounds are the actual map, so they never tint the black letterbox. */
export function createExteriorAtmosphere(scene: Scene): ExteriorAtmosphereView {
  const gold = scene.add.graphics().setDepth(4).setName("projects-gold");
  drawPixels(gold, PROJECTS_GOLD);
  const sparkles = scene.add.graphics().setDepth(170).setName("projects-gold-sparkles");
  const clouds = [0, 1].map((index) => {
    const cloud = scene.add.graphics().setDepth(1800).setName(`pixel-cloud-${index}`);
    drawPixels(cloud, CLOUD_PIXELS);
    return cloud;
  });
  const dusk = scene.add.rectangle(640, 640, 1280, 1280, 0xc86b32).setDepth(1999).setName("dusk-light");
  const night = scene.add.rectangle(640, 640, 1280, 1280, 0x132342).setDepth(2000).setName("night-light");
  const lights = EXTERIOR_OBJECTS.filter((object) => object.kind === "lantern").map((lamp) => {
    // Atlas lantern glass sits to the right of the wooden pole, 58px above its base.
    const x = lamp.x + 12;
    const y = lamp.y - 58;
    const glow = scene.add.graphics().setDepth(2100).setName(`${lamp.id}-glow`);
    drawPixels(glow, LANTERN_GLOW, x, y);
    glow.fillStyle(0xffd47b, 0.95).fillRect(x - 2, y - 6, 4, 10);
    glow.fillStyle(0xfff0b2, 1).fillRect(x, y - 6, 2, 6);
    return glow;
  });
  let destroyed = false;
  const update = (elapsedMs: number) => {
    if (destroyed) return;
    const lighting = getWorldLighting(elapsedMs);
    dusk.setAlpha(lighting.warmth);
    night.setAlpha(lighting.darkness);
    lights.forEach((light, index) => light.setAlpha(lighting.lamps * (0.96 + Math.sin(elapsedMs / 900 + index) * 0.04)));
    clouds.forEach((cloud, index) => {
      const position = getCloudPosition(elapsedMs, index);
      cloud.setPosition(position.x, position.y).setVisible(position.active).setAlpha(0.19 - lighting.darkness * 0.22);
    });
    sparkles.clear();
    GOLD_SPARKLE_POINTS.forEach((position, index) => {
      const cycle = (elapsedMs + index * 870) % 4100;
      if (cycle > 620) return;
      const alpha = Math.sin(cycle / 620 * Math.PI) * 0.8;
      sparkles.fillStyle(0xffefae, alpha).fillRect(position.x - 4, position.y, 10, 2)
        .fillRect(position.x, position.y - 4, 2, 10);
      sparkles.fillStyle(0xffffff, alpha).fillRect(position.x, position.y, 2, 2);
    });
  };
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    scene.events.off("shutdown", destroy);
    [gold, sparkles, ...clouds, dusk, night, ...lights].forEach((object) => object.destroy());
  };
  scene.events.once("shutdown", destroy);
  update(0);
  return { update, destroy };
}
