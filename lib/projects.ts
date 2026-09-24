import { projects, type Project } from "@/content/projects";

// A página seleciona o conteúdo local durante o build e o entrega ao jogo por props.
export function getPublishedProjects(): Project[] {
  return projects
    .filter((project) => project.status === "published")
    .sort((first, second) => first.display_order - second.display_order);
}
