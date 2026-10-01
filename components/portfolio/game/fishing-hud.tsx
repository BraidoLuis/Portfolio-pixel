"use client";

import { useEffect, useState } from "react";
import { FISHING_MILESTONES, usePortfolioStore } from "../store/portfolio-store";

const achievementMessage = (milestone: number) => `Conquista desbloqueada: ${milestone} peixes capturados`;

/** React HUD stays above clouds, lighting and camera transforms. */
export function FishingHud() {
  const count = usePortfolioStore((state) => state.fishCaught);
  const [notice, setNotice] = useState<string | null>(null);
  const [fishing, setFishing] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const showAchievement = (event: Event) => {
      const milestone = (event as CustomEvent<{ fishCaught: number }>).detail?.fishCaught;
      if (!FISHING_MILESTONES.some((target) => target === milestone)) return;
      setNotice(achievementMessage(milestone));
      clearTimeout(timer);
      timer = setTimeout(() => setNotice(null), 5000);
    };
    const updateActivity = (event: Event) => setFishing((event as CustomEvent<{ active: boolean }>).detail.active);
    window.addEventListener("portfolio:fishing-achievement", showAchievement);
    window.addEventListener("portfolio:fishing-state", updateActivity);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("portfolio:fishing-achievement", showAchievement);
      window.removeEventListener("portfolio:fishing-state", updateActivity);
    };
  }, []);

  return (
    <>
      {(count > 0 || fishing) && (
        <div className="absolute left-4 top-[4.5rem] z-20 flex items-center gap-2 border-[3px] border-[#2d1814] bg-[#5b2d1c]/95 px-3 py-2 text-[#fff0bd] shadow-[inset_0_0_0_2px_#d58a48]">
          <output aria-live="polite" aria-label={`${count} peixes capturados`} className="text-sm font-bold">Peixes: {count}</output>
          {FISHING_MILESTONES.filter((milestone) => count >= milestone).map((milestone) => (
            <button key={milestone} type="button" aria-label={achievementMessage(milestone)} title={achievementMessage(milestone)}
              className="relative grid size-8 shrink-0 place-items-center border-2 border-[#e7b952] bg-[#352218] text-[#ffdc67] focus-visible:outline-2 focus-visible:outline-[#fff0bd]"
              onClick={() => setNotice((current) => current === achievementMessage(milestone) ? null : achievementMessage(milestone))}>
              <PixelStar /><span aria-hidden="true" className="absolute -bottom-1 -right-1 bg-[#352218] px-0.5 text-[9px] font-black leading-none">{milestone}</span>
            </button>
          ))}
        </div>
      )}
      {fishing && (
        <button type="button" onClick={() => window.dispatchEvent(new Event("portfolio:fishing-cancel"))}
          className="absolute left-4 top-[8.5rem] z-20 border-2 border-[#d58a48] bg-[#352218]/95 px-3 py-2 text-sm font-bold text-[#fff0bd]">
          Encerrar pesca · Esc
        </button>
      )}
      {notice && (
        <div role="status" className="pointer-events-none absolute inset-x-4 top-[12rem] z-30 mx-auto flex max-w-[390px] items-center justify-center gap-3 border-[3px] border-[#e7b952] bg-[#352218]/95 p-4 text-center font-bold text-[#ffdc67] shadow-lg">
          <PixelStar /> <span>{notice}</span>
        </div>
      )}
    </>
  );
}

function PixelStar() {
  return <svg aria-hidden="true" viewBox="0 0 16 16" width="24" height="24" className="shrink-0" shapeRendering="crispEdges">
    <path fill="#966121" d="M7 0h2v4h2v1h5v3h-2v2h-2v2h1v4h-3v-2H6v2H3v-4h1v-2H2V8H0V5h5V4h2z" />
    <path fill="#ffd85f" d="M7 2h2v4h5v2h-2v2h-2v2h1v2l-3-2-3 2v-2h1v-2H4V8H2V6h5z" />
    <path fill="#fff3b0" d="M7 4h2v3H5v1H3V7h4z" />
  </svg>;
}
