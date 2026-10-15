import assert from "node:assert/strict";
import { loadTypeScript } from "./check-exterior.mjs";

const { getProjectLinks } = loadTypeScript("components/portfolio/panels/project-links.ts");
assert.deepEqual(getProjectLinks({ live_url: null, repository_url: null }), []);
assert.deepEqual(getProjectLinks({ live_url: " https://example.com ", repository_url: null }), [
  { kind: "live", label: "Ambiente publicado", href: "https://example.com" },
]);
assert.deepEqual(getProjectLinks({ live_url: null, repository_url: "https://example.com/repo" }), [
  { kind: "repository", label: "Repositório", href: "https://example.com/repo" },
]);
assert.equal(getProjectLinks({ live_url: "https://example.com", repository_url: "https://example.com/repo" }).length, 2);
assert.equal(getProjectLinks({ live_url: " ", repository_url: null }).length, 0);
console.log("Project links passed: both, live only, repository only, empty and whitespace links.");

const { projects } = loadTypeScript("content/projects.ts");
const { filterProjects, getTestingIndicator } = loadTypeScript("components/portfolio/panels/project-catalog.ts");
const all = { category: "Todos", query: "", featuredOnly: false };
assert.equal(new Set(projects.map(project => project.id)).size, projects.length, "Project IDs must be unique");
assert.equal(new Set(projects.map(project => project.slug)).size, projects.length, "Project slugs must be unique");
assert.equal(projects.length, 24, "All projects in the audited inventory must be represented");
for (const project of projects) {
  if (project.repository_url !== null) assert.match(project.repository_url, /^https:\/\/github\.com\/BraidoLuis\/[^/]+$/, "Use a specific repository link when publicly available");
  for (const key of ["summary", "problem", "solution", "role", "development_stage"]) assert(project[key].trim(), `${project.id}: missing ${key}`);
  assert(project.technologies.length && project.features.length && project.backend.length);
  for (const link of getProjectLinks(project)) assert.equal(new URL(link.href).protocol, "https:");
  if (project.thumbnail_url) assert((await import("node:fs")).existsSync(`public${project.thumbnail_url}`), `Missing project image: ${project.id}`);
}
assert.equal(filterProjects(projects, all).length, projects.length);
assert.deepEqual(filterProjects(projects, { ...all, query: "ARQUITETURA" }).map(project => project.id), ["nb-arquitetura"]);
assert(filterProjects(projects, { ...all, query: "visao" }).every(project => project.category === "Visão computacional"));
assert.equal(filterProjects(projects, { ...all, query: "nothing-matches-this" }).length, 0);
assert(filterProjects(projects, { ...all, category: "Jogos" }).every(project => project.category === "Jogos"));
assert(filterProjects(projects, { ...all, featuredOnly: true }).every(project => project.featured));
assert.equal(filterProjects(projects, { ...all, category: "Jogos", query: "Python", featuredOnly: true }).length, 0);
const expected = { "spa-express": 516, fribolos: 435, "meus-gastos": 42, "nb-arquitetura": 20 };
for (const [id, count] of Object.entries(expected)) {
  const project = projects.find(project => project.id === id);
  assert.equal(getTestingIndicator(project.testing), `${count} testes definidos`);
}
assert.equal(getTestingIndicator(projects.find(project => project.id === "portfolio-pixel").testing), "12 scripts de verificação");
assert.equal(getTestingIndicator(projects.find(project => project.id === "orcamento").testing), null);
const shopify = projects.find(project => project.id === "shopify-back-in-stock");
assert(shopify, "Shopify integration must be included");
assert.equal(shopify.repository_url, null, "Do not expose the non-public repository link");
assert.deepEqual(getProjectLinks(shopify), [], "Unconfirmed live/repository URLs must stay hidden");
assert.equal(getTestingIndicator(shopify.testing), null, "Do not invent a test count for Shopify");
assert.deepEqual(filterProjects(projects, { ...all, query: "Shopify" }).map(project => project.id), [shopify.id]);
console.log("Catalog passed: inventory, metadata, image paths, specific links, combined filters, search and test/script indicators.");

const { skills, experiences, certifications } = loadTypeScript("content/portfolio.ts");
const projectIds = new Set(projects.map(project => project.id));
const certificateIds = new Set(certifications.map(item => item.id));
assert.equal(new Set(skills.map(skill => skill.id)).size, skills.length, "Skill IDs must be unique");
assert.equal(new Set(experiences.map(experience => experience.id)).size, experiences.length, "Experience IDs must be unique");
for (const item of [...skills, ...experiences]) {
  assert.equal(new Set(item.relatedProjects).size, item.relatedProjects.length, `${item.id}: duplicate project references`);
  for (const id of item.relatedProjects) assert(projectIds.has(id), `${item.id}: unknown project ID ${id}`);
}
for (const skill of skills) {
  assert(skill.technologies.length && skill.examples.length && skill.summary.trim(), `${skill.id}: incomplete skill content`);
  for (const id of skill.relatedCertifications) assert(certificateIds.has(id), `${skill.id}: unknown certification ID ${id}`);
}
const studies = skills.find(skill => skill.id === "infrastructure-studies");
assert(studies.studying && studies.technologies.includes("Docker") && studies.technologies.includes("Linux"));
assert.deepEqual(studies.relatedProjects, [], "Do not imply production use of technologies marked as studies");
assert.equal(experiences.filter(item => item.kind === "education").length, 1);
assert.equal(experiences.filter(item => item.kind === "academic").length, 1);
assert.equal(experiences.find(item => item.id === "vambora").period, "Setembro de 2025 — atual");
assert.deepEqual(experiences.find(item => item.id === "freelance").relatedProjects, ["fribolos", "spa-express"], "Use only the freelance projects confirmed by the user");
assert.equal(experiences.find(item => item.id === "serra-junior").period, "Janeiro de 2025 — 2026");
assert.deepEqual(experiences.find(item => item.id === "serra-junior").relatedProjects, ["transformacao"]);
assert(!experiences.some(item => item.id === "transformacao-exp"), "Avoid duplicate BJJ employment entries");
assert.equal(experiences.find(item => item.id === "uerj").period, "Outubro de 2021 — em andamento");
console.log("Portfolio references passed: real project/certificate IDs, unique records, applied examples, study status and confirmed periods.");
