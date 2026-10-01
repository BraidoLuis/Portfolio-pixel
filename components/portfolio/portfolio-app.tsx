"use client";

import { AnimatePresence } from "motion/react";
import { Volume2, VolumeX } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { SoundtrackController } from "@/components/portfolio/game/soundtrack-controller";
import { StartScreen } from "@/components/portfolio/menu/start-screen";
import { usePortfolioStore } from "@/components/portfolio/store/portfolio-store";
import { UiSoundController } from "@/components/portfolio/game/ui-sound-controller";
import type { Project } from "@/content/projects";
import { siteConfig } from "@/content/site";

const GameScreen = dynamic(
  () => import("@/components/portfolio/game/game-screen").then((module) => module.GameScreen),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-svh place-items-center bg-[#142e43] p-6 text-center text-xl font-black text-[#fff2c4]" role="status">
        Carregando o mundo...
      </div>
    ),
  },
);
const ContentDialog = dynamic(
  () => import("@/components/portfolio/panels/content-dialog").then((module) => module.ContentDialog),
  { ssr: false },
);

export function PortfolioApp({ projects }: { projects: Project[] }) {
  const projectsButtonRef = useRef<HTMLButtonElement>(null);
  const [menuProjectsOpened, setMenuProjectsOpened] = useState(false);
  const character = usePortfolioStore((state) => state.character);
  const started = usePortfolioStore((state) => state.started);
  const soundEnabled = usePortfolioStore((state) => state.soundEnabled);
  const volume = usePortfolioStore((state) => state.volume);
  const setCharacter = usePortfolioStore((state) => state.setCharacter);
  const startGame = usePortfolioStore((state) => state.startGame);
  const openPanel = usePortfolioStore((state) => state.openPanel);
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
        className="fixed left-4 top-4 z-60 grid size-[46px] place-items-center border-[3px] border-[#2d1814] bg-[#9b542e] text-[#ffe9a9] shadow-[inset_0_0_0_2px_#d58a48] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#fff0b6]"
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
            onProjects={() => {
              setMenuProjectsOpened(true);
              openPanel("projects");
            }}
            projectsButtonRef={projectsButtonRef}
            onStart={startGame}
          />
        ) : (
          <GameScreen key="game" projects={projects} />
        )}
      </AnimatePresence>
      {!started && menuProjectsOpened && (
        <ContentDialog projects={projects} returnFocusRef={projectsButtonRef} />
      )}
    </main>
  );
}
