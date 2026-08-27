"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ProjectCarousel } from "@/components/portfolio/panels/project-carousel";
import {
  AboutPanel,
  ContactPanel,
  EducationPanel,
  ExperiencesPanel,
  IntroPanel,
  MapPanel,
  SkillsPanel,
  TvPanel,
} from "@/components/portfolio/panels/static-panels";
import { usePortfolioStore } from "@/components/portfolio/store/portfolio-store";
import type { Project } from "@/content/portfolio";
import { getPublishedProjects } from "@/lib/projects";
import { cn } from "@/lib/utils";

const tvPanels = new Set(["tv", "about", "education", "contact"]);

export function ContentDialog() {
  const activePanel = usePortfolioStore((state) => state.activePanel);
  const closePanel = usePortfolioStore((state) => state.closePanel);
  const openPanel = usePortfolioStore((state) => state.openPanel);
  const [projects, setProjects] = useState<Project[]>([]);
  const isTvContent = activePanel ? tvPanels.has(activePanel) : false;
  const linkedinUrl = process.env.NEXT_PUBLIC_LINKEDIN_URL ?? "https://www.linkedin.com";

  useEffect(() => {
    if (activePanel === "projects" && projects.length === 0) {
      void getPublishedProjects().then(setProjects);
    }
  }, [activePanel, projects.length]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("portfolio:panel-state", { detail: { paused: Boolean(activePanel) } }),
    );
  }, [activePanel]);

  return (
    <Dialog open={Boolean(activePanel)} onOpenChange={(open) => !open && closePanel()}>
      <DialogContent
        className={cn(
          "max-h-[min(86svh,820px)] w-[min(690px,calc(100vw-2rem))]! max-w-[690px]! overflow-y-auto rounded-[2px]! border-[5px]! border-[#2d1814]! bg-[repeating-linear-gradient(0deg,#8f4b28_0_18px,#7b3c22_18px_22px)]! p-[18px]! text-[#4b2b22]! shadow-[inset_0_0_0_5px_#d58a48,0_14px_0_rgba(33,14,8,.55)]! max-[720px]:max-h-[88svh] max-[720px]:p-3!",
          "[&_[data-slot=dialog-close]]:right-5 [&_[data-slot=dialog-close]]:top-5 [&_[data-slot=dialog-close]]:z-5 [&_[data-slot=dialog-close]]:grid [&_[data-slot=dialog-close]]:size-9 [&_[data-slot=dialog-close]]:place-items-center [&_[data-slot=dialog-close]]:border-2 [&_[data-slot=dialog-close]]:border-[#2d1814] [&_[data-slot=dialog-close]]:bg-[#52291d] [&_[data-slot=dialog-close]]:text-[#fff1c2] [&_[data-slot=dialog-close]]:opacity-100",
          activePanel === "projects" && "w-[min(1080px,calc(100vw-2rem))]! max-w-[1080px]!",
          isTvContent && "bg-[repeating-linear-gradient(90deg,#5b341f_0_20px,#462719_20px_24px)]! shadow-[inset_0_0_0_5px_#9a5b31,inset_0_0_0_10px_#2a1812,0_14px_0_rgba(20,8,5,.65)]!",
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activePanel === "intro" && <IntroPanel onContinue={closePanel} />}
            {activePanel === "tv" && <TvPanel onSelect={openPanel} />}
            {activePanel === "about" && <AboutPanel onBack={() => openPanel("tv")} />}
            {activePanel === "education" && <EducationPanel onBack={() => openPanel("tv")} />}
            {activePanel === "projects" && <ProjectCarousel projects={projects} />}
            {activePanel === "skills" && <SkillsPanel onProjects={() => openPanel("projects")} />}
            {activePanel === "experiences" && <ExperiencesPanel />}
            {activePanel === "map" && <MapPanel />}
            {activePanel === "contact" && (
              <ContactPanel linkedinUrl={linkedinUrl} onBack={() => openPanel("tv")} />
            )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
