"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Code2, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Project } from "@/content/projects";
import { pixelButtonClass } from "@/lib/ui-styles";
import { PanelFrame, PanelKicker, TagList } from "./panel-frame";
import { getProjectLinks } from "./project-links";
import { filterProjects, getTestingIndicator } from "./project-catalog";

const filterClass = "min-h-11 border-2 border-[#75432a] px-3 py-2 text-base font-black focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#713b26]";

export function ProjectCarousel({ projects }: { projects: Project[] }) {
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(2);
  const [category, setCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const savedScroll = useRef(0);

  useEffect(() => {
    const breakpoint = window.matchMedia("(max-width: 759px)");
    const update = () => { setPerPage(breakpoint.matches ? 1 : 2); setPage(0); };
    update();
    breakpoint.addEventListener("change", update);
    return () => breakpoint.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const dialog = root.current?.closest<HTMLElement>("[data-slot=dialog-content]");
    if (selected) {
      if (dialog) dialog.scrollTop = 0;
      root.current?.querySelector<HTMLElement>("[data-slot=dialog-title]")?.focus({ preventScroll: true });
    } else if (lastTrigger.current) {
      if (dialog) dialog.scrollTop = savedScroll.current;
      const id = lastTrigger.current.dataset.projectId;
      if (id) root.current?.querySelector<HTMLButtonElement>(`[data-project-id="${id}"]`)?.focus({ preventScroll: true });
    }
  }, [selected]);

  const categories = useMemo(() => ["Todos", ...new Set(projects.map(project => project.category))], [projects]);
  const filtered = useMemo(() => filterProjects(projects, { category, query, featuredOnly }), [projects, category, query, featuredOnly]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * perPage, (safePage + 1) * perPage);

  return (
    <div ref={root}>
      {selected ? (
        <ProjectDetails project={selected} onBack={() => setSelected(null)} />
      ) : (
        <PanelFrame>
          <DialogHeader className="mb-5 text-left">
            <PanelKicker>Baú de projetos</PanelKicker>
            <DialogTitle>Projetos</DialogTitle>
            <DialogDescription>Escolha uma missão. Abra os detalhes para conhecer as funcionalidades, integrações e testes.</DialogDescription>
          </DialogHeader>

          <div className="mb-5 grid gap-3">
            <label className="grid gap-1 text-base font-black" htmlFor="project-search">
              Buscar projeto ou tecnologia
              <input id="project-search" type="search" value={query}
                onChange={event => { setQuery(event.target.value); setPage(0); }}
                placeholder="Ex.: WhatsApp, Python, Supabase…"
                className={`${filterClass} w-full min-w-0 bg-[#ffedbd] font-normal placeholder:text-[#674638]`} />
            </label>
            <div role="group" aria-label="Categorias de projetos" className="flex flex-wrap gap-2">
              {categories.map(item => (
                <button key={item} type="button" aria-pressed={category === item}
                  className={`${filterClass} ${category === item ? "bg-[#713b26] text-[#fff2c4]" : "bg-[#ead09a] text-[#4b2b22]"}`}
                  onClick={() => { setCategory(item); setPage(0); }}>{item}</button>
              ))}
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-base font-black">
              <input type="checkbox" checked={featuredOnly} className="size-5 accent-[#713b26]"
                onChange={event => { setFeaturedOnly(event.target.checked); setPage(0); }} />
              Apenas destaques
            </label>
            <p role="status" aria-live="polite" className="text-base">
              {filtered.length} de {projects.length} projetos · {filtered.length ? `página ${safePage + 1} de ${pageCount}` : "nenhum resultado"}
            </p>
          </div>

          {visible.length ? (
            <div className="grid grid-cols-2 gap-4 max-[759px]:grid-cols-1">
              {visible.map(project => (
                <ProjectCard key={project.id} project={project} onOpen={trigger => {
                  lastTrigger.current = trigger;
                  savedScroll.current = root.current?.closest<HTMLElement>("[data-slot=dialog-content]")?.scrollTop ?? 0;
                  setSelected(project);
                }} />
              ))}
            </div>
          ) : (
            <div className="grid min-h-40 place-items-center gap-3 text-center">
              <p>{projects.length ? "Nenhum projeto corresponde aos filtros." : "Novas missões serão adicionadas em breve."}</p>
              {projects.length > 0 && <button type="button" className={pixelButtonClass} onClick={() => { setQuery(""); setCategory("Todos"); setFeaturedOnly(false); setPage(0); }}>Limpar filtros</button>}
            </div>
          )}

          {filtered.length > 0 && (
            <nav aria-label="Páginas de projetos" className="mt-5 flex items-center justify-center gap-4 font-black">
              <PaginationButton label="Projetos anteriores" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}><ArrowLeft aria-hidden="true" /></PaginationButton>
              <span>{safePage + 1} / {pageCount}</span>
              <PaginationButton label="Próximos projetos" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}><ArrowRight aria-hidden="true" /></PaginationButton>
            </nav>
          )}
        </PanelFrame>
      )}
    </div>
  );
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: (trigger: HTMLButtonElement) => void }) {
  const indicator = getTestingIndicator(project.testing);
  const reducedMotion = useReducedMotion();
  return (
    <motion.article className="flex min-w-0 flex-col gap-3 border-[3px] border-[#75432a] bg-[#f6d99c] p-4 shadow-[inset_0_0_0_4px_#ffedbd,4px_5px_0_rgba(47,23,14,.3)] sm:p-5"
      initial={reducedMotion ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
      <ProjectImage project={project} />
      <div className="flex flex-wrap gap-2 text-sm font-black uppercase text-[#713b26]">
        <span>{project.category}</span>{project.featured && <span className="border border-[#75432a] px-1">Destaque</span>}
      </div>
      <h3 className="text-2xl font-black leading-tight text-[#713b26]">{project.title}</h3>
      <p className="leading-normal">{project.summary}</p>
      <p className="text-base font-bold">{project.development_stage}</p>
      {indicator && <p className="border-l-4 border-[#75432a] bg-[#ead09a] px-3 py-1 text-base font-black">{indicator}</p>}
      <TagList items={project.technologies.slice(0, 5)} />
      <button type="button" data-project-id={project.id} className={`${pixelButtonClass} mt-auto w-full`} onClick={event => onOpen(event.currentTarget)} aria-label={`Ver detalhes de ${project.title}`}>Ver detalhes <ArrowRight className="size-5 shrink-0" aria-hidden="true" /></button>
      <ProjectLinks project={project} />
    </motion.article>
  );
}

export function ProjectDetails({ project, onBack, backLabel = "Voltar aos projetos" }: { project: Project; onBack: () => void; backLabel?: string }) {
  return (
    <PanelFrame>
      <div className="sticky top-0 z-1 -mx-1 bg-[#f6d99c] pb-3 pr-12">
        <button type="button" className={pixelButtonClass} onClick={onBack}><ArrowLeft className="size-5 shrink-0" aria-hidden="true" /> {backLabel}</button>
      </div>
      <DialogHeader className="mb-5 text-left">
        <PanelKicker>{project.category} · {project.development_stage}</PanelKicker>
        <DialogTitle tabIndex={-1} className="outline-none">{project.title}</DialogTitle>
        <DialogDescription>{project.summary}</DialogDescription>
      </DialogHeader>
      <ProjectImage project={project} large />
      <div className="mt-5 grid gap-5 text-[1.0625rem] leading-relaxed sm:text-lg">
        <DetailSection title="O problema"><p>{project.problem}</p></DetailSection>
        <DetailSection title="A solução"><p>{project.solution}</p></DetailSection>
        <DetailSection title="Minha participação"><p>{project.role}</p></DetailSection>
        <DetailSection title="Funcionalidades"><DetailList items={project.features} /></DetailSection>
        <DetailSection title="Tecnologias"><TagList items={project.technologies} /></DetailSection>
        <DetailSection title="Backend, dados e acesso"><DetailList items={project.backend} /></DetailSection>
        {project.integrations.length > 0 && <DetailSection title="Integrações"><DetailList items={project.integrations} /></DetailSection>}
        {project.deployment && <DetailSection title="Hospedagem e deploy"><p>{project.deployment}</p></DetailSection>}
        <DetailSection title="Testes e verificações">
          {project.testing.suites.length > 0 && <DetailList items={project.testing.suites.map(suite => `${suite.count} ${suite.kind === "scripts" ? "scripts" : "testes"} — ${suite.label}`)} />}
          <p className="mt-2">{project.testing.description}</p>
          <p className="mt-2 text-sm">Definições conferidas em {project.testing.verified_on.split("-").reverse().join("/")}.</p>
        </DetailSection>
        {project.limitations.length > 0 && <DetailSection title="Estado atual e próximos passos"><DetailList items={project.limitations} /></DetailSection>}
        <ProjectLinks project={project} />
      </div>
    </PanelFrame>
  );
}

function ProjectImage({ project, large = false }: { project: Project; large?: boolean }) {
  if (!project.thumbnail_url) return null;
  return <div className={`w-full border-[3px] border-[#6f3c24] bg-[#ffedbd] bg-contain bg-center bg-no-repeat ${large ? "h-52 sm:h-64" : "h-28"}`}
    style={{ backgroundImage: `url(${project.thumbnail_url})` }} role="img" aria-label={`Imagem do projeto ${project.title}`} />;
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="min-w-0 border-t-2 border-dashed border-[#875132]/50 pt-3"><h3 className="mb-2 text-xl font-black text-[#713b26]">{title}</h3>{children}</section>;
}
function DetailList({ items }: { items: string[] }) {
  return <ul className="list-disc space-y-2 pl-5">{items.map(item => <li key={item}>{item}</li>)}</ul>;
}
function ProjectLinks({ project }: { project: Project }) {
  const links = getProjectLinks(project);
  if (!links.length) return null;
  return <div className="flex flex-wrap gap-2">
    {links.map(link => <a key={link.kind} className={`${pixelButtonClass} min-w-0 flex-1 text-center text-base`} href={link.href} target="_blank" rel="noreferrer">
      {link.kind === "live" ? <ExternalLink className="size-4 shrink-0" aria-hidden="true" /> : <Code2 className="size-4 shrink-0" aria-hidden="true" />}{link.label}
    </a>)}
  </div>;
}
function PaginationButton({ children, disabled, label, onClick }: { children: ReactNode; disabled: boolean; label: string; onClick: () => void }) {
  return <button type="button" className={`${pixelButtonClass} size-11 p-1`} aria-label={label} onClick={onClick} disabled={disabled}>{children}</button>;
}
