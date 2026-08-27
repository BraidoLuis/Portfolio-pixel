"use client";

import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Code2, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Project } from "@/content/portfolio";
import { pixelButtonClass } from "@/lib/ui-styles";

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
    <div className="relative px-4 pb-4 pt-6">
      <DialogHeader>
        <p className="mx-auto mb-4 mt-[-2.45rem] w-max border-4 border-[#52291d] bg-[#f1bd69] px-4 py-2 font-black text-[#6e361f] shadow-[inset_0_0_0_2px_#ffe1a0,0_4px_0_#31170f]">
          Escolha uma missão
        </p>
        <DialogTitle className="sr-only">Projetos disponíveis</DialogTitle>
        <DialogDescription className="sr-only">
          Navegue pelos projetos e abra o ambiente publicado.
        </DialogDescription>
      </DialogHeader>

      {projects.length === 0 ? (
        <div className="grid min-h-[260px] place-items-center font-black text-[#f6d99c]">
          Abrindo o baú de projetos...
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-[720px]:grid-cols-1">
          {visibleProjects.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-4 font-black text-[#fff0bd]">
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
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <motion.article
      className="flex min-h-[430px] flex-col justify-between gap-4 border-[3px] border-[#75432a] bg-[linear-gradient(100deg,rgba(150,98,54,.12),transparent_14%),#f6d99c] p-5 text-[#4b2b22] shadow-[inset_0_0_0_4px_#ffedbd,5px_6px_0_rgba(47,23,14,.3)] max-[720px]:min-h-[390px]"
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

      {project.live_url || project.repository_url ? (
        <div className="grid grid-cols-2 gap-2.5 max-[720px]:grid-cols-1">
          {project.live_url && (
            <a className={`${pixelButtonClass} min-w-0 px-2.5 text-[.82rem]`} href={project.live_url} target="_blank" rel="noreferrer">
              Ambiente publicado <ExternalLink aria-hidden="true" />
            </a>
          )}
          {project.repository_url && (
            <a className={`${pixelButtonClass} min-w-0 px-2.5 text-[.82rem]`} href={project.repository_url} target="_blank" rel="noreferrer">
              Repositório <Code2 aria-hidden="true" />
            </a>
          )}
        </div>
      ) : (
        <span className={`${pixelButtonClass} cursor-not-allowed opacity-60`}>Projeto privado</span>
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
