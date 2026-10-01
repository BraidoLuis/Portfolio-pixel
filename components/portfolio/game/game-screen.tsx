"use client";

import { motion } from "motion/react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, House, Map, Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PhaserGame } from "@/components/portfolio/game/phaser-game";
import { ZOOM_LIMITS, type ZoomState } from "@/components/portfolio/game/game-zoom";
import { FishingHud } from "./fishing-hud";
import { ContentDialog } from "@/components/portfolio/panels/content-dialog";
import { usePortfolioStore, type PanelType } from "@/components/portfolio/store/portfolio-store";
import type { Project } from "@/content/projects";

export function GameScreen({ projects }: { projects: Project[] }) {
  const gameRef = useRef<HTMLElement | null>(null);
  const character = usePortfolioStore((state) => state.character);
  const returnToMenu = usePortfolioStore((state) => state.returnToMenu);
  const openPanel = usePortfolioStore((state) => state.openPanel);
  const [zoom, setZoom] = useState<ZoomState>({ area: "house", step: 0, ...ZOOM_LIMITS });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenContainer, setFullscreenContainer] = useState<HTMLElement | null>(null);
  const [fullscreenNotice, setFullscreenNotice] = useState<string | null>(null);
  const zoomPercent = Math.round((1 + zoom.step * 0.2) * 100);
  const zoomArea = zoom.area === "house" ? "Quarto" : "Exterior";

  useEffect(() => {
    const syncFullscreen = () => {
      const active = document.fullscreenElement === gameRef.current;
      setIsFullscreen(active);
      setFullscreenContainer(active ? gameRef.current : null);
    };
    const showFullscreenError = () => setFullscreenNotice("Tela cheia indisponível neste navegador.");
    const exitOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && document.fullscreenElement === gameRef.current) {
        void document.exitFullscreen().catch(showFullscreenError);
      }
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("fullscreenerror", showFullscreenError);
    document.addEventListener("keydown", exitOnEscape, true);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("fullscreenerror", showFullscreenError);
      document.removeEventListener("keydown", exitOnEscape, true);
    };
  }, []);

  useEffect(() => {
    if (!fullscreenNotice) return;
    const timeout = window.setTimeout(() => setFullscreenNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [fullscreenNotice]);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === gameRef.current) {
        await document.exitFullscreen();
      } else if (gameRef.current?.requestFullscreen && document.fullscreenEnabled) {
        await gameRef.current.requestFullscreen();
      } else {
        setFullscreenNotice("Tela cheia indisponível neste navegador.");
      }
    } catch {
      setFullscreenNotice("Tela cheia indisponível neste navegador.");
    }
  }

  useEffect(() => {
    const handleZoomState = (event: Event) => {
      setZoom((event as CustomEvent<ZoomState>).detail);
    };
    window.addEventListener("portfolio:zoom-state", handleZoomState);
    window.dispatchEvent(new Event("portfolio:zoom-state-request"));
    return () => window.removeEventListener("portfolio:zoom-state", handleZoomState);
  }, []);

  useEffect(() => {
    const handlePanel = (event: Event) => {
      const panel = (event as CustomEvent<{ panel: Exclude<PanelType, null> }>).detail.panel;
      openPanel(panel);
    };
    window.addEventListener("portfolio:open-panel", handlePanel);
    return () => window.removeEventListener("portfolio:open-panel", handlePanel);
  }, [openPanel]);

  return (
    <motion.section
      ref={gameRef}
      className={`relative overflow-hidden bg-black ${isFullscreen ? "h-dvh w-dvw" : "h-svh w-screen"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <PhaserGame character={character} />
      <FishingHud />

      <div className="absolute right-4 top-4 z-20 flex gap-2 max-[720px]:bottom-[max(1rem,env(safe-area-inset-bottom))] max-[720px]:top-auto">
        <button className={toolbarButtonClass} type="button" onClick={returnToMenu}>
          <House aria-hidden="true" /> Menu
        </button>
        <button className={toolbarButtonClass} type="button" onClick={() => openPanel("map")}>
          <Map aria-hidden="true" /> Mapa
        </button>
        <button className={toolbarButtonClass} type="button" onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"} aria-pressed={isFullscreen}
          title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}>
          {isFullscreen ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
          {isFullscreen ? "Sair" : "Tela cheia"}
        </button>
      </div>

      {fullscreenNotice && (
        <div role="status" className="pointer-events-none absolute left-1/2 top-4 z-30 max-w-[70vw] -translate-x-1/2 border-2 border-[#d58a48] bg-[#352218]/95 px-3 py-2 text-center text-sm text-[#fff0bd]">
          {fullscreenNotice}
        </div>
      )}

      <div className="absolute right-4 top-[4.5rem] z-20 flex gap-2 max-[720px]:top-4" role="group" aria-label="Zoom do jogo">
        <button
          className={zoomButtonClass}
          type="button"
          title="Diminuir zoom"
          aria-label="Diminuir zoom"
          disabled={zoom.step <= zoom.min}
          onClick={() => window.dispatchEvent(new CustomEvent("portfolio:zoom", { detail: { direction: "out" } }))}
        >
          −
        </button>
        <output
          className="flex min-w-[68px] flex-col items-center justify-center border-[3px] border-[#2d1814] bg-[rgba(91,45,28,.94)] px-2 text-[#fff0bd] shadow-[inset_0_0_0_2px_#d58a48]"
          aria-live="polite"
          aria-label={`Zoom do ${zoomArea.toLowerCase()}: ${zoomPercent}%`}
          title={`Zoom do ${zoomArea.toLowerCase()} em relação ao enquadramento padrão`}
        >
          <span className="text-[9px] font-bold leading-3">{zoomArea}</span>
          <span className="text-sm font-black leading-4">{zoomPercent}%</span>
        </output>
        <button
          className={zoomButtonClass}
          type="button"
          title="Aumentar zoom"
          aria-label="Aumentar zoom"
          disabled={zoom.step >= zoom.max}
          onClick={() => window.dispatchEvent(new CustomEvent("portfolio:zoom", { detail: { direction: "in" } }))}
        >
          +
        </button>
      </div>

      <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-20 hidden grid-cols-[162px] justify-items-center gap-[3px] max-[720px]:grid" aria-label="Controles do personagem">
        <DirectionButton direction="up" label="Mover para cima"><ArrowUp /></DirectionButton>
        <div className="flex items-center gap-[3px]">
          <DirectionButton direction="left" label="Mover para esquerda"><ArrowLeft /></DirectionButton>
          <button
            type="button"
            className={`${mobileControlClass} rounded-full bg-[rgba(149,78,41,.94)]`}
            aria-label="Interagir"
            onClick={() => window.dispatchEvent(new Event("portfolio:mobile-interact"))}
          >
            E
          </button>
          <DirectionButton direction="right" label="Mover para direita"><ArrowRight /></DirectionButton>
        </div>
        <DirectionButton direction="down" label="Mover para baixo"><ArrowDown /></DirectionButton>
      </div>

      <ContentDialog projects={projects} portalContainer={fullscreenContainer} />
    </motion.section>
  );
}

function DirectionButton({
  direction,
  label,
  children,
}: {
  direction: "up" | "down" | "left" | "right";
  label: string;
  children: React.ReactNode;
}) {
  function dispatch(active: boolean) {
    window.dispatchEvent(
      new CustomEvent("portfolio:mobile-direction", { detail: { direction, active } }),
    );
  }

  return (
    <button
      className={mobileControlClass}
      type="button"
      aria-label={label}
      onPointerDown={() => dispatch(true)}
      onPointerUp={() => dispatch(false)}
      onPointerCancel={() => dispatch(false)}
      onPointerLeave={() => dispatch(false)}
    >
      {children}
    </button>
  );
}

const toolbarButtonClass =
  "inline-flex min-h-[42px] items-center gap-1.5 border-[3px] border-[#2d1814] bg-[rgba(91,45,28,.94)] px-3 py-2 font-black text-[#fff0bd] shadow-[inset_0_0_0_2px_#d58a48] [&>svg]:size-[18px] max-[720px]:w-12 max-[720px]:justify-center max-[720px]:text-[0px] max-[720px]:[&>svg]:size-5";

const zoomButtonClass =
  "grid size-[42px] place-items-center border-[3px] border-[#2d1814] bg-[repeating-linear-gradient(0deg,#8f4b28_0_9px,#7b3c22_9px_11px)] text-[26px] font-black leading-none text-[#fff0bd] shadow-[inset_0_0_0_2px_#d58a48,0_3px_0_#30160f] transition-transform enabled:hover:-translate-y-0.5 enabled:active:translate-y-0.5 disabled:cursor-default disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-[#ffe59a]";

const mobileControlClass =
  "grid size-[52px] touch-none place-items-center border-[3px] border-[#2d1814] bg-[rgba(91,45,28,.88)] font-black text-[#fff0bd] shadow-[inset_0_0_0_2px_#d58a48]";
