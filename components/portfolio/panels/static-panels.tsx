import { Code2, ExternalLink } from "lucide-react";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { experiences, skills } from "@/content/portfolio";
import { siteConfig } from "@/content/site";
import { pixelButtonClass } from "@/lib/ui-styles";
import { PanelFrame, PanelKicker, TagList } from "./panel-frame";

export function IntroPanel({ onContinue }: { onContinue: () => void }) {
  return (
    <PanelFrame>
      <PanelHeader
        kicker="Guia encontrado no baú"
        title="Como explorar o portfólio"
        description="Caminhe pelo quarto, aproxime-se dos objetos e interaja para descobrir minha trajetória."
      />
      <div className="my-5 flex flex-wrap gap-2.5 max-[720px]:flex-col">
        <ControlHint keyName="WASD" label="caminhar" />
        <ControlHint keyName="E" label="interagir" />
        <ControlHint keyName="ESC" label="fechar painéis" />
      </div>
      <div className="mb-5 grid gap-2 text-left [&>p]:border-l-4 [&>p]:border-[#91502c] [&>p]:bg-[rgba(129,74,38,.09)] [&>p]:px-3 [&>p]:py-2.5">
        <p><strong>TV:</strong> escolha entre Sobre mim, Formação e Contatos.</p>
        <p><strong>Baú ao lado da cama:</strong> abra este guia novamente quando precisar.</p>
        <p><strong>Lareira:</strong> aproxime-se para acender ou apagar o fogo.</p>
        <p><strong>Porta:</strong> saia para explorar projetos, habilidades e experiências.</p>
      </div>
      <button type="button" className={pixelButtonClass} onClick={onContinue}>
        Começar a explorar
      </button>
    </PanelFrame>
  );
}

export function TvPanel({ onSelect }: { onSelect: (panel: "about" | "education" | "contact") => void }) {
  const channels = [
    { id: "01", label: "Sobre mim", panel: "about" as const },
    { id: "02", label: "Formação", panel: "education" as const },
    { id: "03", label: "Contatos", panel: "contact" as const },
  ];

  return (
    <PanelFrame tv>
      <PanelHeader
        tv
        kicker="Central de informações"
        title="O que deseja assistir?"
        description="Escolha um canal para conhecer melhor minha trajetória."
      />
      <div className="mt-5 grid grid-cols-3 gap-3 max-[720px]:grid-cols-1">
        {channels.map((channel) => (
          <button
            key={channel.id}
            type="button"
            className="grid gap-1 border-[3px] border-[#5d311c] bg-[#e7b96b] px-3 py-4 text-left text-[#4a291d] shadow-[inset_0_0_0_3px_#f6d99c,3px_3px_0_#3e2118] transition-[transform,filter] hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#fff0b6]"
            onClick={() => onSelect(channel.panel)}
          >
            <strong className="text-[.72rem] uppercase tracking-[.08em] opacity-70">Canal {channel.id}</strong>
            <span className="text-[1.05rem] font-black">{channel.label}</span>
          </button>
        ))}
      </div>
    </PanelFrame>
  );
}

export function AboutPanel({ onBack }: { onBack: () => void }) {
  return (
    <PanelFrame tv>
      <PanelHeader
        tv
        kicker="Registro encontrado"
        title="Sobre mim"
        description="Sou Luís Braido, estudante de Engenharia da Computação na UERJ e desenvolvedor Full Stack."
      />
      <p>
        Gosto de transformar problemas reais em produtos digitais. Trabalho com aplicações web,
        integrações, bancos de dados e experiências responsivas e venho ampliando meus estudos em
        Segurança da Informação.
      </p>
      <TagList tv items={["Full Stack", "Engenharia", "Segurança"]} />
      <BackButton onClick={onBack} />
    </PanelFrame>
  );
}

export function EducationPanel({ onBack }: { onBack: () => void }) {
  return (
    <PanelFrame tv>
      <PanelHeader
        tv
        kicker="Livro da formação"
        title="Engenharia da Computação — UERJ"
        description="Formação multidisciplinar em desenvolvimento, sistemas e resolução de problemas."
      />
      <p>
        Minha trajetória acadêmica inclui Iniciação Científica com Python, trabalhos em visão
        computacional, sistemas embarcados e projetos de Engenharia de Software.
      </p>
      <BackButton onClick={onBack} />
    </PanelFrame>
  );
}

export function SkillsPanel({ onProjects }: { onProjects: () => void }) {
  return (
    <PanelFrame>
      <PanelHeader
        kicker="Baú de habilidades"
        title="Habilidades descobertas"
        description="Tecnologias agrupadas pela forma como aparecem nos meus projetos."
      />
      <div className="my-5 grid gap-3.5">
        {skills.map((skill) => (
          <article key={skill.id} className="border-b-2 border-dashed border-[rgba(85,45,27,.4)] pb-3.5">
            <h3 className="text-[1.02rem] text-[#6f3b25]">{skill.title}</h3>
            <p className="my-1.5 leading-normal">{skill.summary}</p>
            <TagList items={skill.technologies} />
          </article>
        ))}
      </div>
      <button type="button" className={pixelButtonClass} onClick={onProjects}>
        Ver projetos relacionados
      </button>
    </PanelFrame>
  );
}

export function ExperiencesPanel() {
  return (
    <PanelFrame>
      <PanelHeader
        kicker="Baú de memórias"
        title="Experiências"
        description="Marcos que ajudaram a construir minha trajetória."
      />
      <div className="mt-4 grid">
        {experiences.map((experience) => (
          <article
            key={experience.id}
            className="relative border-l-[3px] border-[#9c5b32] pb-5 pl-6 before:absolute before:-left-2 before:top-0.5 before:size-[13px] before:border-[3px] before:border-[#6b3822] before:bg-[#e9a94f] before:content-['']"
          >
            <span className="text-xs font-black text-[#875132]">{experience.period}</span>
            <h3 className="text-[1.02rem] text-[#6f3b25]">{experience.title}</h3>
            <p className="my-1.5 leading-normal">{experience.summary}</p>
          </article>
        ))}
      </div>
    </PanelFrame>
  );
}

export function MapPanel() {
  return (
    <PanelFrame>
      <PanelHeader
        kicker="Placa de orientação"
        title="Onde estão os baús?"
        description="Saindo da casa, siga pelo caminho principal até chegar à bifurcação."
      />
      <div className="mt-5 grid grid-cols-2 gap-3 max-[720px]:grid-cols-1 [&>span]:border-[3px] [&>span]:border-[rgba(93,49,28,.48)] [&>span]:bg-[rgba(105,57,31,.12)] [&>span]:p-4 [&>span]:text-center [&>span]:font-black">
        <span>↑ Em frente: baú de Projetos</span>
        <span>← À esquerda: baús de Habilidades</span>
        <span>À direita: baús de Experiências →</span>
        <span>↓ Para retornar: casa do Luís</span>
      </div>
    </PanelFrame>
  );
}

export function ContactPanel({ onBack, linkedinUrl }: { onBack: () => void; linkedinUrl: string }) {
  return (
    <PanelFrame tv>
      <PanelHeader
        tv
        kicker="Quadro de contatos"
        title="Vamos conversar?"
        description="Conheça meus códigos e acompanhe minha trajetória profissional."
      />
      <div className="mb-4 mt-5 flex flex-wrap gap-3">
        <a className={pixelButtonClass} href={siteConfig.githubUrl} target="_blank" rel="noreferrer">
          <Code2 className="size-[18px]" aria-hidden="true" /> GitHub
        </a>
        <a className={pixelButtonClass} href={linkedinUrl} target="_blank" rel="noreferrer">
          <ExternalLink className="size-[18px]" aria-hidden="true" /> LinkedIn
        </a>
      </div>
      <BackButton onClick={onBack} />
    </PanelFrame>
  );
}

function PanelHeader({
  kicker,
  title,
  description,
  tv = false,
}: {
  kicker: string;
  title: string;
  description: string;
  tv?: boolean;
}) {
  return (
    <DialogHeader>
      <PanelKicker className={tv ? "text-[#f0d27c]" : undefined}>{kicker}</PanelKicker>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
  );
}

function ControlHint({ keyName, label }: { keyName: string; label: string }) {
  return (
    <span className="border-2 border-[rgba(91,49,28,.45)] bg-[rgba(129,74,38,.13)] px-3 py-2 font-black">
      <kbd className="border-2 border-[#32180f] bg-[#68371f] px-1.5 py-0.5 text-[#fff4cf] shadow-[0_2px_0_#32180f]">{keyName}</kbd> {label}
    </span>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return <button type="button" className={pixelButtonClass} onClick={onClick}>Voltar aos canais</button>;
}
