import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadTypeScript } from "./check-exterior.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const {
  HOUSE_TILES, HOUSE_COLUMNS, HOUSE_ROWS, HOUSE_TILE_SIZE, HOUSE_PLAYER_SIZE,
  HOUSE_OBJECTS, HOUSE_INTERACTIONS, HOUSE_REST_SPOTS, HOUSE_MARKER, HOUSE_SPAWN,
} = loadTypeScript("components/portfolio/game/house-map.ts");
const { HOUSE_OBSERVATIONS } = loadTypeScript("components/portfolio/game/house-observations.ts");
const allInteractions = [...HOUSE_INTERACTIONS, ...HOUSE_OBSERVATIONS];
const { canOccupyHouse, chooseFreeHouseExit } = loadTypeScript("components/portfolio/game/house-walkability.ts");
const { PLAYER_FOOTPRINT, moveAlongWalkablePath } = loadTypeScript("components/portfolio/game/collision-geometry.ts");
const { InteractionPressGate, HouseRestController, getRestPoseFrame, getTutorialMarkerY } = loadTypeScript("components/portfolio/game/house-rest.ts");

assert.equal(HOUSE_PLAYER_SIZE, 96, "Checks must use the existing, full-size interior character");
assert.equal(HOUSE_TILES.length, HOUSE_ROWS);
assert(HOUSE_TILES.every((row) => row.length === HOUSE_COLUMNS));
assert.equal(HOUSE_COLUMNS * HOUSE_TILE_SIZE, 960, "Preserve the room framing");
assert.equal(HOUSE_ROWS * HOUSE_TILE_SIZE, 960, "Preserve the room proportions");
assert(canOccupyHouse(HOUSE_SPAWN), "Returning through the house door needs a free spawn");
assert(!canOccupyHouse({ x: NaN, y: HOUSE_SPAWN.y }));
assert(!canOccupyHouse({ x: HOUSE_SPAWN.x, y: Infinity }));

const width = HOUSE_COLUMNS * HOUSE_TILE_SIZE;
const height = HOUSE_ROWS * HOUSE_TILE_SIZE;
const step = 8;
const footOffset = HOUSE_PLAYER_SIZE * (PLAYER_FOOTPRINT.offsetY + PLAYER_FOOTPRINT.height / 2 - 0.5);
const halfFootWidth = HOUSE_PLAYER_SIZE * PLAYER_FOOTPRINT.width / 2;
const halfFootHeight = HOUSE_PLAYER_SIZE * PLAYER_FOOTPRINT.height / 2;
const centerAtFoot = (x, y) => ({ x, y: y - footOffset });
const key = ({ x, y }) => `${x},${y}`;
const visited = new Map([[key(HOUSE_SPAWN), { ...HOUSE_SPAWN, parent: null }]]);
const queue = [visited.get(key(HOUSE_SPAWN))];

// Flood with the actual foot rectangle and validate intermediate positions so
// furniture corners cannot be crossed between the 8 px exploration samples.
for (let cursor = 0; cursor < queue.length; cursor += 1) {
  const current = queue[cursor];
  for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
    const next = { x: current.x + dx, y: current.y + dy };
    if (visited.has(key(next)) || next.x < 0 || next.x > width || next.y < 0 || next.y > height) continue;
    if (![0.25, 0.5, 0.75, 1].every((fraction) => canOccupyHouse({ x: current.x + dx * fraction, y: current.y + dy * fraction }))) continue;
    const node = { ...next, parent: key(current) };
    visited.set(key(next), node);
    queue.push(node);
  }
}
assert(queue.length > 4000, `Unexpectedly little open floor is reachable: ${queue.length}`);

const nearestInteraction = (position) => {
  let nearest = null;
  let best = Infinity;
  for (const interaction of allInteractions) {
    const distance = Math.hypot(position.x - interaction.x, position.y - interaction.y);
    if (distance < interaction.radius && distance < best) {
      nearest = interaction;
      best = distance;
    }
  }
  return nearest;
};
const pathTo = (node) => {
  const route = [];
  while (node) {
    route.push({ x: node.x, y: node.y });
    node = node.parent === null ? null : visited.get(node.parent);
  }
  return route.reverse();
};
const routes = [];
assert.equal(HOUSE_INTERACTIONS.length, 7, "Preserve the original seven house actions");
assert(!HOUSE_OBJECTS.some((object) => object.id.startsWith("lamp")), "No lamps should be added to this room");
for (const interaction of allInteractions) {
  assert(HOUSE_OBJECTS.some((object) => object.id === interaction.objectId), `Missing interaction sprite: ${interaction.id}`);
  const approaches = queue.filter((node) => nearestInteraction(node) === interaction);
  assert(approaches.length >= 3, `No comfortable reachable prompt for ${interaction.id}`);
  approaches.sort((a, b) => Math.hypot(a.x - interaction.x, a.y - interaction.y) - Math.hypot(b.x - interaction.x, b.y - interaction.y));
  routes.push({ id: interaction.id, approaches: approaches.length, route: pathTo(approaches[0]) });
}

for (const [id, field, value, sound] of [
  ["tutorial", "panel", "intro", "chest-open"],
  ["tv", "panel", "tv", "tv-turn-on"],
  ["exit", "destination", "world", "door-open"],
  ["fireplace", "action", "toggle-fire", undefined],
]) {
  const interaction = HOUSE_INTERACTIONS.find((item) => item.id === id);
  assert.equal(interaction?.[field], value, `${id} must preserve its content/action`);
  assert.equal(interaction?.sound, sound, `${id} must retain its sound mapping`);
}

// Independent overlap math checks every reached foot against every solid
// object, plus the actual tile cells touched by its corners and edges.
const solids = HOUSE_OBJECTS.filter((object) => object.collision);
for (const object of solids) {
  assert(!canOccupyHouse(centerAtFoot(object.collision.x, object.collision.y)), `Furniture is walkable: ${object.id}`);
}
for (const position of queue) {
  const footY = position.y + footOffset;
  for (const { id, collision: box } of solids) {
    assert(!(Math.abs(position.x - box.x) < halfFootWidth + box.width / 2 &&
      Math.abs(footY - box.y) < halfFootHeight + box.height / 2), `Reachable feet clip ${id}`);
  }
  for (let row = Math.floor((footY - halfFootHeight) / HOUSE_TILE_SIZE); row <= Math.floor((footY + halfFootHeight - 0.001) / HOUSE_TILE_SIZE); row += 1) {
    for (let col = Math.floor((position.x - halfFootWidth) / HOUSE_TILE_SIZE); col <= Math.floor((position.x + halfFootWidth - 0.001) / HOUSE_TILE_SIZE); col += 1) {
      const tile = HOUSE_TILES[row]?.[col];
      assert((tile >= 0 && tile <= 3) || tile === 11, `Reachable feet cross a wall at ${col},${row}`);
    }
  }
}

let barriers = 0;
for (let y = 240; y < 850 && barriers < 24; y += 32) {
  let before = null;
  let inBarrier = false;
  for (let x = 80; x < 890; x += 8) {
    const position = centerAtFoot(x, y);
    if (!canOccupyHouse(position)) {
      if (before) inBarrier = true;
      continue;
    }
    if (before && inBarrier) {
      const result = moveAlongWalkablePath(before, position, canOccupyHouse);
      assert(canOccupyHouse(result), "Large movement must stop on free floor");
      assert(result.x < position.x - 4, `A slow frame tunnels through furniture at y=${y}`);
      barriers += 1;
    }
    before = position;
    inBarrier = false;
  }
}
assert(barriers >= 8, "Exercise several furniture barriers under large movement");

const doorway = HOUSE_INTERACTIONS.find((interaction) => interaction.id === "exit");
const doorApproach = { x: doorway.x, y: doorway.y };
assert(canOccupyHouse(doorApproach), "The complete footprint must fit inside the door opening");
assert.deepEqual(moveAlongWalkablePath(HOUSE_SPAWN, doorApproach, canOccupyHouse), doorApproach,
  "The threshold must connect directly to the existing house spawn");
const pastDoor = moveAlongWalkablePath(doorApproach, { x: doorway.x, y: height + 96 }, canOccupyHouse);
assert(canOccupyHouse(pastDoor) && pastDoor.y < height, "Walking through the threshold cannot escape the scene without its transition");

// Verify repeat/held events and simultaneous keyboard/touch inputs cannot
// enter and immediately leave a pose. A release plus a fresh press is required.
const gate = new InteractionPressGate();
assert(gate.press("KeyE", false, 0));
assert(!gate.press("Space", false, 100), "Other keys share the same cooldown");
assert(!gate.tap(120), "Touch and keyboard share the same cooldown");
assert(!gate.press("KeyE", true, 190));
assert(!gate.press("KeyE", false, 400), "Held key must not repeat even without a repeat flag");
gate.release("KeyE");
assert(gate.press("KeyE", false, 600));
gate.release("Space");
assert(gate.press("Space", false, 800));
assert(!gate.tap(900));
assert(gate.tap(1000));
gate.reset();
assert(gate.press("KeyE", false, 0), "Restart must clear held keys and timing");

const requiredPoseFrames = new Set();
let restCycles = 0;
for (const character of ["masculine", "feminine"]) {
  for (const spot of HOUSE_REST_SPOTS) {
    const frame = getRestPoseFrame(character, spot.kind);
    requiredPoseFrames.add(frame);
    assert(HOUSE_INTERACTIONS.some((interaction) => interaction.restId === spot.id), `Missing rest interaction ${spot.id}`);
    const validCandidates = spot.exitCandidates.filter(canOccupyHouse);
    assert(validCandidates.length >= 2, `Need alternate free stand-up positions for ${spot.id}`);
    for (const exit of validCandidates) {
      assert(queue.some((node) => Math.hypot(node.x - exit.x, node.y - exit.y) <= step), `Stand-up position disconnected from door: ${spot.id}`);
    }
    const controller = new HouseRestController();
    const approach = routes.find((route) => route.id === spot.id).route.at(-1);
    assert.equal(controller.enter(spot.id, approach)?.id, spot.id);
    assert.equal(controller.current?.id, spot.id, "Pose must remain active until explicit exit");
    assert.equal(controller.enter(spot.id, approach), undefined, "A resting actor cannot enter another rest pose");
    const exit = controller.leave();
    assert(exit && canOccupyHouse(exit), `Rest must end on free floor for ${spot.id}`);
    assert.equal(controller.current, null);
    assert.equal(controller.leave(), undefined, "A repeated leave is inert");
    assert.deepEqual(exit, chooseFreeHouseExit(spot.id, approach));
    controller.enter(spot.id, approach);
    controller.reset();
    assert.equal(controller.current, null, "Transition must clear the pose");
    restCycles += 1;
  }
}
assert.equal(restCycles, 6);

const chest = HOUSE_OBJECTS.find((object) => object.id === "tutorial");
assert.equal(HOUSE_MARKER.x, chest.x, "Tutorial marker is centered on its own sprite");
assert(HOUSE_MARKER.y < chest.y - chest.height, "Marker stays above the chest");
let lastMarker = getTutorialMarkerY(0);
for (let ms = 0; ms <= 7200; ms += 16) {
  const y = getTutorialMarkerY(ms);
  assert(y >= HOUSE_MARKER.y - 5.001 && y <= HOUSE_MARKER.y + 5.001);
  assert(Math.abs(y - getTutorialMarkerY(ms + 1800)) < 0.00001, "Marker repeats continuously");
  assert(Math.abs(y - lastMarker) < 0.3, "Marker moves smoothly at 60 fps");
  lastMarker = y;
}

const poses = JSON.parse(readFileSync(path.join(projectRoot, "public/game/interior/poses.json"), "utf8"));
for (const frame of requiredPoseFrames) {
  assert(poses.frames?.[frame], `Missing visible pose atlas frame: ${frame}`);
}

mkdirSync(path.join(projectRoot, "work"), { recursive: true });
writeFileSync(path.join(projectRoot, "work/house-routes.json"), JSON.stringify({ step, reachableSamples: queue.length, routes }, null, 2));
console.log(`House checks passed: ${queue.length} reachable full-footprint samples; ${allInteractions.length} interactions; ${solids.length} solid furniture pieces; ${barriers} long-movement barriers; ${restCycles} rest cycles for both characters.`);
console.log("Input repeat protection and tutorial marker curve passed. Routes: work/house-routes.json");
console.log("Phaser rendering, physics disabling during rest, camera, audio and browser transitions still need live-game verification.");
