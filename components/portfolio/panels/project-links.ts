import type { Project } from "@/content/projects";

export function getProjectLinks(project: Pick<Project, "live_url" | "repository_url">) {
  const links: { kind: "live" | "repository"; label: string; href: string }[] = [];
  if (project.live_url?.trim()) links.push({ kind: "live", label: "Ambiente publicado", href: project.live_url.trim() });
  if (project.repository_url?.trim()) links.push({ kind: "repository", label: "Repositório", href: project.repository_url.trim() });
  return links;
}
