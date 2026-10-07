"use client";

import { useEffect, useRef, useState } from "react";
import {
  EXTERIOR_TILE_SOURCE_SIZE,
  EXTERIOR_TILESET_COLUMNS,
  getExteriorTileFrame,
} from "./exterior-art";
import {
  EXTERIOR_OBJECTS,
  EXTERIOR_TILES,
  TILE_SIZE,
  WORLD_LANDMARKS,
} from "./exterior-map";

type SpriteAtlas = {
  frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }>;
};

const PREVIEW_SCALE = 0.5;
const mapWidth = EXTERIOR_TILES[0].length * TILE_SIZE;
const mapHeight = EXTERIOR_TILES.length * TILE_SIZE;
const mapDescription = "Mapa do exterior: Projetos ao norte, Habilidades à esquerda, Experiências à direita e Certificações a sudoeste da casa. O lago fica à direita da casa.";

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Não foi possível carregar ${source}`));
    image.src = source;
  });
}

/** The map and its markers share the same coordinates and art as the playable scene. */
export function WorldMinimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderMap() {
      const [terrain, objects, atlas] = await Promise.all([
        loadImage("/game/exterior/terrain.png"),
        loadImage("/game/exterior/objects.png"),
        fetch("/game/exterior/objects.json").then(async (response) => {
          if (!response.ok) throw new Error("Não foi possível carregar as peças do mapa");
          return await response.json() as SpriteAtlas;
        }),
      ]);
      if (cancelled || !canvasRef.current) return;
      const context = canvasRef.current.getContext("2d");
      if (!context) return;

      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, mapWidth * PREVIEW_SCALE, mapHeight * PREVIEW_SCALE);
      const previewTileSize = TILE_SIZE * PREVIEW_SCALE;

      EXTERIOR_TILES.forEach((row, y) => row.forEach((kind, x) => {
        const frame = getExteriorTileFrame(kind, x, y);
        context.drawImage(
          terrain,
          (frame % EXTERIOR_TILESET_COLUMNS) * EXTERIOR_TILE_SOURCE_SIZE,
          Math.floor(frame / EXTERIOR_TILESET_COLUMNS) * EXTERIOR_TILE_SOURCE_SIZE,
          EXTERIOR_TILE_SOURCE_SIZE,
          EXTERIOR_TILE_SOURCE_SIZE,
          x * previewTileSize,
          y * previewTileSize,
          previewTileSize,
          previewTileSize,
        );
      }));

      [...EXTERIOR_OBJECTS]
        .sort((a, b) => (a.depth ?? a.y) - (b.depth ?? b.y))
        .forEach((object) => {
          const source = atlas.frames[object.kind]?.frame;
          if (!source) throw new Error(`Peça de mapa ausente: ${object.kind}`);
          context.drawImage(
            objects,
            source.x,
            source.y,
            source.w,
            source.h,
            (object.x - object.width / 2) * PREVIEW_SCALE,
            (object.y - object.height) * PREVIEW_SCALE,
            object.width * PREVIEW_SCALE,
            object.height * PREVIEW_SCALE,
          );
        });
    }

    void renderMap().catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="relative mx-auto mt-5 w-full max-w-[440px] overflow-hidden border-[4px] border-[#875132] bg-[#497343] shadow-[4px_4px_0_#4b2b22]">
      <canvas
        ref={canvasRef}
        width={mapWidth * PREVIEW_SCALE}
        height={mapHeight * PREVIEW_SCALE}
        role="img"
        aria-label={mapDescription}
        className="block size-full [image-rendering:pixelated]"
      >
        {mapDescription}
      </canvas>
      {WORLD_LANDMARKS.filter((marker) => marker.id !== "house").map((marker) => (
        <span
          key={marker.id}
          aria-label={`${marker.number} · ${marker.label}`}
          className="absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 border-[#fff0b6] bg-[#542b1b] text-[1.125rem] font-black text-[#fff0b6] shadow-[2px_2px_0_#32180f]"
          style={{ left: `${marker.x / mapWidth * 100}%`, top: `${marker.y / mapHeight * 100}%` }}
        >
          {marker.number}
        </span>
      ))}
      {failed && (
        <p role="status" className="absolute inset-x-2 bottom-2 border-2 border-[#875132] bg-[#f6d99c] p-2 text-[1.125rem]">
          A imagem do mapa não carregou. Use as direções da legenda abaixo.
        </p>
      )}
    </div>
  );
}
