import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { loadTypeScript } from "./check-exterior.mjs";

const { EXTERIOR_OBJECTS, WORLD_INTERACTIONS, EXTERIOR_TILES, EXTERIOR_SPAWN, TILE_SIZE } = loadTypeScript("components/portfolio/game/exterior-map.ts");
const { canOccupyWorld } = loadTypeScript("components/portfolio/game/world-walkability.ts");
const { getFootBounds, moveAlongWalkablePath } = loadTypeScript("components/portfolio/game/collision-geometry.ts");
const { WORLD_PLAYER_SIZE } = loadTypeScript("components/portfolio/game/world-config.ts");
const { WORLD_ACTIVITIES, FishingController, FISHING_SPOT, FISHING_CAST_DURATION, FISHING_BITE_AT, FISHING_REEL_AT, FISHING_CATCH_AT, FISHING_READY_AT, getFishingAnimation } = loadTypeScript("components/portfolio/game/world-activities.ts");
const { createFishingView } = loadTypeScript("components/portfolio/game/fishing-renderer.ts");

assert.equal(WORLD_ACTIVITIES.length, 3);
assert.deepEqual(WORLD_ACTIVITIES.map((activity) => activity.activity), ["fish", "flowers", "stones"]);
assert.equal(WORLD_ACTIVITIES[0].prompt, "Pressione E para pescar");
for (const activity of WORLD_ACTIVITIES) {
  assert(EXTERIOR_OBJECTS.some((object) => object.id === activity.objectId), "Activities must reuse existing scenery");
  assert(activity.prompt.includes("Pressione E"));
}

// Match actual nearest-interaction selection with all old and new candidates.
const interactions = [...WORLD_INTERACTIONS, ...WORLD_ACTIVITIES];
const key = ({ x, y }) => `${x},${y}`;
const queue = [{ ...EXTERIOR_SPAWN }];
const visited = new Set([key(queue[0])]);
for (let cursor = 0; cursor < queue.length; cursor += 1) {
  const current = queue[cursor];
  for (const [dx, dy] of [[8, 0], [-8, 0], [0, 8], [0, -8]]) {
    const next = { x: current.x + dx, y: current.y + dy };
    if (visited.has(key(next)) || !canOccupyWorld(next)) continue;
    if (![0.25, 0.5, 0.75].every((fraction) => canOccupyWorld({ x: current.x + dx * fraction, y: current.y + dy * fraction }))) continue;
    visited.add(key(next));
    queue.push(next);
  }
}
const counts = new Map(interactions.map((interaction) => [interaction, 0]));
for (const position of queue) {
  let nearest;
  let bestDistance = Infinity;
  for (const interaction of interactions) {
    const distance = Math.hypot(position.x - interaction.x, position.y - interaction.y);
    if (distance < interaction.radius && distance < bestDistance) {
      nearest = interaction;
      bestDistance = distance;
    }
  }
  if (nearest) counts.set(nearest, counts.get(nearest) + 1);
}
for (const [interaction, count] of counts) {
  assert(count >= 3, `Old/new interaction lost comfortable access: ${interaction.label} (${count})`);
}
assert(canOccupyWorld(FISHING_SPOT.position));
const closest = queue.reduce((best, position) => Math.hypot(position.x - FISHING_SPOT.position.x, position.y - FISHING_SPOT.position.y) < Math.hypot(best.x - FISHING_SPOT.position.x, best.y - FISHING_SPOT.position.y) ? position : best);
assert(Math.hypot(closest.x - FISHING_SPOT.position.x, closest.y - FISHING_SPOT.position.y) <= 8);
assert.deepEqual(moveAlongWalkablePath(closest, FISHING_SPOT.position, canOccupyWorld), FISHING_SPOT.position);
const dock = EXTERIOR_OBJECTS.find((object) => object.id === "dock").walkable;
const feet = getFootBounds(FISHING_SPOT.position, WORLD_PLAYER_SIZE);
assert(feet.left >= dock.x && feet.right <= dock.x + dock.width && feet.top >= dock.y && feet.bottom <= dock.y + dock.height, "Entire feet must fit on dock");
assert.equal(EXTERIOR_TILES[Math.floor(FISHING_SPOT.bobber.y / TILE_SIZE)][Math.floor(FISHING_SPOT.bobber.x / TILE_SIZE)], "water");

for (const character of ["masculine", "feminine"]) {
  const controller = new FishingController();
  assert.equal(controller.leave(), undefined, `${character}: leave while idle`);
  assert.equal(controller.begin(EXTERIOR_SPAWN), FISHING_SPOT);
  assert.equal(controller.begin(EXTERIOR_SPAWN), undefined, `${character}: prevent duplicate entry`);
  let caught = 0;
  // Three full attempts with held-E/retry attempts during each phase. The scene
  // persists these events; the controller must never emit twice for one fish.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    for (const [time, phase] of [[0, "cast"], [899, "cast"], [900, "waiting"], [3999, "waiting"], [4000, "bite"], [4350, "reel"], [5199, "reel"]]) {
      assert.deepEqual(controller.tick(time), { phase, caught: false });
      assert.equal(controller.retry(), false, `${character}: E cannot skip ${phase}`);
    }
    assert.deepEqual(controller.tick(FISHING_CATCH_AT), { phase: "caught", caught: true });
    caught += 1;
    for (let frame = 0; frame < 20; frame += 1) assert.equal(controller.tick(FISHING_CATCH_AT + frame).caught, false);
    assert.equal(controller.retry(), false, "Fish remains visible until ready");
    assert.deepEqual(controller.tick(FISHING_READY_AT), { phase: "ready", caught: false });
    if (attempt < 2) assert.equal(controller.retry(), true);
  }
  assert.equal(caught, 3, `${character}: exactly three landed fish`);
  const exit = controller.leave();
  assert(exit && canOccupyWorld(exit), `${character}: full footprint must fit after fishing`);
  assert.equal(controller.current, null);
  controller.begin(EXTERIOR_SPAWN);
  controller.reset();
  assert.equal(controller.current, null, `${character}: reset on transition`);
  for (const cancelAt of [0, 450, 2000, FISHING_BITE_AT, FISHING_REEL_AT, FISHING_CATCH_AT - 1]) {
    controller.begin(EXTERIOR_SPAWN);
    assert.equal(controller.tick(cancelAt).caught, false);
    const cancelledExit = controller.leave();
    assert(cancelledExit && canOccupyWorld(cancelledExit));
    assert.equal(controller.tick(9000).caught, false, `${character}: Esc prevents delayed catch at ${cancelAt}ms`);
  }
  controller.begin(EXTERIOR_SPAWN);
  assert.deepEqual(controller.tick(12000), { phase: "ready", caught: true }, "A slow frame still lands only one fish");
  assert.equal(controller.tick(12000).caught, false);
  controller.reset();
}
assert(getFishingAnimation(FISHING_SPOT, 450).bobber.y < FISHING_SPOT.bobber.y, "Cast follows a visible arc");
assert.deepEqual(getFishingAnimation(FISHING_SPOT, FISHING_CAST_DURATION).bobber, FISHING_SPOT.bobber);
assert.equal(getFishingAnimation(FISHING_SPOT, 450).settled, false);
assert.equal(getFishingAnimation(FISHING_SPOT, 1000).settled, true);
assert.equal(getFishingAnimation(FISHING_SPOT, 1000).splash, true);
assert.equal(getFishingAnimation(FISHING_SPOT, 1300).splash, false);
assert.equal(getFishingAnimation(FISHING_SPOT, FISHING_CAST_DURATION + 450).bobber.y, FISHING_SPOT.bobber.y + 2);
assert.equal(getFishingAnimation(FISHING_SPOT, FISHING_CAST_DURATION + 1350).bobber.y, FISHING_SPOT.bobber.y - 2);
assert.equal(getFishingAnimation(FISHING_SPOT, 4100).phase, "bite");
assert(getFishingAnimation(FISHING_SPOT, 4100).bobber.y > FISHING_SPOT.bobber.y, "The bite submerges the float");
assert.equal(getFishingAnimation(FISHING_SPOT, 4700).fish.visible, true);
assert(getFishingAnimation(FISHING_SPOT, 4700).fish.y < FISHING_SPOT.bobber.y, "Reeling lifts fish above the water");
assert.equal(getFishingAnimation(FISHING_SPOT, FISHING_CATCH_AT).characterPose, "reel");
assert.equal(getFishingAnimation(FISHING_SPOT, FISHING_CATCH_AT).fish.visible, true);
assert.equal(getFishingAnimation(FISHING_SPOT, FISHING_READY_AT).fish.visible, false);

// Invoke the real renderer with a recording Graphics adapter. This checks pixel
// coordinates and cleanup, not GPU rendering or camera/audio behavior.
const graphics = [];
const events = new EventEmitter();
const scene = {
  events,
  add: {
    graphics() {
      const item = {
        rectangles: [], destroyed: 0,
        setDepth(value) { this.depth = value; return this; },
        setName(value) { this.name = value; return this; },
        colors: new Set(),
        fillStyle(color) { this.colors.add(color); return this; },
        fillRect(...rectangle) { this.rectangles.push(rectangle); return this; },
        clear() { this.rectangles = []; return this; },
        destroy() { this.destroyed += 1; },
      };
      graphics.push(item);
      return item;
    },
  },
};
const view = createFishingView(scene, FISHING_SPOT);
for (const time of [0, 150, 450, 900, 1000, 1800, 3600]) {
  view.update(time);
  for (const item of graphics) for (const rectangle of item.rectangles) {
    assert(rectangle.every((value) => Number.isFinite(value) && value % 2 === 0), "All effects align to 2px world pixels");
  }
}
assert(graphics[0].rectangles.length > 20, "Water surface must have animated ripple details");
assert(graphics[1].rectangles.length > 70, "Rod, line, reel and float must be rendered");
for (const time of [4000, 4100, 4350, 4700, 5000, 5200, 5700, 6499, 6500]) {
  view.update(time);
  for (const item of graphics) for (const rectangle of item.rectangles) {
    assert(rectangle.every((value) => Number.isFinite(value) && value % 2 === 0), "Reel, fish and sparks stay on the world pixel grid");
  }
}
assert(graphics[1].colors.has(0x389e9a), "Detailed teal fish sprite appears during reel and catch");
assert(graphics[1].colors.has(0xd88c3d), "Fish has contrasting amber tail");
assert.equal(graphics[0].depth, 4, "Ripples stay below player and dock");
assert(graphics[1].depth > FISHING_SPOT.position.y + WORLD_PLAYER_SIZE * 0.43, "Tackle/fish remain above player's hands");
events.emit("shutdown");
view.destroy();
view.update(5000);
assert(graphics.every((item) => item.destroyed === 1), "Cleanup must be idempotent");
assert.equal(events.listenerCount("shutdown"), 0);

console.log(`World activities passed: ${queue.length} full-footprint positions; all ${interactions.length} interactions reachable; 3 catches and 6 cancellations per character; phase/retry/slow-frame checks, dock footprint, pixel fish and renderer cleanup.`);
console.log(WORLD_ACTIVITIES.map((activity) => `${activity.id}: ${counts.get(activity)} reachable nearest-interaction positions`).join("; "));
