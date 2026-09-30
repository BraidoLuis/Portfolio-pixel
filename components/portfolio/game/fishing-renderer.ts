import type { GameObjects, Scene } from "phaser";
import { getFishingAnimation, type FishingSpot } from "./world-activities";
import type { Position } from "./collision-geometry";

export type FishingView = { update: (elapsedMs: number) => void; destroy: () => void };

const pixel = (value: number) => Math.round(value / 2) * 2;

/** Bresenham stairs keep every line on the same crisp 2px grid as the tiles. */
function pixelLine(graphics: GameObjects.Graphics, start: Position, end: Position, color: number, thickness = 2) {
  let x = Math.round(start.x / 2);
  let y = Math.round(start.y / 2);
  const targetX = Math.round(end.x / 2);
  const targetY = Math.round(end.y / 2);
  const dx = Math.abs(targetX - x);
  const dy = -Math.abs(targetY - y);
  const sx = x < targetX ? 1 : -1;
  const sy = y < targetY ? 1 : -1;
  let error = dx + dy;
  graphics.fillStyle(color, 1);
  for (;;) {
    graphics.fillRect(x * 2, y * 2, thickness, thickness);
    if (x === targetX && y === targetY) break;
    const doubled = error * 2;
    if (doubled >= dy) { error += dy; x += sx; }
    if (doubled <= dx) { error += dx; y += sy; }
  }
}

function ripple(graphics: GameObjects.Graphics, center: Position, radius: number, alpha: number) {
  graphics.fillStyle(0x9bdace, alpha);
  const occupied = new Set<string>();
  // Sparse stepped ellipses with small gaps read as water, not smooth vectors.
  for (let index = 0; index < 28; index += 1) {
    if (index === 2 || index === 3 || index === 16) continue;
    const angle = index * Math.PI * 2 / 28;
    const x = pixel(center.x + Math.cos(angle) * radius);
    const y = pixel(center.y + 5 + Math.sin(angle) * radius * 0.35);
    const key = `${x},${y}`;
    if (occupied.has(key)) continue;
    occupied.add(key);
    graphics.fillRect(x, y, 2, 2);
  }
}

/** A small original pixel sprite: forked amber tail, teal scales and pale belly. */
function caughtFish(graphics: GameObjects.Graphics, position: Position, wiggle: number) {
  const palette: Record<string, number> = {
    o: 0x183e43, t: 0xd88c3d, h: 0xf5c66b, d: 0x22626a,
    b: 0x389e9a, l: 0x82cfc0, p: 0xe6e5b5, e: 0x112c35,
  };
  const rows = [
    "      ooo     ",
    "  o  othto    ",
    " otoodbbbdoo  ",
    "  otbblblpleo ",
    "  otbblblbloo ",
    " otoodppppo   ",
    "  o  ootho    ",
    "      oo      ",
  ];
  const left = pixel(position.x - 12);
  const top = pixel(position.y - 8);
  for (const [row, colors] of rows.entries()) {
    const wag = Math.abs(wiggle) > 0.65 && row >= 2 && row <= 5 ? Math.sign(wiggle) * 2 : 0;
    for (const [column, color] of [...colors].entries()) {
      if (!palette[color]) continue;
      graphics.fillStyle(palette[color], 1).fillRect(left + column * 2, top + row * 2 + (column < 4 ? wag : 0), 2, 2);
    }
  }
}

/** World-space graphics use the default scroll factor and inherit camera zoom. */
export function createFishingView(scene: Scene, spot: FishingSpot): FishingView {
  const water = scene.add.graphics().setDepth(4).setName("fishing-water");
  const tackle = scene.add.graphics().setDepth(spot.position.y + 38).setName("fishing-tackle");
  let destroyed = false;

  const update = (elapsedMs: number) => {
    if (destroyed) return;
    const motion = getFishingAnimation(spot, elapsedMs);
    const { hand, rodTip, bobber } = motion;
    water.clear();
    tackle.clear();

    if (motion.waterActive) {
      for (let index = 0; index < 3; index += 1) {
        const phase = (motion.ripplePhase + index / 3) % 1;
        ripple(water, spot.bobber, 6 + phase * (motion.phase === "bite" || motion.phase === "reel" ? 30 : 20), (1 - phase) * 0.55);
      }
      if (motion.settled) water.fillStyle(0x155b62, 0.55).fillRect(pixel(bobber.x - 4), pixel(bobber.y + 6), 10, 2);
      if (motion.splash) {
        water.fillStyle(0xc7f2de, 0.8);
        [[-10, -2], [-6, -8], [8, -6], [12, 2]].forEach(([dx, dy]) =>
          water.fillRect(pixel(spot.bobber.x + dx), pixel(spot.bobber.y + dy), 2, 4));
      }
    }

    // Flexible line bows slightly after the float lands; no screen-space HUD.
    const sag = motion.settled ? 5 : -8 * Math.sin(motion.progress * Math.PI);
    let previous = rodTip;
    for (let index = 1; index <= 14; index += 1) {
      const fraction = index / 14;
      const next = {
        x: rodTip.x + (bobber.x - rodTip.x) * fraction,
        y: rodTip.y + (bobber.y - rodTip.y) * fraction + Math.sin(fraction * Math.PI) * sag,
      };
      pixelLine(tackle, previous, next, 0xcbd7b4);
      previous = next;
    }

    // Jointed bamboo shaft, lit edge, bindings, cork grip and small metal reel.
    const butt = { x: hand.x - 3, y: hand.y + 12 };
    pixelLine(tackle, butt, rodTip, 0x48301e, 4);
    pixelLine(tackle, { x: hand.x + 2, y: hand.y }, { x: rodTip.x + 2, y: rodTip.y }, 0xc99549);
    for (const fraction of [0.22, 0.49, 0.74, 0.94]) {
      const x = pixel(hand.x + (rodTip.x - hand.x) * fraction);
      const y = pixel(hand.y + (rodTip.y - hand.y) * fraction);
      tackle.fillStyle(0x5b4126, 1).fillRect(x, y, 4, 2);
      tackle.fillStyle(0xf0cd7a, 1).fillRect(x + 2, y - 2, 2, 2);
    }
    pixelLine(tackle, butt, hand, 0x79502d, 4);
    for (let offset = 2; offset <= 10; offset += 4) {
      tackle.fillStyle(0xd1aa65, 1).fillRect(pixel(hand.x - 2), pixel(hand.y + offset), 4, 2);
    }
    const reelX = pixel(hand.x + 4);
    const reelY = pixel(hand.y + 4);
    tackle.fillStyle(0x2b3432, 1).fillRect(reelX, reelY, 8, 8);
    tackle.fillStyle(0x9ca99a, 1).fillRect(reelX + 2, reelY, 4, 2).fillRect(reelX, reelY + 2, 2, 4);
    tackle.fillStyle(0x586d66, 1).fillRect(reelX + 2, reelY + 2, 4, 4);
    tackle.fillStyle(0xd5d7b4, 1).fillRect(reelX + 2, reelY + 2, 2, 2);
    tackle.fillStyle(0x372b21, 1).fillRect(reelX + 6, reelY + 6, 6, 2);

    // The float's ivory cap and red body remain readable over blue-green water.
    const floatX = pixel(bobber.x);
    const floatY = pixel(bobber.y);
    tackle.fillStyle(0x293e3e, 1).fillRect(floatX - 2, floatY - 4, 6, 10);
    tackle.fillStyle(0xf5e9bc, 1).fillRect(floatX, floatY - 4, 2, 4).fillRect(floatX - 2, floatY, 6, 2);
    tackle.fillStyle(0xce553d, 1).fillRect(floatX - 2, floatY + 2, 6, 2);
    tackle.fillStyle(0x8d332c, 1).fillRect(floatX, floatY + 4, 2, 2);
    if (motion.fish.visible) {
      pixelLine(tackle, bobber, { x: motion.fish.x + 10, y: motion.fish.y - 2 }, 0xcbd7b4);
      caughtFish(tackle, motion.fish, motion.fish.wiggle);
      if (motion.phase === "caught") {
        const sparkle = Math.floor(elapsedMs / 180) % 2;
        tackle.fillStyle(sparkle ? 0xf8e09b : 0xfff2c4, 0.9);
        const sparkX = pixel(motion.fish.x - 20 - sparkle * 2);
        const sparkY = pixel(motion.fish.y - 10 + sparkle * 4);
        tackle.fillRect(sparkX - 2, sparkY, 6, 2).fillRect(sparkX, sparkY - 2, 2, 6);
      }
    }
  };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    scene.events.off("shutdown", destroy);
    water.destroy();
    tackle.destroy();
  };
  scene.events.once("shutdown", destroy);
  update(0);
  return { update, destroy };
}
