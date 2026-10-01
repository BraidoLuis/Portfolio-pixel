"use client";

import Image from "next/image";
import type { RefObject } from "react";
import { ArrowRight, BriefcaseBusiness, Code2, FolderOpen, Play } from "lucide-react";
import type { Character } from "@/components/portfolio/store/portfolio-store";
import { siteConfig } from "@/content/site";
import { pixelButtonClass } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

type StartScreenProps = {
  character: Character;
  linkedinUrl: string;
  onCharacterChange: (character: Character) => void;
  onProjects: () => void;
  projectsButtonRef: RefObject<HTMLButtonElement | null>;
  onStart: () => void;
};

export function StartScreen({ character, linkedinUrl, onCharacterChange, onProjects, projectsButtonRef, onStart }: StartScreenProps) {
  return (
    <section className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#073d75_0%,#116eb2_56%,#65cbd9_100%)] px-4 py-8 text-[#fff4d1] max-[720px]:items-start max-[720px]:overflow-y-auto max-[720px]:px-3 max-[720px]:pb-7 max-[720px]:pt-[4rem]">
      <MenuSky />
      <div className="relative z-1 mx-auto flex w-full max-w-[1040px] flex-col items-center gap-5 max-[720px]:gap-3.5 max-[360px]:gap-2">
        <TitleBoard />
        <div className="grid w-full grid-cols-[minmax(0,1.35fr)_minmax(310px,.85fr)] items-stretch gap-4 max-[720px]:max-w-[520px] max-[720px]:grid-cols-1 max-[720px]:gap-3">
          <JourneyCard linkedinUrl={linkedinUrl} onProjects={onProjects} projectsButtonRef={projectsButtonRef} />
          <div className="flex flex-col justify-between gap-4 border-[5px] border-[#52291d] bg-[repeating-linear-gradient(0deg,#f2cc83_0_16px,#edc47a_16px_18px)] p-4 text-[#4b2b22] shadow-[inset_0_0_0_3px_#ffedbd,0_7px_0_rgba(47,22,13,.55)] max-[720px]:gap-3 max-[720px]:p-3 max-[360px]:p-2.5">
            <CharacterSelector character={character} onCharacterChange={onCharacterChange} />
            <button
              type="button"
              className="group flex min-h-[68px] w-full items-center justify-center gap-3 border-[4px] border-[#2d1814] bg-[#a9592e] px-4 py-2 text-[clamp(1.15rem,2vw,1.45rem)] font-black text-[#fff2c4] shadow-[inset_0_0_0_3px_#de9250,0_5px_0_#30160f] transition-[transform,filter] hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#fff0b6] max-[720px]:min-h-[60px] max-[360px]:min-h-[56px]"
              onClick={onStart}
            >
              <Play className="size-5 fill-current" aria-hidden="true" />
              Iniciar o jogo
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </button>
          </div>
        </div>
        <p className="text-center text-sm font-bold text-[#fff2ce] [text-shadow:1px_2px_0_#28567a] max-[720px]:hidden">
          Escolha seu personagem e descubra o mundo no seu ritmo.
        </p>
      </div>
    </section>
  );
}

function MenuSky() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <span className="absolute left-[12%] top-[14%] size-[4px] bg-[#e8eac2] shadow-[0_-7px_0_#a5cfce,0_7px_0_#a5cfce,-7px_0_0_#a5cfce,7px_0_0_#a5cfce]" />
      <span className="absolute right-[12%] top-[25%] size-[4px] bg-[#e8eac2] shadow-[0_-7px_0_#a5cfce,0_7px_0_#a5cfce,-7px_0_0_#a5cfce,7px_0_0_#a5cfce]" />
      <Image
        className="absolute left-[-24vw] top-[68%] h-auto w-[clamp(210px,25vw,370px)] animate-[cloud-pass_48s_linear_infinite] opacity-75 [animation-delay:-23s] [image-rendering:pixelated]"
        src="/game/menu-cloud.webp"
        alt=""
        width={640}
        height={300}
        unoptimized
      />
      <Image
        className="absolute left-[-28vw] top-[22%] h-auto w-[clamp(160px,18vw,280px)] animate-[cloud-pass_39s_linear_infinite] opacity-60 [animation-delay:-8s] [image-rendering:pixelated]"
        src="/game/menu-cloud.webp"
        alt=""
        width={640}
        height={300}
        unoptimized
      />
    </div>
  );
}

function TitleBoard() {
  return (
    <header className="relative grid aspect-[762/311] w-[min(790px,88vw,87svh)] place-content-center px-[11%] py-[6%] text-center text-[#71371e] [filter:drop-shadow(0_8px_0_rgba(46,18,12,.65))] [text-shadow:2px_2px_0_#f6cf81,1px_0_0_#4e2418] max-[720px]:w-[94vw] max-[720px]:px-[7%] max-[360px]:w-[90vw]">
      <Image
        src="/game/menu-title-board.webp"
        alt=""
        width={775}
        height={322}
        priority
        unoptimized
        className="pointer-events-none absolute left-[-1.31%] top-[-2.89%] h-[103.54%] w-[101.71%] max-w-none [image-rendering:pixelated]"
      />
      <p className="relative mb-2 text-[clamp(.8rem,1.5vw,1rem)] font-black uppercase tracking-[.18em] max-[720px]:mb-1 max-[720px]:text-[.65rem]">
        Portfólio interativo
      </p>
      <h1 className="relative text-[clamp(1.25rem,2.9vw,2.4rem)] font-black leading-[.95] tracking-[.025em] max-[720px]:text-[clamp(.9rem,4vw,1.35rem)]">
        LUÍS FELIPE BRAIDO
      </h1>
      <p className="relative mt-2 text-[clamp(.8rem,1.5vw,1rem)] font-black uppercase tracking-[.12em] max-[720px]:mt-1 max-[720px]:text-[.65rem]">
        Desenvolvedor full stack
      </p>
    </header>
  );
}

function JourneyCard({ linkedinUrl, onProjects, projectsButtonRef }: { linkedinUrl: string; onProjects: () => void; projectsButtonRef: RefObject<HTMLButtonElement | null> }) {
  return (
    <div className="flex flex-col justify-between border-[5px] border-[#8d4c2a] bg-[repeating-linear-gradient(0deg,#f7d894_0_16px,#f2cc83_16px_18px)] p-[clamp(1rem,2.4vw,1.65rem)] text-[#4b2b22] shadow-[inset_0_0_0_3px_#ffe8af,0_7px_0_rgba(47,22,13,.55)] max-[360px]:p-3">
      <div>
        <p className="text-sm font-black uppercase tracking-[.12em] text-[#90502d]">Bem-vindo ao meu mundo</p>
        <h2 className="mt-2 text-[clamp(1.7rem,3vw,2.4rem)] font-black leading-[1.05] text-[#673a25] max-[720px]:text-[1.7rem] max-[360px]:text-[1.5rem]">
          Olá, eu sou o Luís.
        </h2>
        <p className="mt-3 max-w-[52ch] text-[clamp(1rem,1.5vw,1.12rem)] font-bold leading-[1.35] max-[360px]:text-[.95rem]">
          Estudo Engenharia da Computação na UERJ e desenvolvo aplicações web. Também exploro segurança da informação.
        </p>
        <p className="mt-2 max-w-[52ch] text-[clamp(1rem,1.5vw,1.12rem)] font-bold leading-[1.35] text-[#6f442e] max-[360px]:text-[.95rem]">
          Entre no mapa para conhecer meus projetos, habilidades e experiências.
        </p>
      </div>
      <nav className="mt-5 flex flex-wrap gap-2 max-[720px]:mt-4 max-[720px]:gap-1.5 max-[360px]:gap-1" aria-label="Acessos rápidos">
        <button ref={projectsButtonRef} className={cn(pixelButtonClass, "flex-1 whitespace-nowrap max-[720px]:gap-1 max-[720px]:px-1.5 max-[720px]:text-[.86rem] max-[360px]:min-h-10 max-[360px]:gap-0.5 max-[360px]:px-1 max-[360px]:text-[.78rem]")} type="button" onClick={onProjects}>
          <FolderOpen className="size-[18px] max-[360px]:size-3.5" aria-hidden="true" /> Projetos
        </button>
        <a className={cn(pixelButtonClass, "flex-1 whitespace-nowrap max-[720px]:gap-1 max-[720px]:px-1.5 max-[720px]:text-[.86rem] max-[360px]:min-h-10 max-[360px]:gap-0.5 max-[360px]:px-1 max-[360px]:text-[.78rem]")} href={siteConfig.githubUrl} target="_blank" rel="noreferrer">
          <Code2 className="size-[18px] max-[360px]:size-3.5" aria-hidden="true" /> GitHub
        </a>
        <a className={cn(pixelButtonClass, "flex-1 whitespace-nowrap max-[720px]:gap-1 max-[720px]:px-1.5 max-[720px]:text-[.86rem] max-[360px]:min-h-10 max-[360px]:gap-0.5 max-[360px]:px-1 max-[360px]:text-[.78rem]")} href={linkedinUrl} target="_blank" rel="noreferrer">
          <BriefcaseBusiness className="size-[18px] max-[360px]:size-3.5" aria-hidden="true" /> LinkedIn
        </a>
      </nav>
    </div>
  );
}

function CharacterSelector({ character, onCharacterChange }: Pick<StartScreenProps, "character" | "onCharacterChange">) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-3 text-[1.1rem] font-black text-[#673a25]">Escolha seu personagem</legend>
      <div className="grid grid-cols-2 gap-2">
        <CharacterCard value="masculine" label="Masculino" image="/game/character-masculine-portrait.png" selected={character === "masculine"} onSelect={onCharacterChange} />
        <CharacterCard value="feminine" label="Feminino" image="/game/character-feminine-portrait.png" selected={character === "feminine"} onSelect={onCharacterChange} />
      </div>
    </fieldset>
  );
}

function CharacterCard({ value, label, image, selected, onSelect }: { value: Character; label: string; image: string; selected: boolean; onSelect: (character: Character) => void }) {
  return (
    <label
      className={cn(
        "relative flex min-w-0 cursor-pointer flex-col items-center gap-1.5 border-[3px] border-[#6f3d25] bg-[#f8dfa3] p-2 text-center font-black shadow-[inset_0_0_0_2px_#fff0c1,0_3px_0_#5b2e1b] transition-transform hover:-translate-y-0.5 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-[#9a4d2a]",
        selected && "-translate-y-0.5 border-[#9b542e] bg-[#ffe6a8] shadow-[inset_0_0_0_2px_#fff4c7,0_4px_0_#5b2e1b]",
      )}
    >
      <input
        type="radio"
        name="menu-character"
        value={value}
        checked={selected}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <span className="grid size-[66px] place-items-end overflow-hidden border-2 border-[#5b3422] bg-[#ddbd82] max-[360px]:size-[58px]" aria-hidden="true">
        <Image className="size-full object-contain object-bottom [image-rendering:pixelated]" src={image} alt="" width={256} height={256} unoptimized />
      </span>
      <span className="text-[.95rem] leading-none">{label}</span>
    </label>
  );
}
