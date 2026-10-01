import type { Scene } from "phaser";
import type { Character } from "../store/portfolio-store";

export const CHARACTER_MOTION_TEXTURE = "character-motion";
export const DIAGONAL_DIRECTIONS = ["up-left", "up-right", "down-left", "down-right"] as const;
export type DiagonalDirection = typeof DIAGONAL_DIRECTIONS[number];
export type CharacterFacing = "up" | "down" | "left" | "right" | DiagonalDirection;
export type FishingCharacterPose = "cast-0" | "cast-1" | "reel" | "hold";

/** Opposing keys cancel before this function; non-zero axes choose a real 3/4 view. */
export function getMovementFacing(dx: number, dy: number, fallback: CharacterFacing = "down"): CharacterFacing {
  if (dx !== 0 && dy !== 0) return `${dy < 0 ? "up" : "down"}-${dx < 0 ? "left" : "right"}`;
  if (dx !== 0) return dx < 0 ? "left" : "right";
  if (dy !== 0) return dy < 0 ? "up" : "down";
  return fallback;
}

export function isDiagonalDirection(direction: CharacterFacing): direction is DiagonalDirection {
  return direction.includes("-");
}

export function getDiagonalDirection(dx: number, dy: number): DiagonalDirection | null {
  if (dx === 0 || dy === 0) return null;
  return `${dy < 0 ? "up" : "down"}-${dx < 0 ? "left" : "right"}`;
}

export function getDiagonalFrame(character: Character, direction: DiagonalDirection, frame = 0) {
  return `${character}-${direction}-${frame}`;
}

export function getFishingPoseFrame(character: Character, pose: FishingCharacterPose) {
  return `${character}-${pose}`;
}

export function preloadCharacterMotion(scene: Scene) {
  scene.load.atlas(CHARACTER_MOTION_TEXTURE, "/game/character-motion/atlas.png", "/game/character-motion/atlas.json");
}

/** Same 256px source canvas as the original sprites keeps display size and feet stable. */
export function createDiagonalAnimations(scene: Scene, character: Character) {
  for (const direction of DIAGONAL_DIRECTIONS) {
    const key = `walk-${character}-${direction}`;
    if (scene.anims.exists(key)) continue;
    scene.anims.create({ key, frames: [0, 1, 2, 3].map((frame) => ({
      key: CHARACTER_MOTION_TEXTURE, frame: getDiagonalFrame(character, direction, frame),
    })), frameRate: 10, skipMissedFrames: false, repeat: -1 });
  }
}
