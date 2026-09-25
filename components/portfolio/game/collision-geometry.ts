import type { CollisionBox, Point, RectangleArea } from "./world-config";

export type Position = { x: number; y: number };

export type FootBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

// Os quatro frames de cada direção têm 256 px e os sapatos terminam em y=238.
// Usar sempre a mesma proporção mantém a colisão nos pés quando o sprite cresce.
export const PLAYER_FOOTPRINT = {
  width: 0.28,
  height: 0.125,
  offsetX: 0.36,
  offsetY: 0.805,
} as const;

export function getFootBounds({ x, y }: Position, spriteSize: number): FootBounds {
  const halfWidth = spriteSize * PLAYER_FOOTPRINT.width / 2;
  return {
    left: x - halfWidth,
    right: x + halfWidth,
    top: y + spriteSize * (PLAYER_FOOTPRINT.offsetY - 0.5),
    bottom: y + spriteSize * (PLAYER_FOOTPRINT.offsetY + PLAYER_FOOTPRINT.height - 0.5),
  };
}

export function footFitsFloor(foot: FootBounds, areas: readonly RectangleArea[]): boolean {
  const xs = [foot.left + 1, (foot.left + foot.right) / 2, foot.right - 1];
  const ys = [foot.top + 1, foot.bottom - 1];

  return xs.every((x) => ys.every((y) =>
    areas.some((area) => x >= area.x && x <= area.x + area.width &&
      y >= area.y && y <= area.y + area.height),
  ));
}

export function footHitsBox(foot: FootBounds, box: CollisionBox): boolean {
  return foot.left < box.x + box.width / 2 &&
    foot.right > box.x - box.width / 2 &&
    foot.top < box.y + box.height / 2 &&
    foot.bottom > box.y - box.height / 2;
}

export function polygonContainsPoint(points: readonly Point[], x: number, y: number): boolean {
  let inside = false;
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
    const [x1, y1] = points[index];
    const [x2, y2] = points[previous];
    if ((y1 > y) !== (y2 > y) && x < (x2 - x1) * (y - y1) / (y2 - y1) + x1) {
      inside = !inside;
    }
  }
  return inside;
}

// SAT para os obstáculos convexos do mapa, como o telhado inclinado.
export function footHitsPolygon(foot: FootBounds, points: readonly Point[]): boolean {
  const rectangle: Point[] = [
    [foot.left, foot.top], [foot.right, foot.top],
    [foot.right, foot.bottom], [foot.left, foot.bottom],
  ];

  for (const shape of [rectangle, points]) {
    for (let index = 0; index < shape.length; index += 1) {
      const [x1, y1] = shape[index];
      const [x2, y2] = shape[(index + 1) % shape.length];
      const axisX = y2 - y1;
      const axisY = x1 - x2;
      const rectProjection = rectangle.map(([x, y]) => x * axisX + y * axisY);
      const polygonProjection = points.map(([x, y]) => x * axisX + y * axisY);
      if (Math.max(...rectProjection) <= Math.min(...polygonProjection) ||
          Math.max(...polygonProjection) <= Math.min(...rectProjection)) {
        return false;
      }
    }
  }

  return true;
}

export function moveAlongWalkablePath(
  start: Position,
  end: Position,
  canStand: (position: Position) => boolean,
): Position {
  const differenceX = end.x - start.x;
  const differenceY = end.y - start.y;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(differenceX), Math.abs(differenceY)) / 4));
  const stepX = differenceX / steps;
  const stepY = differenceY / steps;
  let position = { ...start };

  for (let index = 0; index < steps; index += 1) {
    const next = { x: position.x + stepX, y: position.y + stepY };
    if (canStand(next)) {
      position = next;
      continue;
    }

    // Desliza na parede em vez de voltar o personagem alguns pixels.
    if (canStand({ x: next.x, y: position.y })) position.x = next.x;
    if (canStand({ x: position.x, y: next.y })) position.y = next.y;
  }

  return position;
}
