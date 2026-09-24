"use client";

import { AnimatePresence } from "motion/react";
import { Volume2, VolumeX } from "lucide-react";
import { GameScreen } from "@/components/portfolio/game/game-screen";
import { SoundtrackController } from "@/components/portfolio/game/soundtrack-controller";
import { StartScreen } from "@/components/portfolio/menu/start-screen";
import { usePortfolioStore } from "@/components/portfolio/store/portfolio-store";
import { UiSoundController } from "@/components/portfolio/game/ui-sound-controller";
import type { Project } from "@/content/projects";
import { siteConfig } from "@/content/site";

export function PortfolioApp({ projects }: { projects: Project[] }) {
  const character = usePortfolioStore((state) => state.character);
  const started = usePortfolioStore((state) => state.started);
  const soundEnabled = usePortfolioStore((state) => state.soundEnabled);
  const volume = usePortfolioStore((state) => state.volume);
  const setCharacter = usePortfolioStore((state) => state.setCharacter);
  const startGame = usePortfolioStore((state) => state.startGame);
  const setSoundEnabled = usePortfolioStore((state) => state.setSoundEnabled);
  const linkedinUrl = siteConfig.linkedinUrl;

  return (
    <main className="min-h-svh overflow-hidden">
      <SoundtrackController
        active={started}
        enabled={soundEnabled}
        volume={volume}
      />

      <UiSoundController
        enabled={soundEnabled}
        volume={0.22}
      />
      <button
        type="button"
        className="fixed left-4 top-4 z-60 grid size-[46px] place-items-center border-[3px] border-[#2d1814] bg-[#9b542e] text-[#ffe9a9] shadow-[inset_0_0_0_2px_#d58a48]"
        aria-label={soundEnabled ? "Desativar som" : "Ativar som"}
        onClick={() => setSoundEnabled(!soundEnabled)}
      >
        {soundEnabled ? <Volume2 /> : <VolumeX />}
      </button>

      <AnimatePresence mode="wait">
        {!started ? (
          <StartScreen
            key="menu"
            character={character}
            linkedinUrl={linkedinUrl}
            onCharacterChange={setCharacter}
            onStart={startGame}
          />
        ) : (
          <GameScreen key="game" projects={projects} />
        )}
      </AnimatePresence>
    </main>
  );
}
