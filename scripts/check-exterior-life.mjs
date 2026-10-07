import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { loadTypeScript } from "./check-exterior.mjs";

const { AMBIENT_FISH_POINTS, AMBIENT_FISH_INTERVAL_MS, fishEnvelope, getAmbientFishJump, getFoliageOffset, isOpenWater } = loadTypeScript("components/portfolio/game/exterior-life.ts");
const { EXTERIOR_OBJECTS, EXTERIOR_SPAWN } = loadTypeScript("components/portfolio/game/exterior-map.ts");
const { createExteriorLife } = loadTypeScript("components/portfolio/game/exterior-life-renderer.ts");
const { FishingController, FISHING_CATCH_AT } = loadTypeScript("components/portfolio/game/world-activities.ts");
assert.equal(AMBIENT_FISH_INTERVAL_MS, 2000);
assert(AMBIENT_FISH_POINTS.length >= 2, "Lake has varied safe jump positions");
for (const point of AMBIENT_FISH_POINTS) assert(isOpenWater(fishEnvelope(point)));
assert.equal(getAmbientFishJump(1999, 42), undefined);
const colors = new Set(), directions = new Set(), points = new Set();
for (let slot = 1; slot <= 300; slot++) {
  const start = getAmbientFishJump(slot * 2000, 42);
  const apex = getAmbientFishJump(slot * 2000 + 340, 42);
  const landing = getAmbientFishJump(slot * 2000 + 680, 42);
  assert(start.airborne && apex.airborne && !landing.airborne);
  assert(apex.fish.y < start.fish.y - 20);
  assert.equal(getAmbientFishJump(slot * 2000 + 1280, 42), undefined);
  assert.equal(getAmbientFishJump(slot * 2000 + 1999, 42), undefined);
  colors.add(start.variant); directions.add(start.direction); points.add(JSON.stringify(start.center));
  if (slot > 1) assert.notDeepEqual(start.center, getAmbientFishJump((slot - 1) * 2000, 42).center);
}
assert.equal(colors.size, 3); assert.equal(directions.size, 2);
assert.equal(points.size, AMBIENT_FISH_POINTS.length);
assert.notDeepEqual(getAmbientFishJump(2340, 42), getAmbientFishJump(2340, 99));

const objects = EXTERIOR_OBJECTS.filter(({ kind }) => ["pine", "oak", "pink", "grass", "flowers", "bush"].includes(kind));
for (const object of objects) {
  const near = { x: object.x + Math.min(28, object.width / 3), y: object.y - 12 };
  const far = { x: object.x + 200, y: object.y + 200 };
  let reacted = false;
  for (let ms = 0; ms < 2000; ms += 50) {
    const offset = getFoliageOffset(object, near, ms);
    assert([-2, 0, 2].includes(offset)); reacted ||= offset !== 0;
    assert.equal(getFoliageOffset(object, far, ms), 0);
  }
  assert(reacted, `Proximity reaction for ${object.id}`);
}
const nodes = [];
function graphics() {
  const node = { visible: true, rectangles: [], clears: 0, destroyed: false,
    setDepth(depth) { this.depth = depth; return this; }, setName(name) { this.name = name; return this; },
    setVisible(visible) { this.visible = visible; return this; },
    fillStyle(color, alpha) { this.color = color; this.alpha = alpha; return this; },
    fillRect(x, y, width, height) { if (this.alpha > 0) this.rectangles.push({ x, y, width, height }); return this; },
    clear() { this.rectangles = []; this.clears++; return this; },
    destroy() { this.destroyed = true; },
  };
  nodes.push(node); return node;
}
const events = new EventEmitter();
const tree = objects.find(({ kind }) => kind === "oak");
const crown = { x: tree.x, setX(x) { this.x = x; return this; }, setVisible(visible) { this.visible = visible; return this; } };
const life = createExteriorLife({ add: { graphics }, events }, [{ object: tree, crown }]);
const fullView = { x: 0, y: 0, width: 1280, height: 1280 };
const feet = { x: tree.x + 28, y: tree.y - 12 };
const controller = new FishingController();
controller.begin(EXTERIOR_SPAWN);
// Validate every drawn pixel against actual tiles and full sprite footprints,
// covering rounding, mirrored tails, spray and expanding ripples for many jumps.
for (let ms = 2000; ms < 42000; ms += 50) {
  life.update(ms, feet, false, fullView);
  for (const rect of nodes[0].rectangles) assert(isOpenWater(rect), `Fish pixel hits shore/object at ${ms}: ${JSON.stringify(rect)}`);
  assert.equal(controller.tick(0).caught, false, "Ambient jumps cannot advance a fishing attempt");
}
assert.equal(controller.tick(FISHING_CATCH_AT).caught, true);
assert.equal(controller.tick(FISHING_CATCH_AT).caught, false);
assert(controller.leave(), "Can leave fishing after many ambient jumps");
life.update(42340, feet, false, fullView);
const clears = nodes[0].clears;
life.update(42341, feet, false, fullView);
assert.equal(nodes[0].clears, clears, "Frame budget: reuse graphics within the same 50ms");
life.update(42341, feet, true, fullView);
assert.equal(nodes[0].visible, false); assert.equal(crown.x, tree.x);
life.update(44340, feet, false, { x: 0, y: 0, width: 32, height: 32 });
assert.equal(nodes[0].visible, false); assert.equal(crown.x, tree.x);
const offscreenClears = nodes[0].clears;
life.update(46340, feet, false, { x: 0, y: 0, width: 32, height: 32 });
assert.equal(nodes[0].clears, offscreenClears, "No redraw when lake stays off camera");
events.emit("shutdown");
assert(nodes.every(({ destroyed }) => destroyed));
assert.equal(events.listenerCount("shutdown"), 0);
life.destroy(); life.update(48340, feet, false, fullView);
console.log(`Environmental checks passed: ${AMBIENT_FISH_POINTS.length} safe positions, 2-second schedule, entire pixel arcs/splashes, independent fishing, proximity, culling, reduced motion and cleanup.`);

const { readFileSync } = await import("node:fs");
const atlas = JSON.parse(readFileSync("public/game/exterior/objects.json", "utf8"));
const { buildExterior } = loadTypeScript("components/portfolio/game/exterior-renderer.ts");
const before = JSON.stringify(EXTERIOR_OBJECTS);
const listeners = new Set();
const preference = { matches: false, addEventListener(_, fn) { listeners.add(fn); }, removeEventListener(_, fn) { listeners.delete(fn); } };
globalThis.window = { matchMedia(query) { assert.equal(query, "(prefers-reduced-motion: reduce)"); return preference; } };
const rendered = [];
const cachedTextures = new Set();
let generatedCount = 0;
function imageNode(x = 0, y = 0, texture, frameName) {
  const frame = atlas.frames[frameName]?.frame;
  const node = { x, y, texture, name: "", depth: 0, alpha: 1, destroyed: false,
    frame: { width: frame?.w ?? 320, height: frame?.h ?? 320 },
    setName(name) { this.name = name; return this; }, setDepth(depth) { this.depth = depth; return this; },
    setOrigin() { return this; }, setDisplaySize(width, height) { this.width = width; this.height = height; return this; },
    setX(x) { this.x = x; return this; }, setPosition(x, y) { this.x = x; this.y = y; return this; },
    setCrop(x, y, width, height) { this.crop = { x, y, width, height }; return this; },
    setVisible(visible) { this.visible = visible; return this; }, setAlpha(alpha) { this.alpha = alpha; return this; },
    setScale() { return this; }, fillStyle() { return this; }, fillRect() { return this; }, clear() { return this; },
    generateTexture(key) { cachedTextures.add(key); generatedCount++; return this; },
    destroy() { this.destroyed = true; },
  };
  rendered.push(node); return node;
}
const sceneEvents = new EventEmitter();
const scene = {
  textures: { exists(key) { return cachedTextures.has(key); } },
  cameras: { main: { worldView: fullView } }, events: sceneEvents,
  add: { image: imageNode, graphics: imageNode, rectangle: imageNode },
  make: { tilemap() { return { addTilesetImage() { return {}; }, createLayer() { return imageNode(); } }; } },
};
const exterior = buildExterior(scene);
for (const object of EXTERIOR_OBJECTS) {
  const base = rendered.find(({ name }) => name === object.id);
  assert.equal(base.x, object.x); assert.equal(base.y, object.y);
  assert.equal(base.depth, object.depth ?? object.y);
  const leaf = rendered.find(({ name }) => name === `${object.id}-foliage`);
  if (leaf) {
    assert.equal(leaf.depth, base.depth, "Foliage must preserve front/back depth");
    assert.equal(base.crop.y, leaf.crop.height);
    assert.equal(base.crop.height + leaf.crop.height, base.frame.height, "Split covers exact original art");
  }
}
exterior.update(168340, feet);
for (const fn of listeners) fn({ matches: true });
exterior.update(168341, feet);
assert(rendered.filter(({ name }) => name.endsWith("-foliage")).every((node) =>
  node.x === EXTERIOR_OBJECTS.find(({ id }) => node.name === `${id}-foliage`).x));
assert(rendered.filter(({ name }) => name.startsWith("pixel-cloud-")).every(({ visible }) => !visible));
assert(rendered.filter(({ name }) => name.endsWith("-glow")).every(({ alpha }) => alpha === 1));
assert.equal(rendered.find(({ name }) => name === "ambient-lake-life").visible, false);
sceneEvents.emit("shutdown");
assert.equal(listeners.size, 0); assert.equal(sceneEvents.listenerCount("shutdown"), 0);
assert(rendered.filter(({ name }) => name === "ambient-lake-life" || name.endsWith("-glow")).every(({ destroyed }) => destroyed));
exterior.update(170340, feet); exterior.destroy();
buildExterior(scene).destroy();
assert.equal(generatedCount, 1, "Scene restarts reuse the glow texture");
assert.equal(JSON.stringify(EXTERIOR_OBJECTS), before, "No model positions, collision or walkable geometry changed");
delete globalThis.window;
console.log("Exterior integration passed: original anchors/depths, exact sprite splits, live motion preference, cached lights, scene restart and listener cleanup.");
