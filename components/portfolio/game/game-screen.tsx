"use client";

import { motion } from "motion/react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, House, Map } from "lucide-react";
import { useEffect } from "react";
import { PhaserGame } from "@/components/portfolio/game/phaser-game";
import { ContentDialog } from "@/components/portfolio/panels/content-dialog";
import { usePortfolioStore, type PanelType } from "@/components/portfolio/store/portfolio-store";
import type { Project } from "@/content/projects";

export function GameScreen({ projects }: { projects: Project[] }) {
  const character = usePortfolioStore((state) => state.character);
  const returnToMenu = usePortfolioStore((state) => state.returnToMenu);
  const openPanel = usePortfolioStore((state) => state.openPanel);

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
      className="relative h-svh w-screen overflow-hidden bg-[#160d0b]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <PhaserGame character={character} />

      <div className="absolute right-4 top-4 z-20 flex gap-2 max-[720px]:bottom-[max(1rem,env(safe-area-inset-bottom))] max-[720px]:top-auto">
        <button className={toolbarButtonClass} type="button" onClick={returnToMenu}>
          <House aria-hidden="true" /> Menu
        </button>
        <button className={toolbarButtonClass} type="button" onClick={() => openPanel("map")}>
          <Map aria-hidden="true" /> Mapa
        </button>
      </div>

      <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-20 hidden grid-cols-[54px] justify-items-center gap-[3px] max-[720px]:grid" aria-label="Controles do personagem">
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

      <ContentDialog projects={projects} />
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

const mobileControlClass =
  "grid size-[52px] touch-none place-items-center border-[3px] border-[#2d1814] bg-[rgba(91,45,28,.88)] font-black text-[#fff0bd] shadow-[inset_0_0_0_2px_#d58a48]";
