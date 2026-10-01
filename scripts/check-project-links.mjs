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
