import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Instantiate the production persisted store twice against one browser-like
// storage. This checks a fresh session, one-time unlock, and return to menu.
const filename = fileURLToPath(new URL("../components/portfolio/store/portfolio-store.ts", import.meta.url));
const source = ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const values = new Map();
const localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};
const require = createRequire(import.meta.url);
function loadStore() {
  const loadedModule = { exports: {} };
  new Function("require", "module", "exports", "localStorage", source)(require, loadedModule, loadedModule.exports, localStorage);
  return loadedModule.exports.usePortfolioStore;
}

const first = loadStore();
assert.equal(first.getState().fishCaught, 0);
assert.equal(first.getState().fishingAchievement, false);
first.getState().setCharacter("feminine");
first.getState().startGame();
assert.equal(first.getState().recordFishCatch(), false);
assert.equal(first.getState().recordFishCatch(), false);
assert.equal(first.getState().recordFishCatch(), true);
assert.equal(first.getState().fishCaught, 3);
assert.equal(first.getState().fishingAchievement, true);
assert.equal(first.getState().recordFishCatch(), false);
assert.equal(first.getState().fishCaught, 4);
first.getState().returnToMenu();

const second = loadStore();
assert.equal(second.getState().started, false);
assert.equal(second.getState().character, "feminine");
assert.equal(second.getState().fishCaught, 4);
assert.equal(second.getState().fishingAchievement, true);
second.getState().startGame();
assert.equal(second.getState().recordFishCatch(), false, "Achievement must never be granted twice");
assert.equal(second.getState().fishCaught, 5);
const persisted = JSON.parse(values.get("luis-pixel-portfolio"));
assert.equal(persisted.state.fishCaught, 5);
assert.equal(persisted.state.fishingAchievement, true);

// Old local storage did not have fishing fields. Its other preferences survive.
values.set("luis-pixel-portfolio", JSON.stringify({ state: {
  character: "feminine", soundEnabled: false, volume: 0.2, discovered: ["projects"],
}, version: 0 }));
const migrated = loadStore();
assert.equal(migrated.getState().fishCaught, 0);
assert.equal(migrated.getState().fishingAchievement, false);
assert.equal(migrated.getState().soundEnabled, false);
assert.deepEqual(migrated.getState().discovered, ["projects"]);
console.log("Fishing achievement passed: third-catch unlock once, count increases, survives menu/reload, older preferences retain defaults.");
