"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Character = "masculine" | "feminine";
export const FISHING_MILESTONES = [3, 10, 20, 50] as const;
export type PanelType =
  | "intro"
  | "tv"
  | "about"
  | "education"
  | "projects"
  | "skills"
  | "experiences"
  | "certifications"
  | "map"
  | "contact"
  | null;

type PortfolioStore = {
  character: Character;
  started: boolean;
  activePanel: PanelType;
  soundEnabled: boolean;
  volume: number;
  discovered: string[];
  fishCaught: number;
  fishingAchievement: boolean;
  recordFishCatch: () => boolean;
  setCharacter: (character: Character) => void;
  startGame: () => void;
  returnToMenu: () => void;
  openPanel: (panel: Exclude<PanelType, null>) => void;
  closePanel: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
};

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set) => ({
      character: "masculine",
      started: false,
      activePanel: null,
      soundEnabled: true,
      volume: 0.35,
      discovered: [],
      fishCaught: 0,
      fishingAchievement: false,
      recordFishCatch: () => {
        let unlocked = false;
        set((state) => {
          const fishCaught = state.fishCaught + 1;
          // The persisted count is the source of truth for every milestone.
          // Existing saves therefore retain their 3-fish star and progress.
          unlocked = FISHING_MILESTONES.some((milestone) => fishCaught === milestone);
          return { fishCaught, fishingAchievement: state.fishingAchievement || fishCaught >= 3 };
        });
        return unlocked;
      },
      setCharacter: (character) => set({ character }),
      startGame: () => set({ started: true, activePanel: null }),
      returnToMenu: () => set({ started: false, activePanel: null }),
      openPanel: (panel) =>
        set((state) => ({
          activePanel: panel,
          discovered: state.discovered.includes(panel)
            ? state.discovered
            : [...state.discovered, panel],
        })),
      closePanel: () => set({ activePanel: null }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setVolume: (volume) => set({ volume }),
    }),
    {
      name: "luis-pixel-portfolio",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        character: state.character,
        soundEnabled: state.soundEnabled,
        volume: state.volume,
        discovered: state.discovered,
        fishCaught: state.fishCaught,
        fishingAchievement: state.fishingAchievement,
      }),
    },
  ),
);
