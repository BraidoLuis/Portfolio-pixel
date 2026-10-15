import { Code2, ExternalLink } from "lucide-react";
import { WorldMinimap } from "@/components/portfolio/game/world-minimap";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { certifications, experiences, skills } from "@/content/portfolio";
import type { Project } from "@/content/projects";
import { siteConfig } from "@/content/site";
import { pixelButtonClass } from "@/lib/ui-styles";
import { formatMonthYear } from "@/lib/format-month-year";
import { PanelFrame, PanelKicker, TagList } from "./panel-frame";
import { LinkedProjectPanel, RelatedProjectLinks } from "./linked-project-panel";

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
        <p><strong>Porta:</strong> saia para explorar projetos, habilidades, experiências e certificações.</p>
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
            <strong className="text-[1rem] uppercase tracking-[.08em] opacity-70">Canal {channel.id}</strong>
            <span className="text-[1.25rem] font-black">{channel.label}</span>
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
  const education = experiences.find(experience => experience.kind === "education")!;
  return (
    <PanelFrame tv>
      <PanelHeader
        tv
        kicker="Livro da formação"
        title={`${education.title} — ${education.institution}`}
        description={education.period}
      />
      <p>
        {education.summary} Minha trajetória acadêmica inclui pesquisa de correlação de imagens 2D
        em Python e projetos de programação, algoritmos, métodos numéricos e visão computacional.
      </p>
      <BackButton onClick={onBack} />
    </PanelFrame>
  );
}

export function SkillsPanel({ projects }: { projects: Project[] }) {
  return (
    <LinkedProjectPanel projects={projects} backLabel="Voltar às habilidades">
    <PanelFrame>
      <PanelHeader
        kicker="Baú de habilidades"
        title="Habilidades descobertas"
        description="Conhecimentos aplicados nos projetos, na trajetória profissional e nos estudos. Abra os exemplos para conhecer cada aplicação."
      />
      <div className="my-5 grid gap-3.5">
        {skills.map((skill) => (
          <article key={skill.id} data-skill-id={skill.id} className="min-w-0 border-b-2 border-dashed border-[rgba(85,45,27,.4)] pb-5">
            <h3 className="text-[1.375rem] font-black leading-tight text-[#6f3b25]">{skill.title}</h3>
            {skill.studying && <p className="mt-2 text-base font-black text-[#875132]">Em estudo e aprofundamento</p>}
            <p className="my-1.5 leading-normal">{skill.summary}</p>
            <TagList items={skill.technologies} />
            <p className="mb-1 mt-4 text-base font-black">Exemplos de aplicação</p>
            <ul className="list-disc space-y-1.5 pl-5 text-[1.0625rem] leading-relaxed">
              {skill.examples.map(example => <li key={example}>{example}</li>)}
            </ul>
            {skill.relatedCertifications.length > 0 && <div className="mt-3 text-base">
              <p className="font-black">Certificações relacionadas</p>
              <ul className="mt-1 list-disc pl-5">{skill.relatedCertifications.map(id => {
                const certification = certifications.find(item => item.id === id);
                return certification ? <li key={id}>{certification.title} — {certification.issuer}</li> : null;
              })}</ul>
            </div>}
            <RelatedProjectLinks ids={skill.relatedProjects} projects={projects} contextId={skill.id} />
          </article>
        ))}
      </div>
    </PanelFrame>
    </LinkedProjectPanel>
  );
}

const experienceGroups = [
  { kind: "professional", title: "Experiências profissionais" },
  { kind: "academic", title: "Experiência acadêmica" },
  { kind: "education", title: "Formação acadêmica" },
] as const;

export function ExperiencesPanel({ projects }: { projects: Project[] }) {
  return (
    <LinkedProjectPanel projects={projects} backLabel="Voltar às experiências">
    <PanelFrame>
      <PanelHeader
        kicker="Baú de memórias"
        title="Experiências"
        description="Experiências profissionais, pesquisa e formação, com responsabilidades e projetos relacionados."
      />
      <div className="mt-5 grid gap-6">
        {experienceGroups.map(group => <section key={group.kind} aria-labelledby={`experience-group-${group.kind}`}>
          <h3 id={`experience-group-${group.kind}`} className="mb-4 text-xl font-black text-[#875132]">{group.title}</h3>
          {experiences.filter(experience => experience.kind === group.kind).map((experience) => (
          <article
            key={experience.id}
            data-experience-id={experience.id}
            className="relative min-w-0 border-l-[3px] border-[#9c5b32] pb-6 pl-5 before:absolute before:-left-2 before:top-0.5 before:size-[13px] before:border-[3px] before:border-[#6b3822] before:bg-[#e9a94f] before:content-['']"
          >
            <span className="text-[1rem] font-black text-[#875132]">{experience.period}</span>
            <h4 className="text-[1.375rem] font-black leading-tight text-[#6f3b25]">{experience.title}</h4>
            <p className="mt-1 font-black">{experience.institution}</p>
            <p className="my-1.5 leading-normal">{experience.summary}</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[1.0625rem] leading-relaxed">
              {experience.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}
            </ul>
            <RelatedProjectLinks ids={experience.relatedProjects} projects={projects} contextId={experience.id} />
          </article>
          ))}
        </section>)}
      </div>
    </PanelFrame>
    </LinkedProjectPanel>
  );
}

export function CertificationsPanel() {
  return (
    <PanelFrame>
      <PanelHeader
        kicker="Baú de certificações"
        title="Certificações"
        description="Cursos e certificações que marcam meus estudos."
      />
      <div className="mt-5 grid gap-3">
        {certifications.map((certification) => (
          <article key={certification.id} className="border-[3px] border-[#875132] bg-[rgba(129,74,38,.12)] p-4">
            <span className="text-[1rem] font-black uppercase tracking-[.08em] text-[#875132]">{certification.issuer} · {certification.kind === "course" ? "Curso concluído" : certification.kind === "in-progress" ? "Em andamento" : "Certificação"}</span>
            <h3 className="mt-1 text-[1.375rem] font-black leading-tight text-[#6f3b25]">{certification.title}</h3>
            <p className="mt-2 leading-normal">{certification.summary}</p>
            {(certification.issued_on || certification.expires_on || certification.credential_id) && (
              <dl className="mt-3 grid gap-1 text-base">
                {certification.issued_on && <div><dt className="inline font-black">Emissão: </dt><dd className="inline"><time dateTime={certification.issued_on}>{formatMonthYear(certification.issued_on)}</time></dd></div>}
                {certification.expires_on && <div><dt className="inline font-black">Validade: </dt><dd className="inline"><time dateTime={certification.expires_on}>{formatMonthYear(certification.expires_on)}</time></dd></div>}
                {certification.credential_id && <div><dt className="inline font-black">Credencial: </dt><dd className="inline break-all">{certification.credential_id}</dd></div>}
              </dl>
            )}
            {certification.competencies.length > 0 && <div className="mt-3"><p className="text-base font-black">Competências</p><TagList items={certification.competencies} /></div>}
            {certification.credential_url && <a className={`${pixelButtonClass} mt-3`} href={certification.credential_url} target="_blank" rel="noreferrer">Verificar credencial <ExternalLink className="size-4" aria-hidden="true" /></a>}
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
        description="Saindo da casa, siga pelas trilhas ao redor dela para chegar aos quatro baús."
      />
      <WorldMinimap />
      <div className="mt-5 grid grid-cols-2 gap-3 max-[720px]:grid-cols-1 [&>span]:border-[3px] [&>span]:border-[rgba(93,49,28,.48)] [&>span]:bg-[rgba(105,57,31,.12)] [&>span]:p-3 [&>span]:font-black">
        <span>1 · Projetos — ao norte, após a escada</span>
        <span>2 · Habilidades — clareira à esquerda</span>
        <span>3 · Experiências — clareira à direita</span>
        <span>4 · Certificações — trilha inferior à esquerda da casa</span>
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
