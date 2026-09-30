import assert from "node:assert/strict";
import { loadTypeScript } from "./check-exterior.mjs";

const { getWorldLighting, WORLD_DAY_DURATION_MS } = loadTypeScript("components/portfolio/game/world-time.ts");
const { EXTERIOR_OBJECTS, EXTERIOR_TILES, WORLD_INTERACTIONS } = loadTypeScript("components/portfolio/game/exterior-map.ts");
const { canOccupyWorld } = loadTypeScript("components/portfolio/game/world-walkability.ts");
const { getFootBounds, footHitsBox } = loadTypeScript("components/portfolio/game/collision-geometry.ts");
const { getCloudPosition, PROJECTS_GOLD } = loadTypeScript("components/portfolio/game/exterior-decor.ts");
const { createExteriorAtmosphere } = loadTypeScript("components/portfolio/game/exterior-atmosphere.ts");

assert.equal(WORLD_DAY_DURATION_MS, 240_000);
for (const [fraction, period, lamps] of [[0.2, "day", 0], [0.52, "dusk"], [0.7, "night", 1], [0.9, "dawn"]]) {
  const light = getWorldLighting(fraction * WORLD_DAY_DURATION_MS);
  assert.equal(light.period, period);
  if (lamps !== undefined) assert.equal(light.lamps, lamps);
  assert.deepEqual(getWorldLighting(fraction * 1000, 1000), light);
}
for (let time = 0; time < WORLD_DAY_DURATION_MS * 2; time += 73) {
  const current = getWorldLighting(time);
  const next = getWorldLighting(time + 73);
  assert(Math.abs(current.darkness - next.darkness) < 0.003);
  assert(Math.abs(current.lamps - next.lamps) < 0.008);
  assert(current.darkness >= 0 && current.darkness <= 0.52);
  assert(current.lamps >= 0 && current.lamps <= 1);
}
assert.deepEqual(getWorldLighting(12_345), getWorldLighting(12_345 + WORLD_DAY_DURATION_MS));
const chest = EXTERIOR_OBJECTS.find((object) => object.id === "projects");
assert.equal(chest.width, 96); assert.equal(chest.height, 96);
assert.deepEqual(chest.collision, { x: 640, y: 140, width: 80, height: 40 });
const interaction = WORLD_INTERACTIONS.find((item) => item.objectId === "projects");
assert.equal(interaction.panel, "projects"); assert.equal(interaction.sound, "chest-open");
// The entire 96px approach remains traversable, from stair landing to chest.
for (let y = 148; y <= 280; y += 4) for (let x = 600; x <= 660; x += 4) {
  assert(canOccupyWorld({ x, y }), `Chest approach blocked at ${x},${y}`);
}
assert(PROJECTS_GOLD.every((piece) => piece.x + piece.width <= 600 || piece.x >= 680 || piece.y + piece.height < 140), "Coins leave the approach visually clear");
const posts = EXTERIOR_OBJECTS.filter((object) => object.id.startsWith("path-lantern-"));
assert.equal(posts.length, 5);
for (const post of posts) {
  assert.equal(post.collision.width, 16); assert.equal(post.collision.height, 16);
  for (const dx of [-8, 7]) for (const dy of [-16, -1]) assert.equal(EXTERIOR_TILES[Math.floor((post.y + dy) / 32)][Math.floor((post.x + dx) / 32)], "grass");
  const footAtBase = { x: post.x, y: post.y - 8 - 29.4 };
  assert(footHitsBox(getFootBounds(footAtBase, 80), post.collision));
  assert(!canOccupyWorld(footAtBase));
  assert([-32, 32].some((dx) => canOccupyWorld({ x: post.x + dx, y: footAtBase.y })),
    `At least one side of the post must stay free: ${post.id}`);
}
assert(getCloudPosition(0, 0).active); assert(!getCloudPosition(90_000, 0).active);
assert(getCloudPosition(20_000, 0).x > getCloudPosition(10_000, 0).x);

// Exercise real effect lifecycle and world-space layer ordering with adapters.
const nodes = [];
let shutdown;
function node() {
  const value = { depth: 0, alpha: 1, destroyed: false,
    setName(name) { this.name = name; return this; }, setDepth(depth) { this.depth = depth; return this; },
    setPosition(x, y) { this.x = x; this.y = y; return this; }, setVisible(visible) { this.visible = visible; return this; },
    setAlpha(alpha) { this.alpha = alpha; return this; }, fillStyle() { return this; }, fillRect() { return this; }, clear() { return this; },
    destroy() { this.destroyed = true; },
  }; nodes.push(value); return value;
}
const view = createExteriorAtmosphere({ add: { graphics: node, rectangle: node }, events: { once(_, fn) { shutdown = fn; }, off() {} } });
view.update(168_000);
assert(nodes.every((item) => item.depth < 5000));
assert.equal(nodes.find((item) => item.name === "night-light").alpha, 0.52);
assert(nodes.filter((item) => item.name.endsWith("-glow")).every((item) => item.alpha > 0.9));
view.update(24_000);
assert(nodes.filter((item) => item.name.endsWith("-glow")).every((item) => item.alpha === 0));
shutdown(); assert(nodes.every((item) => item.destroyed)); view.update(168_000); view.destroy();
console.log("World life passed: 4-minute continuous lighting, gradual lamp transitions, 5 grass-only post bases, 96px Projects chest with clear approach, clouds and effect cleanup.");
