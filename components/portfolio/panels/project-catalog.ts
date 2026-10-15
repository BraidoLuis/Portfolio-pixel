import type { Project, ProjectTesting } from "@/content/projects";

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function filterProjects(projects: Project[], filters: { category: string; query: string; featuredOnly: boolean }) {
  const query = normalized(filters.query);
  return projects.filter(project =>
    (filters.category === "Todos" || project.category === filters.category) &&
    (!filters.featuredOnly || project.featured) &&
    (!query || normalized([project.title, project.summary, project.category, ...project.technologies].join(" ")).includes(query)),
  ).sort((a, b) => Number(b.featured) - Number(a.featured) || a.display_order - b.display_order);
}

export function getTestingIndicator(testing: ProjectTesting) {
  const tests = testing.suites.filter(suite => suite.kind === "tests").reduce((sum, suite) => sum + suite.count, 0);
  const scripts = testing.suites.filter(suite => suite.kind === "scripts").reduce((sum, suite) => sum + suite.count, 0);
  return [tests ? `${tests} testes definidos` : null, scripts ? `${scripts} scripts de verificação` : null].filter(Boolean).join(" · ") || null;
}
