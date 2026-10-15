"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Project } from "@/content/projects";
import { pixelButtonClass } from "@/lib/ui-styles";
import { ProjectDetails } from "./project-carousel";

export type OpenRelatedProject = (projectId: string, trigger: HTMLButtonElement) => void;
const ProjectLinkContext = createContext<OpenRelatedProject | null>(null);

export function LinkedProjectPanel({ projects, backLabel, children }: {
  projects: Project[];
  backLabel: string;
  children: ReactNode;
}) {
  const [selected, setSelected] = useState<Project | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const origin = useRef<{ key: string; scrollTop: number } | null>(null);

  useEffect(() => {
    const dialog = root.current?.closest<HTMLElement>("[data-slot=dialog-content]");
    if (selected) {
      if (dialog) dialog.scrollTop = 0;
      root.current?.querySelector<HTMLElement>("[data-slot=dialog-title]")?.focus({ preventScroll: true });
    } else if (origin.current) {
      if (dialog) dialog.scrollTop = origin.current.scrollTop;
      root.current?.querySelector<HTMLButtonElement>(`[data-project-link="${origin.current.key}"]`)?.focus({ preventScroll: true });
    }
  }, [selected]);

  const openProject: OpenRelatedProject = (id, trigger) => {
    const project = projects.find(project => project.id === id);
    if (!project) return;
    origin.current = {
      key: trigger.dataset.projectLink ?? "",
      scrollTop: root.current?.closest<HTMLElement>("[data-slot=dialog-content]")?.scrollTop ?? 0,
    };
    setSelected(project);
  };

  return <div ref={root}><ProjectLinkContext.Provider value={openProject}>{selected
    ? <ProjectDetails project={selected} onBack={() => setSelected(null)} backLabel={backLabel} />
    : children}</ProjectLinkContext.Provider></div>;
}

export function RelatedProjectLinks({ ids, projects, contextId }: {
  ids: string[];
  projects: Project[];
  contextId: string;
}) {
  const onOpen = useContext(ProjectLinkContext);
  const related = ids.flatMap(id => {
    const project = projects.find(project => project.id === id);
    return project ? [project] : [];
  });
  if (!related.length || !onOpen) return null;
  return (
    <div className="mt-4">
      <p className="mb-2 text-base font-black">Projetos relacionados</p>
      <div className="flex flex-wrap gap-2">
        {related.map(project => <button key={project.id} type="button"
          data-project-link={`${contextId}:${project.id}`}
          className={`${pixelButtonClass} max-w-full min-w-0 text-left text-base`}
          aria-label={`Ver detalhes de ${project.title}`}
          onClick={event => onOpen(project.id, event.currentTarget)}>{project.title}</button>)}
      </div>
    </div>
  );
}
