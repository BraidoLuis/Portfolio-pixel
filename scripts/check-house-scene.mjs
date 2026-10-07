import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EventEmitter } from "node:events";
import vm from "node:vm";
import ts from "typescript";
import { loadTypeScript } from "./check-exterior.mjs";

// Execute the actual scene methods, extracted by the TS parser. Lightweight
// Phaser adapters observe body/image/input effects without claiming GPU testing.
const source = ts.createSourceFile("phaser-game.tsx", readFileSync(new URL("../components/portfolio/game/phaser-game.tsx", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let sceneClass;
function findScene(node) {
  if (ts.isClassDeclaration(node) && node.name?.text === "PortfolioScene") sceneClass = node;
  ts.forEachChild(node, findScene);
}
findScene(source);
assert(sceneClass, "The production PortfolioScene must be tested");
const compiled = ts.transpileModule(sceneClass.getText(source), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const house = loadTypeScript("components/portfolio/game/house-map.ts");
const rest = loadTypeScript("components/portfolio/game/house-rest.ts");
const walk = loadTypeScript("components/portfolio/game/house-walkability.ts");
const geometry = loadTypeScript("components/portfolio/game/collision-geometry.ts");
const world = loadTypeScript("components/portfolio/game/world-config.ts");
const exterior = loadTypeScript("components/portfolio/game/world-walkability.ts");
const exteriorMap = loadTypeScript("components/portfolio/game/exterior-map.ts");
const zoom = loadTypeScript("components/portfolio/game/game-zoom.ts");
const activities = loadTypeScript("components/portfolio/game/world-activities.ts");
const movement = loadTypeScript("components/portfolio/game/character-motion.ts");

function image(x = 0, y = 0, texture = "walking", frame = 0) {
  return {
    x, y, texture, frame, active: true, visible: true, depth: 0, velocity: { x: 0, y: 0 },
    setDisplaySize(width, height) { this.width = width; this.height = height; return this; },
    setDepth(value) { this.depth = value; return this; },
    setFlipX(value) { this.flipX = value; return this; },
    setVisible(value) { this.visible = value; return this; },
    setFrame(value) { this.frame = value; return this; },
    setTexture(texture, frame) { this.texture = texture; this.frame = frame; return this; },
    setText(value) { this.text = value; return this; },
    setOrigin() { return this; },
    setScale(value) { this.scaleX = value; this.scaleY = value; return this; },
    setWordWrapWidth(value) { this.wrapWidth = value; return this; },
    setCollideWorldBounds(value) { this.collideWorldBounds = value; return this; },
    setPosition(px, py) { this.x = px; this.y = py; return this; },
    setVelocity(vx, vy = vx) { this.velocity = { x: vx, y: vy }; return this; },
    destroy() { this.active = false; },
  };
}

function playerSprite(x, y, texture) {
  const sprite = image(x, y, texture).setDisplaySize(96, 96);
  sprite.anims = {
    stop() { this.isPlaying = false; },
    play(key) { this.currentAnim = { key }; this.isPlaying = true; },
    isPlaying: false,
  };
  sprite.body = {
    enable: true,
    reset(px, py) { sprite.setPosition(px, py).setVelocity(0); },
    setSize(width, height) { this.width = width; this.height = height; },
    setOffset(x, y) { this.offset = { x, y }; },
  };
  return sprite;
}

function cameraAdapter() {
  const camera = new EventEmitter();
  Object.assign(camera, {
    scrollX: 0, scrollY: 0, zoom: 1,
    fadeOut() {}, fadeIn() {},
    setBackgroundColor(value) { this.background = value; },
    removeBounds() { this.bounds = undefined; },
    setBounds(x, y, width, height) { this.bounds = { x, y, width, height }; },
    startFollow(target) { this.following = target; },
    stopFollow() { this.following = undefined; },
    setScroll(x, y) { this.scrollX = x; this.scrollY = y; },
    centerOn(x, y) { this.center = { x, y }; },
    pan(x, y) { this.centerOn(x, y); },
    setZoom(value) { this.zoom = value; },
    zoomTo(value) { this.zoom = value; },
  });
  return camera;
}

function makeScene(character) {
  const dispatched = [];
  const sounds = [];
  const fishingProgress = { count: 0, unlocked: false };
  const audioSubscribers = new Set();
  let storeState = { soundEnabled: true, volume: 0.35, recordFishCatch: () => {
    fishingProgress.count++;
    const newlyUnlocked = fishingProgress.count >= 3 && !fishingProgress.unlocked;
    fishingProgress.unlocked ||= newlyUnlocked;
    return newlyUnlocked;
  } };
  const portfolioStore = {
    getState: () => storeState,
    subscribe(fn) { audioSubscribers.add(fn); return () => audioSubscribers.delete(fn); },
  };
  const setAudioPreferences = (soundEnabled, volume) => {
    const previous = storeState;
    storeState = { ...storeState, soundEnabled, volume };
    audioSubscribers.forEach((fn) => fn(storeState, previous));
  };
  const SceneClass = vm.runInNewContext(`${compiled}\nPortfolioScene;`, {
    ...house, ...rest, ...walk, ...geometry, ...world, ...exterior, ...exteriorMap, ...zoom, ...activities, ...movement,
    usePortfolioStore: portfolioStore,
    PLAYER_SIZE: { house: 96, world: 80 }, character,
    buildHouse: () => ({ bedCover: image().setVisible(false) }),
    buildExterior: () => ({ update(elapsed) { this.elapsed = elapsed; }, destroy() {} }),
    createFishingView: (_scene, spot) => ({
      spot, active: true, elapsed: [],
      update(value) { this.elapsed.push(value); },
      destroy() { this.active = false; },
    }),
    Phaser: { Scene: class {}, Math: {
      Distance: { Between: (x, y, a, b) => Math.hypot(x - a, y - b) },
      Clamp: (value, min, max) => Math.min(max, Math.max(min, value)),
      Vector2: class {
        constructor(x, y) { this.x = x; this.y = y; }
        lengthSq() { return this.x ** 2 + this.y ** 2; }
        normalize() { const length = Math.hypot(this.x, this.y); this.x /= length; this.y /= length; return this; }
        scale(value) { this.x *= value; this.y *= value; return this; }
      },
    },
      Scale: { Events: { RESIZE: "resize" } },
      Scenes: { Events: { POST_UPDATE: "post-update", SHUTDOWN: "shutdown" } },
      Cameras: { Scene2D: { Events: { FADE_OUT_COMPLETE: "fade-out-complete" } } } },
    window: { dispatchEvent: (event) => dispatched.push(event), addEventListener() {}, removeEventListener() {} },
    CustomEvent: class { constructor(type, data) { this.type = type; this.detail = data.detail; } },
    Event: class { constructor(type) { this.type = type; } },
    performance,
  });
  const scene = new SceneClass();
  scene.init({ area: "house" });
  scene.time = { now: 1000, delayedCall: () => {} };
  scene.player = playerSprite(house.HOUSE_SPAWN.x, house.HOUSE_SPAWN.y);
  scene.prompt = image();
  scene.add = { image, text: (x, y, text) => image(x, y).setText(text) };
  scene.physics = { world: { setBounds() {} }, add: { sprite: playerSprite } };
  scene.scale = Object.assign(new EventEmitter(), { width: 960, height: 600 });
  scene.events = new EventEmitter();
  scene.cursors = Object.fromEntries(["left", "right", "up", "down"].map((key) => [key, { isDown: false }]));
  scene.keys = Object.fromEntries(["A", "D", "W", "S"].map((key) => [key, { isDown: false }]));
  scene.addHouseLightingEffects = () => {};
  scene.houseView = { bedCover: image().setVisible(false) };
  scene.fireGlow = image();
  scene.fireSprite = image();
  scene.cache = { audio: { exists: () => true } };
  scene.sound = {
    setMute(value) { this.mute = value; }, setVolume(value) { this.volume = value; },
    add: (key) => ({ play: () => sounds.push(key), destroy() {}, stop() {} }),
    play: (key) => sounds.push(key),
  };
  scene.cameras = { main: cameraAdapter() };
  const destinations = [];
  scene.scene = { restart: (data) => destinations.push(data.area) };
  scene.interactions = house.HOUSE_INTERACTIONS.map((interaction) => ({ ...interaction }));
  scene.lastWalkablePosition = { ...house.HOUSE_SPAWN };
  return { scene, dispatched, sounds, destinations, fishingProgress, audioSubscribers, setAudioPreferences };
}

const wakeMessage = "Um novo dia começa neste mundo. Pressione E para levantar.";
let startupCycles = 0;
for (const character of ["masculine", "feminine"]) {
  const { scene, dispatched } = makeScene(character);
  scene.init({});
  scene.buildArea();
  assert.equal(scene.area, "house");
  assert.equal(scene.wakingUp, true);
  assert.equal(scene.rest.current.id, "bed", "A fresh game must actually start in the bed pose");
  assert.equal(scene.restSprite.frame, rest.getRestPoseFrame(character, "lie"));
  assert.equal(scene.prompt.text, wakeMessage);
  assert.equal(scene.player.visible, false);
  assert.equal(scene.player.body.enable, false);
  const eventCount = dispatched.length;
  scene.onKeyboardInteract({ code: "KeyE", repeat: false });
  assert.equal(scene.rest.current, null, "The first E must stand up");
  assert.equal(scene.wakingUp, false);
  assert(!scene.prompt.visible || scene.prompt.text !== wakeMessage, "The introduction must disappear after standing");
  assert(walk.canOccupyHouse(scene.player));
  assert.equal(dispatched.length, eventCount, "Standing must not also open an adjacent panel");
  scene.time.now += 500;
  scene.onKeyboardInteract({ code: "KeyE", repeat: false });
  assert.equal(scene.rest.current, null, "Holding the startup E must not lie back down");
  scene.init({ area: "world" });
  scene.buildArea();
  scene.init({ area: "house" });
  scene.buildArea();
  assert.equal(scene.wakingUp, false);
  assert.equal(scene.rest.current, null, "Returning through the door must stay awake");
  assert.equal(scene.player.visible, true);
  assert.equal(scene.player.body.enable, true);
  assert.equal(scene.prompt.visible, false);
  assert.equal(scene.player.x, house.HOUSE_SPAWN.x);
  assert.equal(scene.player.y, house.HOUSE_SPAWN.y);
  scene.init();
  scene.buildArea();
  assert.equal(scene.rest.current.id, "bed", "Another new game must show the introduction again");
  startupCycles += 1;
}

let zoomChecks = 0;
for (const [width, height] of [[960, 600], [390, 844], [1920, 1080]]) {
  const { scene, dispatched } = makeScene("masculine");
  scene.scale = { width, height };
  scene.configureCamera();
  assert.equal(scene.cameras.main.background, "#000000", "Camera letterboxing must remain black");
  assert.equal(scene.cameras.main.zoom, Math.min(width / 960, height / 960));
  assert.equal(scene.cameras.main.bounds, undefined);
  scene.onZoomRequest({ detail: { direction: "in" } });
  scene.onZoomRequest({ detail: { direction: "in" } });
  assert.equal(scene.zoomSteps.house, 2);
  const houseZoom = scene.cameras.main.zoom;
  for (let transition = 0; transition < 2; transition += 1) {
    scene.init({ area: "world" });
    scene.configureCamera();
    assert.equal(scene.zoomSteps.world, zoom.ZOOM_LIMITS.min, "Every exit resets only outdoor zoom");
    let state = dispatched.at(-1);
    assert.equal(state.type, "portfolio:zoom-state");
    assert.equal(state.detail.area, "world");
    assert.equal(state.detail.step, zoom.ZOOM_LIMITS.min);
    assert.equal(state.detail.min, zoom.ZOOM_LIMITS.min);
    assert.equal(state.detail.max, zoom.ZOOM_LIMITS.max);
    const baseZoom = Math.max(width < 720 ? 1 : 2, Math.ceil(width / world.SCENE_SIZE.world.width), Math.ceil(height / world.SCENE_SIZE.world.height));
    assert.equal(scene.cameras.main.zoom, baseZoom * 0.8);
    for (let i = 0; i < 8; i += 1) scene.onZoomRequest({ detail: { direction: "in" } });
    assert.equal(scene.zoomSteps.world, zoom.ZOOM_LIMITS.max);
    assert.equal(dispatched.at(-1).detail.step, zoom.ZOOM_LIMITS.max);
    for (let i = 0; i < 8; i += 1) scene.onZoomRequest({ detail: { direction: "out" } });
    assert.equal(scene.zoomSteps.world, zoom.ZOOM_LIMITS.min);
    assert.equal(dispatched.at(-1).detail.step, zoom.ZOOM_LIMITS.min);
    scene.onZoomRequest({ detail: { direction: "in" } });
    scene.onZoomStateRequest();
    assert.equal(dispatched.at(-1).detail.step, 0, "A mounted HUD can request the current zoom snapshot");
    scene.init({ area: "house" });
    scene.configureCamera();
    assert.equal(scene.zoomSteps.house, 2, "Indoor zoom is independent of outdoor resets");
    assert.equal(scene.cameras.main.zoom, houseZoom);
    assert.equal(dispatched.at(-1).detail.area, "house");
    zoomChecks += 1;
  }
}

function approachActivity(scene, activity) {
  const candidates = [];
  for (let x = activity.x - activity.radius + 4; x < activity.x + activity.radius; x += 4) {
    for (let y = activity.y - activity.radius + 4; y < activity.y + activity.radius; y += 4) {
      if (exterior.canOccupyWorld({ x, y })) candidates.push({ x, y });
    }
  }
  candidates.sort((a, b) => Math.hypot(a.x - activity.x, a.y - activity.y) - Math.hypot(b.x - activity.x, b.y - activity.y));
  for (const position of candidates) {
    scene.player.setPosition(position.x, position.y);
    scene.updateInteraction();
    if (scene.nearest?.id === activity.id) {
      scene.lastWalkablePosition = { ...position };
      return position;
    }
  }
  assert.fail(`No valid standing point can select the actual ${activity.id} interaction`);
}

let fishingCycles = 0;
let observationCycles = 0;
for (const character of ["masculine", "feminine"]) {
  for (const stopKey of ["Escape"]) {
    const { scene, dispatched } = makeScene(character);
    scene.init({ area: "world" });
    scene.buildArea();
    const activity = activities.WORLD_ACTIVITIES.find((item) => item.activity === "fish");
    approachActivity(scene, activity);
    assert.equal(scene.prompt.text, "Pressione E para pescar");
    scene.onKeyboardInteract({ code: "KeyE", repeat: false });
    assert.equal(scene.fishing.current, activities.FISHING_SPOT);
    assert.equal(scene.player.x, activities.FISHING_SPOT.position.x);
    assert.equal(scene.player.y, activities.FISHING_SPOT.position.y);
    assert.equal(scene.player.body.enable, false);
    assert.equal(scene.player.visible, true);
    assert.equal(scene.facing, "up");
    assert.equal(scene.player.frame, `${character}-cast-0`, "Fishing starts with a real casting pose");
    assert.equal(scene.player.texture, movement.CHARACTER_MOTION_TEXTURE);
    const view = scene.fishingView;
    assert(view?.active);
    const eventCount = dispatched.length;
    scene.time.now += 500;
    scene.keys.D.isDown = true;
    scene.player.setVelocity(190, 0);
    scene.update();
    scene.validatePlayerPosition();
    assert.equal(scene.player.velocity.x, 0);
    assert.equal(scene.player.velocity.y, 0);
    assert.equal(scene.player.x, activities.FISHING_SPOT.position.x);
    assert.equal(view.elapsed.at(-1), 500, "The scene must advance casting/bobbing using elapsed scene time");
    scene.onKeyboardInteract({ code: "KeyE", repeat: true });
    scene.onKeyboardInteract({ code: "KeyE", repeat: false });
    assert(scene.fishing.current, "Held E must not cancel the fishing it just started");
    scene.onKeyboardRelease({ code: "KeyE" });
    scene.pausedByPanel = true;
    scene.onEscape({ code: "Escape", repeat: false });
    assert(scene.fishing.current, "A paused panel must retain its keyboard ownership");
    scene.pausedByPanel = false;
    if (stopKey === "Escape") scene.onEscape({ code: stopKey, repeat: false });
    else scene.onKeyboardInteract({ code: stopKey, repeat: false });
    assert.equal(scene.fishing.current, null);
    assert.equal(scene.fishingView, undefined);
    assert.equal(view.active, false, "Fishing visuals must be disposed on leaving");
    assert.equal(scene.player.body.enable, true);
    assert(exterior.canOccupyWorld(scene.player), "Fishing must restore the entire footprint on free ground");
    assert.equal(scene.lastWalkablePosition.x, scene.player.x);
    assert.equal(scene.lastWalkablePosition.y, scene.player.y);
    assert.equal(scene.facing, "down");
    assert(!dispatched.slice(eventCount).some((event) => event.type === "portfolio:open-panel"), "Ending fishing must not activate a nearby panel");
    scene.update();
    assert.equal(scene.player.velocity.x, 190, "Normal movement must resume after fishing");
    fishingCycles += 1;
  }
  for (const activity of activities.WORLD_ACTIVITIES.filter((item) => item.response)) {
    const { scene, dispatched } = makeScene(character);
    scene.init({ area: "world" });
    scene.buildArea();
    const position = approachActivity(scene, activity);
    assert.equal(scene.prompt.text, activity.prompt);
    const eventCount = dispatched.length;
    scene.onKeyboardInteract({ code: "KeyE", repeat: false });
    assert.equal(scene.prompt.text, activity.response);
    assert.equal(scene.observation.text, activity.response);
    assert.equal(scene.player.x, position.x);
    assert.equal(scene.player.y, position.y);
    assert.equal(scene.player.body.enable, true);
    assert.equal(scene.rest.current, null);
    assert.equal(scene.fishing.current, null);
    assert.equal(dispatched.length, eventCount, "Small scenery responses must not open portfolio panels");
    scene.keys.D.isDown = true;
    scene.update();
    assert.equal(scene.player.velocity.x, 190, "Scenery observations must not block movement");
    scene.time.now += 3601;
    scene.updateInteraction();
    assert.equal(scene.observation, undefined);
    assert.equal(scene.prompt.text, activity.prompt, "Short observations return to the normal interaction prompt");
    observationCycles += 1;
  }
}

let completedCatches = 0;
for (const character of ["masculine", "feminine"]) {
  const { scene, dispatched, fishingProgress } = makeScene(character);
  scene.init({ area: "world" });
  scene.buildArea();
  const activity = activities.WORLD_ACTIVITIES.find((item) => item.activity === "fish");
  approachActivity(scene, activity);
  scene.onKeyboardInteract({ code: "KeyE", repeat: false });
  for (let attempt = 0; attempt < 4; attempt++) {
    const started = scene.time.now;
    // Exercise the full production update sequence, not only the pure controller.
    for (const [elapsed, phase] of [[450, "cast"], [1200, "waiting"], [4000, "bite"], [4700, "reel"], [5200, "caught"], [6500, "ready"]]) {
      scene.time.now = started + elapsed;
      scene.update();
      assert.equal(scene.fishing.phase, phase);
      assert.equal(scene.player.body.enable, false);
      assert.equal(scene.player.velocity.x, 0);
      if (elapsed < 5200) assert.equal(fishingProgress.count, attempt);
      else assert.equal(fishingProgress.count, attempt + 1);
    }
    // Multiple frames and a held/repeating E must never duplicate a catch/retry.
    scene.update();
    scene.onKeyboardInteract({ code: "KeyE", repeat: true });
    scene.onKeyboardInteract({ code: "KeyE", repeat: false });
    assert.equal(scene.fishing.phase, "ready");
    assert.equal(fishingProgress.count, attempt + 1);
    completedCatches++;
    if (attempt < 3) {
      scene.onKeyboardRelease({ code: "KeyE" });
      scene.time.now += 200;
      scene.onKeyboardInteract({ code: "KeyE", repeat: false });
      assert.equal(scene.fishing.phase, "cast");
    }
  }
  assert.equal(dispatched.filter((event) => event.type === "portfolio:fishing-achievement").length, 1);
  assert(fishingProgress.unlocked, "The third catch unlocks the achievement once");
  scene.time.now += 200;
  scene.onEscape({ code: "Escape", repeat: false });
  assert.equal(fishingProgress.count, 4);
  assert(exterior.canOccupyWorld(scene.player));
  scene.onKeyboardRelease({ code: "Escape" });
  scene.onKeyboardRelease({ code: "KeyE" });
  scene.time.now += 200;
  approachActivity(scene, activity);
  scene.onKeyboardInteract({ code: "KeyE", repeat: false });
  scene.time.now += 4300;
  scene.update();
  scene.onEscape({ code: "Escape", repeat: false });
  assert.equal(fishingProgress.count, 4, "Cancel during the bite must not count a fifth fish");
}

let diagonalChecks = 0;
for (const character of ["masculine", "feminine"]) for (const area of ["house", "world"]) {
  const { scene } = makeScene(character);
  scene.init({ area });
  scene.buildArea();
  for (const [keys, facing] of [[["A", "W"], "up-left"], [["D", "W"], "up-right"], [["A", "S"], "down-left"], [["D", "S"], "down-right"]]) {
    for (const key of Object.values(scene.keys)) key.isDown = false;
    for (const key of keys) scene.keys[key].isDown = true;
    scene.update();
    assert.equal(scene.facing, facing);
    assert.equal(scene.player.anims.currentAnim.key, `walk-${character}-${facing}`);
    assert(Math.abs(Math.hypot(scene.player.velocity.x, scene.player.velocity.y) - 190) < 1e-8);
    for (const key of keys) scene.keys[key].isDown = false;
    scene.update();
    assert.equal(scene.player.texture, movement.CHARACTER_MOTION_TEXTURE);
    assert.equal(scene.player.frame, `${character}-${facing}-0`);
    // Cardinal frames must be restored correctly after a diagonal stop.
    scene.facing = "down";
    scene.stopWalking();
    assert.equal(scene.player.texture, `character-${character}-walksheet`);
    assert.equal(scene.player.frame, 0);
    diagonalChecks++;
  }
  const origin = scene.worldTimeStartedAt;
  scene.worldTimeStartedAt -= 45000;
  const elapsedBefore = scene.worldElapsedMs();
  scene.init({ area: "house" });
  scene.buildArea();
  scene.init({ area: "world" });
  scene.buildArea();
  assert.equal(scene.worldTimeStartedAt, origin - 45000, "Door transitions must retain the clock origin");
  assert(scene.exteriorView.elapsed >= elapsedBefore, "Time continues in the house and resumes outside");
}

let cycles = 0;
for (const character of ["masculine", "feminine"]) {
  for (const spot of house.HOUSE_REST_SPOTS) {
    const { scene } = makeScene(character);
    scene.nearest = scene.interactions.find((item) => item.restId === spot.id);
    scene.onKeyboardInteract({ code: "KeyE", repeat: false });
    assert.equal(scene.rest.current.id, spot.id, "One key press enters the requested pose");
    assert.equal(scene.player.body.enable, false, "Physics must be suspended in furniture");
    assert.equal(scene.player.visible, false, "The walking sprite must not overlap the pose");
    assert.equal(scene.restSprite.frame, rest.getRestPoseFrame(character, spot.kind));
    assert.equal(scene.restSprite.flipX, spot.facing === "left");
    assert.equal(scene.restSprite.depth, spot.depth);
    assert.equal(scene.houseView.bedCover.visible, spot.kind === "lie");
    const pose = scene.restSprite;
    scene.player.setVelocity(190, 190);
    scene.update();
    scene.validatePlayerPosition();
    assert.equal(scene.player.velocity.x, 0);
    assert.equal(scene.player.velocity.y, 0);
    assert.equal(scene.player.x, spot.x, "POST_UPDATE must not eject a seated/lying player");
    assert.equal(scene.player.y, spot.y);
    assert.equal(scene.restSprite, pose);
    scene.time.now += 500;
    scene.onKeyboardInteract({ code: "KeyE", repeat: true });
    scene.onKeyboardInteract({ code: "KeyE", repeat: false });
    assert.equal(scene.rest.current.id, spot.id, "Held/repeated E must not immediately stand up");
    scene.onKeyboardRelease({ code: "KeyE" });
    scene.onKeyboardInteract({ code: "KeyE", repeat: false });
    assert.equal(scene.rest.current, null);
    assert.equal(scene.player.body.enable, true);
    assert.equal(scene.player.visible, true);
    assert.equal(pose.active, false);
    assert.equal(scene.houseView.bedCover.visible, false);
    assert(walk.canOccupyHouse(scene.player), "The actual scene must restore a free standing position");
    assert.equal(scene.lastWalkablePosition.x, scene.player.x);
    assert.equal(scene.lastWalkablePosition.y, scene.player.y);
    scene.validatePlayerPosition();
    assert(walk.canOccupyHouse(scene.player));
    cycles += 1;
  }
  const { scene, dispatched, sounds, destinations } = makeScene(character);
  for (const [id, panel, sound] of [["tutorial", "intro", "chest-open"], ["tv", "tv", "tv-turn-on"]]) {
    scene.nearest = scene.interactions.find((item) => item.id === id);
    scene.interact();
    assert.equal(dispatched.at(-1).detail.panel, panel);
    assert.equal(sounds.at(-1), sound);
  }
  scene.nearest = scene.interactions.find((item) => item.id === "fireplace");
  scene.player.setPosition(768, 360);
  scene.interact();
  assert.equal(scene.fireSprite.visible, false);
  assert.equal(sounds.at(-1), "fire-extinguish");
  scene.interact();
  assert.equal(scene.fireSprite.visible, true);
  assert.equal(sounds.at(-1), "fire-ignite");
  scene.nearest = scene.interactions.find((item) => item.id === "exit");
  scene.interact();
  assert.equal(scene.pausedByPanel, true);
  assert.equal(sounds.at(-1), "door-open");
  scene.cameras.main.emit("fade-out-complete");
  assert.equal(destinations.at(-1), "world");
  scene.init({ area: "world" });
  scene.transitionTo("house");
  scene.cameras.main.emit("fade-out-complete");
  assert.equal(destinations.at(-1), "house");
  scene.init({ area: "house" });
  assert.equal(scene.rest.current, null);
  assert.equal(scene.restSprite, undefined);
}
console.log(`Production scene methods passed: ${startupCycles} wake-up flows, ${zoomChecks} zoom round trips, ${cycles} poses, ${fishingCycles} fishing cancellations, ${completedCatches} captures, ${diagonalChecks} diagonals, ${observationCycles} observations; one achievement, held-E protection, continuous world time, panels, fire and both doors. GPU/camera/audio playback require the browser.`);

for (const character of ["masculine", "feminine"]) {
  const { scene, audioSubscribers, setAudioPreferences } = makeScene(character);
  scene.createCharacterAnimations = () => {};
  scene.buildArea = () => {};
  const keyboard = Object.assign(new EventEmitter(), {
    createCursorKeys: () => scene.cursors,
    addKeys: () => scene.keys,
  });
  scene.input = { keyboard };
  scene.create();
  assert.equal(scene.sound.mute, false); assert.equal(scene.sound.volume, 0.35);
  assert.equal(audioSubscribers.size, 1);
  setAudioPreferences(false, 0.6);
  assert.equal(scene.sound.mute, true); assert.equal(scene.sound.volume, 0.6);
  setAudioPreferences(true, 0);
  assert.equal(scene.sound.mute, false); assert.equal(scene.sound.volume, 0);
  scene.events.emit("shutdown");
  assert.equal(audioSubscribers.size, 0, "Scene shutdown removes audio subscription");
  setAudioPreferences(false, 0.8);
  assert.equal(scene.sound.mute, false); assert.equal(scene.sound.volume, 0, "Destroyed scene receives no audio changes");
}
console.log("Scene audio passed: initial preferences, live mute/volume changes, silent volume and subscription cleanup for both characters.");

for (const [width, height] of [[320, 568], [390, 844], [1334, 595], [1920, 1080]]) {
  const { scene } = makeScene("masculine");
  scene.scale = { width, height };
  const prompt = image();
  Object.defineProperties(prompt, {
    displayWidth: { get: () => (prompt.wrapWidth + 24) * (prompt.scaleX ?? 1) },
    displayHeight: { get: () => 96 * (prompt.scaleY ?? 1) },
  });
  scene.prompt = prompt;
  for (const zoomValue of [0.3, 0.8, 1.6, 2.8]) {
    const view = { x: 100, y: 200, width: width / zoomValue, height: height / zoomValue };
    view.right = view.x + view.width; view.bottom = view.y + view.height;
    scene.cameras.main.zoom = zoomValue; scene.cameras.main.worldView = view;
    for (const anchor of [{ x: view.x - 100, y: view.y - 100 }, { x: view.right + 100, y: view.bottom + 100 }]) {
      scene.showPrompt(anchor.x, anchor.y);
      assert(Math.abs(prompt.scaleX * zoomValue - 1) < 0.000001, "Prompt font retains its screen size");
      assert((prompt.x - prompt.displayWidth / 2 - view.x) * zoomValue >= 11.999);
      assert((view.right - prompt.x - prompt.displayWidth / 2) * zoomValue >= 11.999);
      assert((prompt.y - prompt.displayHeight - view.y) * zoomValue >= 11.999);
      assert((view.bottom - prompt.y) * zoomValue >= 11.999);
      assert.equal(scene.promptAnchor.x, anchor.x, "Clamping must not lose the original world anchor");
    }
  }
}
console.log("Prompt layout passed: readable screen size and viewport bounds at 4 viewport sizes and 4 camera zooms.");
