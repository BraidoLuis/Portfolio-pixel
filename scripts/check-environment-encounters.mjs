import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { loadTypeScript } from "./check-exterior.mjs";

const model = loadTypeScript("components/portfolio/game/environment-encounters.ts");
const { createEnvironmentEncounters } = loadTypeScript("components/portfolio/game/environment-encounters-renderer.ts");
const { createInteractionHighlight } = loadTypeScript("components/portfolio/game/interaction-highlight.ts");
const { isOpenWater } = loadTypeScript("components/portfolio/game/exterior-life.ts");
const { EXTERIOR_OBJECTS, EXTERIOR_TILES } = loadTypeScript("components/portfolio/game/exterior-map.ts");
const { HOUSE_OBJECTS } = loadTypeScript("components/portfolio/game/house-map.ts");
const before = JSON.stringify([EXTERIOR_OBJECTS, EXTERIOR_TILES, HOUSE_OBJECTS]);
const { ProximityEncounter, BUTTERFLY_HOMES, FROG_HOME, FROG_LANDING, getButterflyFlight, getFrogLeap } = model;
const fullView = { x: 0, y: 0, width: 1280, height: 1280 };
const offscreen = { x: 0, y: 0, width: 32, height: 32 };
const near = { x: BUTTERFLY_HOMES[0].x + 24, y: BUTTERFLY_HOMES[0].y };
const far = { x: 0, y: 0 };

const encounter = new ProximityEncounter(BUTTERFLY_HOMES[0], 62, 2800, 6500);
assert.equal(encounter.update(0, far), undefined);
assert.equal(encounter.update(100, near), 0);
assert.equal(encounter.update(1500, near), 1400);
assert.equal(encounter.update(2900, near), undefined);
assert.equal(encounter.update(10000, near), undefined, "Standing near flowers must not keep triggering flights");
encounter.update(10100, far);
assert.equal(encounter.update(10200, near), 0, "A new approach can trigger after the cooldown");
assert.equal(encounter.update(10250, near, false), undefined);
assert.equal(encounter.startedAt, undefined, "Reduced motion clears active encounters");
const cameraEncounter = new ProximityEncounter(BUTTERFLY_HOMES[0], 62, 2800, 6500);
assert.equal(cameraEncounter.update(0, near, true, false), undefined, "Off-camera proximity does not start an encounter");
assert.equal(cameraEncounter.update(100, near, true, true), 0);
assert.equal(cameraEncounter.update(10000, near, true, false), undefined);
assert.equal(cameraEncounter.update(10100, near, true, true), undefined, "Moving the camera away does not count as walking away");
for (const home of BUTTERFLY_HOMES) {
  assert.deepEqual(getButterflyFlight(home, 0, home.variant), { x: home.x, y: home.y });
  const returned = getButterflyFlight(home, 2800, home.variant);
  assert(Math.hypot(returned.x - home.x, returned.y - home.y) < 0.001);
}
assert(isOpenWater({ x: FROG_LANDING.x - 14, y: FROG_LANDING.y - 14, width: 28, height: 28 }));
assert.deepEqual(getFrogLeap(0), FROG_HOME);
const landing = getFrogLeap(520);
assert(Math.hypot(landing.x - FROG_LANDING.x, landing.y - FROG_LANDING.y) < 0.001);
assert(getFrogLeap(260).y < FROG_HOME.y - 15);
const stone = EXTERIOR_OBJECTS.find(({ id }) => id === "shore-15");
assert(Math.abs(FROG_HOME.x - stone.x) < stone.width / 2 && FROG_HOME.y >= stone.y - stone.height);

function makeScene() {
  const nodes = [];
  const graphics = () => {
    const node = { x: 0, y: 0, visible: true, rectangles: [], clears: 0, destroyed: false,
      setName(name) { this.name = name; return this; },
      setDepth(depth) { this.depth = depth; return this; },
      setVisible(value) { this.visible = value; return this; },
      fillStyle(color, alpha = 1) { this.color = color; this.alpha = alpha; return this; },
      fillRect(x, y, width, height) {
        if (this.alpha > 0) this.rectangles.push({ x, y, width, height, color: this.color, alpha: this.alpha });
        return this;
      },
      clear() { this.rectangles = []; this.clears++; return this; },
      destroy() { this.destroyed = true; },
    };
    nodes.push(node); return node;
  };
  const scene = { add: { graphics }, events: new EventEmitter(), cameras: { main: { worldView: fullView } } };
  return { scene, nodes, named: (name) => nodes.find((node) => node.name === name) };
}
const { scene, nodes, named } = makeScene();
let rustles = 0;
const view = createEnvironmentEncounters(scene, () => rustles++);
view.update(24000, far, false, fullView);
const butterfly = named("ambient-butterfly-0");
assert(butterfly.visible);
const perched = JSON.stringify(butterfly.rectangles);
const perchedClears = butterfly.clears;
view.update(24050, far, false, fullView);
assert.equal(butterfly.clears, perchedClears, "Perched creatures reuse their graphics");
view.update(24100, near, false, fullView);
view.update(24800, near, false, fullView);
assert.notEqual(JSON.stringify(butterfly.rectangles), perched);
view.update(27000, near, false, fullView);
assert.equal(JSON.stringify(butterfly.rectangles), perched, "Butterfly returns to the same flower");
view.update(34000, near, false, fullView);
assert.equal(JSON.stringify(butterfly.rectangles), perched, "Waiting nearby leaves it perched");

const frog = named("ambient-shore-frog");
const frogNear = { x: FROG_HOME.x - 32, y: FROG_HOME.y };
view.update(35000, frogNear, false, fullView);
view.update(35250, frogNear, false, fullView);
assert(frog.visible && frog.depth >= model.FROG_PERCH_DEPTH, "The frog must remain above its shore stone");
for (let now = 35550; now < 36220; now += 50) {
  view.update(now, frogNear, false, fullView);
  assert.equal(frog.depth, 1);
  for (const rectangle of frog.rectangles) assert(isOpenWater(rectangle), "Frog splash must stay in unobstructed water");
}
view.update(36300, frogNear, false, fullView);
assert.equal(frog.visible, false);
view.update(55000, frogNear, false, fullView);
assert.equal(frog.visible, false, "Frog waits for the player to move away before reappearing");
view.update(55050, far, false, fullView);
assert(frog.visible && frog.depth > 1);

const tree = model.LEAF_TREES.find(({ kind }) => kind === "oak");
for (let index = 0; index < 8; index++) {
  view.update(60000 + index * 50, { x: tree.x + 26 + index * 3, y: tree.y - 4 }, false, fullView);
}
assert.equal(rustles, 1, "Leaf sound has a cooldown, rather than firing each frame");
assert(named("ambient-foot-leaves").visible);
view.update(62000, undefined, false, fullView);
assert.equal(named("ambient-foot-leaves").visible, false);

view.update(168000, far, false, fullView);
assert(nodes.filter(({ name }) => name.startsWith("ambient-butterfly-")).every(({ visible }) => !visible));
let active = false, quiet = false;
for (let now = 168000; now < 177000; now += 100) {
  view.update(now, far, false, fullView);
  active ||= named("ambient-fireflies").visible;
  quiet ||= !named("ambient-fireflies").visible;
}
assert(active && quiet, "Fireflies have dark pauses between short evening pulses");
view.update(177100, near, true, fullView);
assert.equal(named("ambient-fireflies").visible, false);
assert.equal(named("ambient-foot-leaves").visible, false);
assert(frog.visible, "Reduced motion keeps the frog perched");
view.update(240000, near, true, fullView);
const still = JSON.stringify(butterfly.rectangles);
view.update(240500, near, true, fullView);
assert.equal(JSON.stringify(butterfly.rectangles), still, "Reduced-motion butterfly stays still");
view.update(241000, near, false, offscreen);
assert(nodes.every(({ visible }) => !visible));
const clears = nodes.map(({ clears }) => clears);
view.update(241500, near, false, offscreen);
assert.deepEqual(nodes.map(({ clears }) => clears), clears, "No redraws while all encounters are off camera");
scene.events.emit("shutdown");
assert(nodes.every(({ destroyed }) => destroyed));
assert.equal(scene.events.listenerCount("shutdown"), 0);
view.destroy(); view.update(242000, near, false, fullView);

for (const area of ["house", "world"]) {
  const adapter = makeScene();
  const highlight = createInteractionHighlight(adapter.scene, area);
  const graphic = adapter.nodes[0];
  highlight.update(area === "house" ? "tutorial" : "projects");
  assert(graphic.visible && graphic.rectangles.length === 8);
  const redraws = graphic.clears;
  highlight.update(area === "house" ? "tutorial" : "projects");
  assert.equal(graphic.clears, redraws, "An unchanged target does not redraw its highlight");
  adapter.scene.cameras.main.worldView = offscreen;
  highlight.update(area === "house" ? "tutorial" : "projects");
  assert(!graphic.visible);
  adapter.scene.cameras.main.worldView = fullView;
  highlight.update(area === "house" ? "table" : "sign-map");
  assert(graphic.visible);
  highlight.update();
  assert(!graphic.visible && !graphic.rectangles.length);
  if (area === "world") {
    highlight.update("house");
    assert(!graphic.visible, "No oversized frame around the exterior house");
  }
  adapter.scene.events.emit("shutdown");
  assert(graphic.destroyed);
  assert.equal(adapter.scene.events.listenerCount("shutdown"), 0);
  highlight.destroy();
}
assert.equal(JSON.stringify([EXTERIOR_OBJECTS, EXTERIOR_TILES, HOUSE_OBJECTS]), before);
console.log("Encounters passed: proximity/rearming, resting graphics reuse, frog leap and safe splash, leaf sound cooldown, day/night pauses, live reduced motion, camera culling, contextual highlights, geometry preservation and cleanup.");
