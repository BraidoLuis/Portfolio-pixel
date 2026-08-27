"use client";

import { motion } from "motion/react";
import { BriefcaseBusiness, Code2, Play } from "lucide-react";
import Image from "next/image";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { pixelButtonClass } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";
import type { Character } from "@/components/portfolio/store/portfolio-store";

type StartScreenProps = {
  character: Character;
  linkedinUrl: string;
  onCharacterChange: (character: Character) => void;
  onStart: () => void;
};

const cloudBaseClass =
  "pointer-events-none absolute left-[-32vw] h-auto w-[clamp(150px,19vw,360px)] opacity-85 [image-rendering:pixelated] will-change-transform";

export function StartScreen({
  character,
  linkedinUrl,
  onCharacterChange,
  onStart,
}: StartScreenProps) {
  return (
    <motion.section
      className="relative isolate flex min-h-svh flex-col items-center justify-start gap-[clamp(.65rem,1.6vh,1.15rem)] overflow-hidden bg-[linear-gradient(180deg,#073d75_0%,#0d67b2_43%,#28a6dc_72%,#68d6e8_100%)] px-[clamp(1rem,3vw,3rem)] pb-[clamp(1rem,2.4vh,2rem)] pt-[clamp(.8rem,2vh,1.5rem)] max-[720px]:justify-start max-[720px]:gap-3.5 max-[720px]:overflow-y-auto max-[720px]:px-3 max-[720px]:pb-6 max-[720px]:pt-[4.4rem]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.45 }}
    >
      <MenuSky />
      <TitleBoard />
      <JourneyCard linkedinUrl={linkedinUrl} />

      <div className="relative z-2 flex items-end gap-4 max-[720px]:w-[min(520px,94vw)] max-[720px]:flex-col max-[720px]:items-stretch">
        <CharacterSelector
          character={character}
          onCharacterChange={onCharacterChange}
        />
        <motion.button
          type="button"
          className="inline-flex min-h-[86px] items-center justify-center gap-2.5 border-[5px] border-[#52291d] bg-[repeating-linear-gradient(0deg,#f1bd69_0_15px,#e8ae5b_15px_17px)] px-5 py-4 font-black uppercase text-[#5c2a1d] shadow-[inset_0_0_0_3px_#ffe3a0,0_7px_0_#32160f] max-[720px]:min-h-[62px]"
          onClick={onStart}
          whileHover={{ y: -3 }}
          whileTap={{ y: 2, scale: 0.98 }}
        >
          <Play aria-hidden="true" /> Iniciar jogo
        </motion.button>
      </div>
    </motion.section>
  );
}

function MenuSky() {
  const clouds = [
    "top-[15%] animate-[cloud-pass_34s_linear_infinite] [animation-delay:-4s]",
    "top-[39%] w-[clamp(190px,25vw,470px)] animate-[cloud-pass_47s_linear_infinite] opacity-75 [animation-delay:-31s] max-[720px]:w-[clamp(170px,48vw,290px)]",
    "top-[64%] w-[clamp(130px,16vw,310px)] animate-[cloud-pass_39s_linear_infinite] opacity-70 [animation-delay:-18s]",
    "top-[78%] w-[clamp(210px,29vw,540px)] animate-[cloud-pass_56s_linear_infinite] opacity-60 [animation-delay:-45s] max-[720px]:w-[clamp(170px,48vw,290px)]",
  ];

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden after:absolute after:inset-x-0 after:bottom-0 after:h-[13%] after:bg-[linear-gradient(180deg,transparent,rgba(215,249,246,.2))] after:content-['']"
      aria-hidden="true"
    >
      <span className="absolute left-[11%] top-[6%] size-[5px] animate-[twinkle_2.8s_steps(2)_infinite] bg-[#fff9d5] shadow-[0_-7px_0_rgba(255,249,213,.35),0_7px_0_rgba(255,249,213,.35),-7px_0_0_rgba(255,249,213,.35),7px_0_0_rgba(255,249,213,.35)] [image-rendering:pixelated]" />
      <span className="absolute left-[61%] top-[11%] size-[5px] scale-[.65] animate-[twinkle_2.8s_steps(2)_infinite] bg-[#fff9d5] shadow-[0_-7px_0_rgba(255,249,213,.35),0_7px_0_rgba(255,249,213,.35),-7px_0_0_rgba(255,249,213,.35),7px_0_0_rgba(255,249,213,.35)] [animation-delay:.9s] [image-rendering:pixelated]" />
      <span className="absolute right-[8%] top-[20%] size-[5px] scale-80 animate-[twinkle_2.8s_steps(2)_infinite] bg-[#fff9d5] shadow-[0_-7px_0_rgba(255,249,213,.35),0_7px_0_rgba(255,249,213,.35),-7px_0_0_rgba(255,249,213,.35),7px_0_0_rgba(255,249,213,.35)] [animation-delay:1.6s] [image-rendering:pixelated]" />
      {clouds.map((className, index) => (
        <Image
          key={className}
          className={cn(cloudBaseClass, className, "max-[720px]:w-[clamp(120px,36vw,220px)]")}
          src="/game/menu-cloud.png"
          alt=""
          width={640}
          height={300}
          priority={index === 0}
          unoptimized
        />
      ))}
    </div>
  );
}

function TitleBoard() {
  return (
    <motion.header
      className="relative z-2 grid aspect-[2.4/1] min-h-0 w-[min(920px,91vw,91.2svh)] place-content-center bg-[url('/game/menu-title-board.png')] bg-[length:100%_100%] bg-center bg-no-repeat px-[12%] pb-[7%] pt-[8%] text-center text-[#71371e] [filter:drop-shadow(0_10px_0_rgba(46,18,12,.72))] [text-shadow:3px_3px_0_#f6cf81,1px_0_0_#4e2418] max-[720px]:w-[min(96vw,620px)]"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 90, damping: 13 }}
    >
      <span className="block text-[clamp(2.5rem,6.2vw,5.8rem)] font-black leading-none tracking-[.08em] max-[720px]:text-[clamp(2rem,12vw,3.4rem)]">
        LUÍS BRAIDO
      </span>
      <strong className="mt-3 block text-[clamp(1.15rem,2.5vw,2.25rem)] leading-none tracking-[.08em] max-[720px]:mt-1.5 max-[720px]:text-[clamp(.9rem,5vw,1.4rem)]">
        PORTFÓLIO
      </strong>
    </motion.header>
  );
}

function JourneyCard({ linkedinUrl }: { linkedinUrl: string }) {
  return (
    <motion.div
      className="relative z-2 w-[min(760px,90vw)] border-[5px] border-[#8d4c2a] bg-[repeating-linear-gradient(0deg,#f7d894_0_16px,#f2cc83_16px_18px)] px-[clamp(1rem,3vw,2rem)] py-3 text-center font-bold leading-[1.35] text-[#4b2b22] outline-3 outline-[#e89a4c] shadow-[0_7px_0_rgba(47,22,13,.65),inset_0_0_0_3px_#ffe8af] max-[720px]:text-[.83rem]"
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.18 }}
    >
      <p>
        Sou estudante de Engenharia da Computação na UERJ e desenvolvedor Full
        Stack. Crio aplicações web com React, Next.js, TypeScript, Node.js e
        Supabase e também direciono meus estudos para Segurança da Informação.
      </p>
      <p className="mt-2.5 text-[#6f442e]">
        Explore este mundo para conhecer os projetos, habilidades e experiências
        da minha jornada.
      </p>
      <nav className="mt-3.5 flex flex-wrap justify-center gap-2.5" aria-label="Redes profissionais">
        <a className={pixelButtonClass} href="https://github.com/BraidoLuis" target="_blank" rel="noreferrer">
          <Code2 className="size-[18px]" aria-hidden="true" /> GitHub
        </a>
        <a className={pixelButtonClass} href={linkedinUrl} target="_blank" rel="noreferrer">
          <BriefcaseBusiness className="size-[18px]" aria-hidden="true" /> LinkedIn
        </a>
      </nav>
    </motion.div>
  );
}

function CharacterSelector({
  character,
  onCharacterChange,
}: Pick<StartScreenProps, "character" | "onCharacterChange">) {
  return (
    <fieldset className="m-0 border-0 p-0 max-[720px]:w-full">
      <legend className="mb-2 w-full text-center font-black [text-shadow:2px_2px_0_#28567a]">
        Escolha seu personagem
      </legend>
      <RadioGroup
        value={character}
        onValueChange={(value) => onCharacterChange(value as Character)}
        className="grid grid-cols-2 gap-2.5"
      >
        <CharacterCard
          value="masculine"
          label="Masculino"
          image="/game/character-masculine-portrait.png"
          selected={character === "masculine"}
        />
        <CharacterCard
          value="feminine"
          label="Feminino"
          image="/game/character-feminine-portrait.png"
          selected={character === "feminine"}
        />
      </RadioGroup>
    </fieldset>
  );
}

function CharacterCard({
  value,
  label,
  image,
  selected,
}: {
  value: Character;
  label: string;
  image: string;
  selected: boolean;
}) {
  return (
    <label
      className={cn(
        "flex min-h-[86px] min-w-[158px] cursor-pointer items-center justify-start gap-2.5 border-4 border-[#52291d] bg-[repeating-linear-gradient(0deg,#f4ce82_0_14px,#ecc074_14px_16px)] px-3 py-1.5 font-black text-[#4b2b22] shadow-[inset_0_0_0_2px_#ffd88b,0_4px_0_#30160f] max-[720px]:min-h-[76px] max-[720px]:min-w-0 max-[720px]:justify-center max-[720px]:px-1.5 max-[720px]:text-[.8rem]",
        selected && "-translate-y-1 outline-4 outline-[#ffe59a]",
      )}
    >
      <RadioGroupItem value={value} className="sr-only" />
      <span className="grid h-[72px] w-16 shrink-0 place-items-end overflow-hidden border-[3px] border-[#2d1814] bg-[rgba(119,67,36,.13)] max-[720px]:h-[60px] max-[720px]:w-[52px]" aria-hidden="true">
        <Image
          className="size-full object-contain object-bottom [image-rendering:pixelated]"
          src={image}
          alt=""
          width={256}
          height={256}
          unoptimized
        />
      </span>
      <span>{label}</span>
    </label>
  );
}
