"use client";

import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Code2, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Project } from "@/content/projects";
import { pixelButtonClass } from "@/lib/ui-styles";
import { PanelFrame, PanelKicker } from "./panel-frame";
import { getProjectLinks } from "./project-links";

export function ProjectCarousel({ projects }: { projects: Project[] }) {
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(2);

  useEffect(() => {
    const updatePagination = () => {
      setPerPage(window.innerWidth < 760 ? 1 : 2);
      setPage(0);
    };
    updatePagination();
    window.addEventListener("resize", updatePagination);
    return () => window.removeEventListener("resize", updatePagination);
  }, []);

  const pageCount = Math.max(1, Math.ceil(projects.length / perPage));
  const visibleProjects = useMemo(
    () => projects.slice(page * perPage, page * perPage + perPage),
    [page, perPage, projects],
  );

  return (
    <PanelFrame>
      <DialogHeader className="mb-6 pr-8 text-left">
        <PanelKicker className="max-[720px]:pl-6">Baú de projetos</PanelKicker>
        <DialogTitle>Projetos</DialogTitle>
        <DialogDescription>Escolha uma missão e conheça o trabalho.</DialogDescription>
      </DialogHeader>

      {projects.length === 0 ? (
        <div className="grid min-h-[260px] place-items-center text-center font-black text-[#4b2b22]">
          Novas missões serão adicionadas em breve.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-[720px]:grid-cols-1">
          {visibleProjects.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      )}

      {projects.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-4 font-black text-[#4b2b22]">
          <PaginationButton
            label="Projetos anteriores"
            disabled={page === 0}
            onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
          >
            <ArrowLeft aria-hidden="true" />
          </PaginationButton>
          <span>{page + 1} / {pageCount}</span>
          <PaginationButton
            label="Próximos projetos"
            disabled={page >= pageCount - 1}
            onClick={() => setPage((currentPage) => Math.min(pageCount - 1, currentPage + 1))}
          >
            <ArrowRight aria-hidden="true" />
          </PaginationButton>
        </div>
      )}
    </PanelFrame>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const links = getProjectLinks(project);
  return (
    <motion.article
      className="flex flex-col gap-4 border-[3px] border-[#75432a] bg-[linear-gradient(100deg,rgba(150,98,54,.12),transparent_14%),#f6d99c] p-4 text-[#4b2b22] shadow-[inset_0_0_0_4px_#ffedbd,5px_6px_0_rgba(47,23,14,.3)] sm:p-5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div>
        {project.thumbnail_url && (
          <div
            className="mb-3.5 h-[120px] w-full border-[3px] border-[#6f3c24] bg-cover bg-center shadow-[inset_0_0_0_2px_rgba(255,235,177,.6)]"
            style={{ backgroundImage: `url(${project.thumbnail_url})` }}
            role="img"
            aria-label={`Capa do projeto ${project.title}`}
          />
        )}
        <p className="text-[.72rem] font-black uppercase text-[#94522f]">{project.role}</p>
        <h3 className="mb-3 mt-1 text-[1.4rem] text-[#713b26]">{project.title}</h3>
        <p className="leading-normal">{project.summary}</p>
        <p className="text-[.86rem] leading-normal"><strong>Missão:</strong> {project.solution}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.technologies.map((technology) => (
            <span key={technology} className="border-2 border-[rgba(89,46,27,.36)] bg-[rgba(104,55,31,.13)] px-2 py-1 text-xs font-black">
              {technology}
            </span>
          ))}
        </div>
      </div>

      {links.length > 0 && (
        <div className={`mt-auto grid gap-2.5 ${links.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {links.map((link) => (
            <a key={link.label} className={`${pixelButtonClass} min-w-0 flex-wrap px-2 text-center text-[.75rem] leading-tight sm:text-[.82rem]`}
              href={link.href} target="_blank" rel="noreferrer">
              {link.label} {link.kind === "live" ? <ExternalLink aria-hidden="true" /> : <Code2 aria-hidden="true" />}
            </a>
          ))}
        </div>
      )}
    </motion.article>
  );
}

function PaginationButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="grid h-[38px] w-[42px] place-items-center border-[3px] border-[#2d1814] bg-[#9b542e] text-[#fff0bd] disabled:cursor-not-allowed disabled:opacity-35"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
