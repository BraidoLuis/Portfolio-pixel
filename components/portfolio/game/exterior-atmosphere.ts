import type { GameObjects, Scene } from "phaser";
import { CLOUD_PIXELS, GOLD_SPARKLE_POINTS, LANTERN_GLOW, PROJECTS_GOLD, getCloudPosition, type PixelRect } from "./exterior-decor";
import { EXTERIOR_OBJECTS } from "./exterior-map";
import { getWorldLighting } from "./world-time";
import { inView, type ViewBounds } from "./exterior-life";

export type ExteriorAtmosphereView = { update: (elapsedMs: number, reducedMotion?: boolean, view?: ViewBounds) => void; destroy: () => void };

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
  const glowTexture = "exterior-lantern-glow";
  if (!scene.textures.exists(glowTexture)) {
    // Rasterize the thousands of static glow cells once, then batch 13 sprites.
    const source = scene.add.graphics().setVisible(false);
    drawPixels(source, LANTERN_GLOW, 160, 160);
    source.fillStyle(0xffd47b, 0.95).fillRect(158, 154, 4, 10);
    source.fillStyle(0xfff0b2, 1).fillRect(160, 154, 2, 6);
    source.generateTexture(glowTexture, 320, 320);
    source.destroy();
  }
  const lights = EXTERIOR_OBJECTS.filter((object) => object.kind === "lantern").map((lamp) => {
    // Atlas lantern glass sits to the right of the wooden pole, 58px above its base.
    const x = lamp.x + 12;
    const y = lamp.y - 58;
    return scene.add.image(x, y, glowTexture).setDepth(2100).setName(`${lamp.id}-glow`);
  });
  let destroyed = false;
  const update = (elapsedMs: number, reducedMotion = false, view?: ViewBounds) => {
    if (destroyed) return;
    const lighting = getWorldLighting(elapsedMs);
    dusk.setAlpha(lighting.warmth);
    night.setAlpha(lighting.darkness);
    lights.forEach((light, index) => {
      const visible = lighting.lamps > 0 && inView({ x: light.x - 160, y: light.y - 160, width: 320, height: 320 }, view);
      light.setVisible(visible);
      // Occasional gentle dips, with long steady intervals between them.
      const phase = (elapsedMs + index * 1370) % 11000;
      const flicker = !reducedMotion && phase < 1800 ? Math.sin(phase / 1800 * Math.PI) * 0.05 : 0;
      light.setAlpha(lighting.lamps * (1 - flicker));
    });
    clouds.forEach((cloud, index) => {
      const position = getCloudPosition(elapsedMs, index);
      cloud.setVisible(!reducedMotion && position.active && inView({ x: position.x, y: position.y, width: 152, height: 44 }, view));
      if (cloud.visible) cloud.setPosition(position.x, position.y).setAlpha(0.19 - lighting.darkness * 0.22);
    });
    sparkles.clear();
    GOLD_SPARKLE_POINTS.forEach((position, index) => {
      const cycle = (elapsedMs + index * 870) % 4100;
      if (reducedMotion || cycle > 620 || !inView({ x: position.x - 4, y: position.y - 4, width: 10, height: 10 }, view)) return;
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
