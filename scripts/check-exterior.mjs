import assert from "node:assert/strict";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nodeRequire = createRequire(import.meta.url);
const moduleCache = new Map();

// Load the actual game model without a browser, a second model, or emitted files.
// Also exported for the standalone visual preview of the same scene data.
export function loadTypeScript(relativePath) {
  const requested = path.resolve(projectRoot, relativePath);
  const filename = [requested, `${requested}.ts`, `${requested}.tsx`].find(existsSync);
  assert(filename, `Module does not exist: ${relativePath}`);
  if (moduleCache.has(filename)) return moduleCache.get(filename).exports;
  const loadedModule = { exports: {} };
  moduleCache.set(filename, loadedModule);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  }).outputText;
  const requireModule = (specifier) => specifier.startsWith(".")
    ? loadTypeScript(path.resolve(path.dirname(filename), specifier))
    : nodeRequire(specifier);
  const execute = vm.runInThisContext(
    `(function (exports, require, module, __filename, __dirname) {\n${source}\n})`,
    { filename },
  );
  execute(loadedModule.exports, requireModule, loadedModule, filename, path.dirname(filename));
  return loadedModule.exports;
}

function checkExterior() {
  const map = loadTypeScript("components/portfolio/game/exterior-map.ts");
  const { WORLD_PLAYER_SIZE, SCENE_SIZE, SPAWN_POINTS } = loadTypeScript("components/portfolio/game/world-config.ts");
  const { canOccupyWorld } = loadTypeScript("components/portfolio/game/world-walkability.ts");
  const { moveAlongWalkablePath, PLAYER_FOOTPRINT } = loadTypeScript("components/portfolio/game/collision-geometry.ts");
  const { EXTERIOR_TILES, EXTERIOR_OBJECTS, WORLD_INTERACTIONS: landmarks, TILE_SIZE } = map;
  const { WORLD_ACTIVITIES } = loadTypeScript("components/portfolio/game/world-activities.ts");
  // Match the live scene, including competition with the three new prompts.
  const WORLD_INTERACTIONS = [...landmarks, ...WORLD_ACTIVITIES];
  const spawn = map.EXTERIOR_SPAWN ?? SPAWN_POINTS.world;
  const { width, height } = SCENE_SIZE.world;
  const step = 8;
  const footOffsetY = WORLD_PLAYER_SIZE * (PLAYER_FOOTPRINT.offsetY + PLAYER_FOOTPRINT.height / 2 - 0.5);
  const halfFootWidth = WORLD_PLAYER_SIZE * PLAYER_FOOTPRINT.width / 2;
  const halfFootHeight = WORLD_PLAYER_SIZE * PLAYER_FOOTPRINT.height / 2;
  const centerAtFoot = (x, y) => ({ x, y: y - footOffsetY });
  const platforms = EXTERIOR_OBJECTS.flatMap((object) => object.walkable ? [object.walkable] : []);
  const feetOnPlatform = (position) => platforms.some((area) =>
    position.x - halfFootWidth >= area.x && position.x + halfFootWidth <= area.x + area.width &&
    position.y + footOffsetY - halfFootHeight >= area.y && position.y + footOffsetY + halfFootHeight <= area.y + area.height);
  const key = ({ x, y }) => `${x},${y}`;

  assert.equal(EXTERIOR_TILES.length * TILE_SIZE, height, "Tile rows must fill the scene height");
  assert(EXTERIOR_TILES.every((row) => row.length * TILE_SIZE === width), "Every tile row must fill the scene width");
  assert(canOccupyWorld(spawn), "The player must fit at the exterior spawn");
  assert.equal(WORLD_PLAYER_SIZE, 80, "Traversal checks use the existing full-size exterior character");

  // Flood the real footprint, with intermediate collision checks on every edge.
  // A point-only flood would incorrectly accept narrow gaps beside trunks/chests.
  const visited = new Map([[key(spawn), { ...spawn, parent: null }]]);
  const queue = [visited.get(key(spawn))];
  const directions = [[step, 0], [-step, 0], [0, step], [0, -step]];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    for (const [dx, dy] of directions) {
      const next = { x: current.x + dx, y: current.y + dy };
      const nextKey = key(next);
      if (visited.has(nextKey) || next.x < 0 || next.x > width || next.y < -WORLD_PLAYER_SIZE || next.y > height) continue;
      if (!canOccupyWorld(next)) continue;
      if (![0.25, 0.5, 0.75].every((fraction) => canOccupyWorld({ x: current.x + dx * fraction, y: current.y + dy * fraction }))) continue;
      const node = { ...next, parent: key(current) };
      visited.set(nextKey, node);
      queue.push(node);
    }
  }
  assert(queue.length > 1000, `The reachable world is unexpectedly small (${queue.length} samples)`);

  // Match Phaser's strict radius and closest-interaction selection. Being near
  // a chest is insufficient when a competing sign wins the interaction prompt.
  const nearestInteraction = (position) => {
    let nearest = null;
    let bestDistance = Infinity;
    for (const interaction of WORLD_INTERACTIONS) {
      const distance = Math.hypot(position.x - interaction.x, position.y - interaction.y);
      if (distance < interaction.radius && distance < bestDistance) {
        nearest = interaction;
        bestDistance = distance;
      }
    }
    return nearest;
  };
  const routes = [];
  const pathTo = (node) => {
    const result = [];
    while (node) {
      result.push({ x: node.x, y: node.y });
      node = node.parent === null ? null : visited.get(node.parent);
    }
    return result.reverse();
  };
  const chests = WORLD_INTERACTIONS.filter((interaction) => interaction.sound === "chest-open");
  assert.equal(chests.length, 8, "All eight chests must retain their interactions");
  const expectedGroups = { projects: 1, skills: 3, experiences: 3, certifications: 1 };
  for (const [panel, count] of Object.entries(expectedGroups)) {
    assert.equal(chests.filter((chest) => chest.panel === panel).length, count, `Chest count for ${panel}`);
  }
  assert(WORLD_INTERACTIONS.some((interaction) => interaction.destination === "house" && interaction.sound === "door-open"), "The house door must preserve its transition and sound");
  assert(WORLD_INTERACTIONS.some((interaction) => interaction.panel === "map"), "The map sign must remain interactive");
  for (const interaction of WORLD_INTERACTIONS) {
    const candidates = queue.filter((position) => nearestInteraction(position) === interaction);
    assert(candidates.length >= 3, `No comfortable reachable interaction area: ${interaction.label} (${interaction.x}, ${interaction.y})`);
    candidates.sort((a, b) => Math.hypot(a.x - interaction.x, a.y - interaction.y) - Math.hypot(b.x - interaction.x, b.y - interaction.y));
    routes.push({ label: interaction.label, panel: interaction.panel, objectId: interaction.objectId, samples: candidates.length, route: pathTo(candidates[0]) });
  }

  // These are independent layout acceptance points (feet coordinates), including
  // multiple lanes through the stairs instead of only a passable center pixel.
  const waypoints = [
    ["Northern stairs, west lane", 608, 256], ["Northern stairs, center", 640, 256], ["Northern stairs, east lane", 672, 256],
    ["Western stairs, west lane", 304, 600], ["Western stairs, center", 336, 600], ["Western stairs, east lane", 368, 600],
    ["Central passage", 640, 608], ["Behind the house", 640, 656],
    ["West side of house", 432, 848], ["East side of house", 848, 848],
    ["In front of house", 640, 1008], ["Pond dock", 1024, 944],
  ];
  for (const [label, x, footY] of waypoints) {
    const point = centerAtFoot(x, footY);
    assert(canOccupyWorld(point), `Required route is blocked: ${label}`);
    const closest = queue.reduce((best, node) => Math.hypot(node.x - point.x, node.y - point.y) < Math.hypot(best.x - point.x, best.y - point.y) ? node : best);
    assert(Math.hypot(closest.x - point.x, closest.y - point.y) <= step, `No continuous route from spawn: ${label}`);
    const finalMove = moveAlongWalkablePath(closest, point, canOccupyWorld);
    assert(Math.hypot(finalMove.x - point.x, finalMove.y - point.y) < 0.01, `Waypoint is separated from its nearby route: ${label}`);
    routes.push({ label, route: [...pathTo(closest), point] });
  }

  // The three parallel lanes prove that the house loop remains comfortable at
  // full character size, with long straight stretches that cannot hide detours.
  const loopSegments = [
    ["behind", 432, 656, 848, 656, "y"],
    ["west", 432, 656, 432, 1008, "x"],
    ["east", 848, 656, 848, 1008, "x"],
    ["front", 432, 1024, 848, 1024, "y"],
  ];
  for (const [label, x1, y1, x2, y2, offsetAxis] of loopSegments) {
    for (const offset of [-16, 0, 16]) {
      const start = centerAtFoot(x1 + (offsetAxis === "x" ? offset : 0), y1 + (offsetAxis === "y" ? offset : 0));
      const end = centerAtFoot(x2 + (offsetAxis === "x" ? offset : 0), y2 + (offsetAxis === "y" ? offset : 0));
      assert(canOccupyWorld(start), `House ${label} route start must fit (lane ${offset})`);
      const result = moveAlongWalkablePath(start, end, canOccupyWorld);
      assert(Math.hypot(result.x - end.x, result.y - end.y) < 0.01, `House ${label} route is obstructed (lane ${offset})`);
    }
  }

  // Every water/cliff cell must block feet even if its center is visually open.
  let solidTiles = 0;
  for (let row = 0; row < EXTERIOR_TILES.length; row += 1) {
    for (let column = 0; column < EXTERIOR_TILES[row].length; column += 1) {
      if (!["water", "cliff"].includes(EXTERIOR_TILES[row][column])) continue;
      const feet = centerAtFoot((column + 0.5) * TILE_SIZE, (row + 0.5) * TILE_SIZE);
      if (EXTERIOR_TILES[row][column] === "water" && feetOnPlatform(feet)) continue;
      assert(!canOccupyWorld(feet), `Solid ${EXTERIOR_TILES[row][column]} tile ${column},${row} is walkable`);
      solidTiles += 1;
    }
  }
  assert(solidTiles > 0, "The exterior must include tile-based water/cliff collisions");

  let solidObjects = 0;
  for (const object of EXTERIOR_OBJECTS) {
    if (!object.collision) continue;
    const box = object.collision;
    assert(!canOccupyWorld(centerAtFoot(box.x, box.y)), `Object footprint is walkable: ${object.id}`);
    solidObjects += 1;
  }
  assert(solidObjects >= 8, "The scene must include solid individual objects");

  // Check all reached positions independently against full rectangles, including
  // the edges of the feet; this catches corner leaks and center-only sampling.
  for (const position of queue) {
    const foot = {
      left: position.x - halfFootWidth, right: position.x + halfFootWidth,
      top: position.y + footOffsetY - halfFootHeight, bottom: position.y + footOffsetY + halfFootHeight,
    };
    for (let row = Math.floor(foot.top / TILE_SIZE); row <= Math.floor((foot.bottom - 0.00001) / TILE_SIZE); row += 1) {
      for (let column = Math.floor(foot.left / TILE_SIZE); column <= Math.floor((foot.right - 0.00001) / TILE_SIZE); column += 1) {
        const tile = EXTERIOR_TILES[row]?.[column];
        assert(tile !== "cliff" && (tile !== "water" || feetOnPlatform(position)), `Reachable feet overlap unsupported solid tile at ${column},${row}`);
      }
    }
    for (const object of EXTERIOR_OBJECTS) {
      const box = object.collision;
      if (!box) continue;
      const overlaps = Math.abs(position.x - box.x) < halfFootWidth + box.width / 2 &&
        Math.abs(position.y + footOffsetY - box.y) < halfFootHeight + box.height / 2;
      assert(!overlaps, `Reachable feet overlap ${object.id}`);
    }
  }

  // A stalled frame / large drag must not teleport over a blocked stretch.
  // Find traversable endpoints on opposite sides of actual scene obstacles.
  let longMovementChecks = 0;
  for (let y = 64; y < height - 64 && longMovementChecks < 24; y += 32) {
    let before = null;
    let gapStarted = false;
    for (let x = 32; x < width - 32; x += 8) {
      const position = centerAtFoot(x, y);
      if (!canOccupyWorld(position)) {
        if (before) gapStarted = true;
        continue;
      }
      if (before && gapStarted) {
        const stopped = moveAlongWalkablePath(before, position, canOccupyWorld);
        assert(canOccupyWorld(stopped), "Long movement must finish on valid ground");
        assert(stopped.x < position.x - 4, `Long movement tunneled through obstacle at y=${y}, x=${before.x}…${position.x}`);
        longMovementChecks += 1;
      }
      before = position;
      gapStarted = false;
    }
  }
  assert(longMovementChecks >= 8, "Exercise large movement across several real obstacles");

  mkdirSync(path.join(projectRoot, "work"), { recursive: true });
  writeFileSync(path.join(projectRoot, "work/exterior-routes.json"), JSON.stringify({ step, reachableSamples: queue.length, routes }, null, 2));
  console.log(`Exterior checks passed: ${queue.length} reachable footprint samples; ${WORLD_INTERACTIONS.length} interactions (${chests.length} chests); ${solidTiles} solid tiles; ${solidObjects} solid objects; ${longMovementChecks} long-movement barriers.`);
  console.log("Playable routes: work/exterior-routes.json");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) checkExterior();
