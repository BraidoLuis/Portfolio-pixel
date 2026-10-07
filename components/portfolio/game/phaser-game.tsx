"use client";

import { useEffect, useRef } from "react";
import type { Character, PanelType } from "@/components/portfolio/store/portfolio-store";
import { usePortfolioStore } from "@/components/portfolio/store/portfolio-store";
import {
  moveAlongWalkablePath,
  PLAYER_FOOTPRINT,
  type Position,
} from "@/components/portfolio/game/collision-geometry";
import {
  SCENE_SIZE,
  SPAWN_POINTS,
  WORLD_PLAYER_SIZE,
} from "@/components/portfolio/game/world-config";
import { canOccupyWorld } from "@/components/portfolio/game/world-walkability";
import { buildExterior, preloadExterior, type ExteriorView } from "./exterior-renderer";
import { WORLD_INTERACTIONS } from "./exterior-map";
import { buildHouse, preloadHouse, type HouseView } from "./house-renderer";
import { HOUSE_INTERACTIONS, HOUSE_LIGHTS, HOUSE_MARKER, HOUSE_PLAYER_SIZE, type HouseInteraction, type HouseRestId } from "./house-map";
import { canOccupyHouse } from "./house-walkability";
import { getRestPoseFrame, HouseRestController, InteractionPressGate } from "./house-rest";
import { ZOOM_LIMITS } from "./game-zoom";
import { FishingController, getFishingAnimation, WORLD_ACTIVITIES, type WorldActivity } from "./world-activities";
import { createFishingView, type FishingView } from "./fishing-renderer";
import { CHARACTER_MOTION_TEXTURE, createDiagonalAnimations, getDiagonalFrame, getFishingPoseFrame,
  getMovementFacing, isDiagonalDirection, preloadCharacterMotion, type CharacterFacing } from "./character-motion";

type PhaserGameProps = {
  character: Character;
};

type Facing = CharacterFacing;

const PLAYER_SIZE = { house: HOUSE_PLAYER_SIZE, world: WORLD_PLAYER_SIZE } as const;

type Interaction = {
  x: number;
  y: number;
  radius: number;
  label: string;
  panel?: Exclude<PanelType, null>;
  destination?: "house" | "world";
  action?: HouseInteraction["action"];
  restId?: HouseRestId;
  activity?: WorldActivity["activity"];
  prompt?: string;
  response?: string;
  sound?: "chest-open" | "door-open" | "map-open" | "tv-turn-on" | "ui-select";
};

export function PhaserGame({ character }: PhaserGameProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    let game: import("phaser").Game | null = null;
    let cancelled = false;

    async function mountGame() {
      const Phaser = (await import("phaser")).default;
      await Promise.all([
        document.fonts.load('16px "Stardew Valley"'),
        document.fonts.load('700 16px "Stardew Valley"'),
      ]);
      if (cancelled || !hostRef.current) return;

      class PortfolioScene extends Phaser.Scene {
        private area: "house" | "world" = "house";
        private player!: import("phaser").Physics.Arcade.Sprite;
        private facing: Facing = "down";
        private interactions: Interaction[] = [];
        private nearest: Interaction | null = null;
        private prompt!: import("phaser").GameObjects.Text;
        private promptAnchor?: Position;
        private promptWrapWidth = 0;
        private cursors!: import("phaser").Types.Input.Keyboard.CursorKeys;
        private keys!: Record<"W" | "A" | "S" | "D", import("phaser").Input.Keyboard.Key>;
        private mobileDirections = new Set<string>();
        private pausedByPanel = false;
        private transitioning = false;
        private lastWalkablePosition = { x: 0, y: 0 };
        private fireLit = true;
        private fireGlow?: import("phaser").GameObjects.Ellipse;
        private fireSprite?: import("phaser").GameObjects.Image;
        private fireTexture?: import("phaser").Textures.CanvasTexture;
        private houseView?: HouseView;
        private exteriorView?: ExteriorView;
        private unsubscribeAudio?: () => void;
        // A scene restart through either door must never reset the world clock.
        private worldTimeStartedAt = performance.now();
        private rest = new HouseRestController();
        private wakingUp = false;
        private fishing = new FishingController();
        private fishingView?: FishingView;
        private fishingStartedAt = 0;
        private observation?: { text: string; x: number; y: number; expires: number };
        private restSprite?: import("phaser").GameObjects.Image;
        private interactionGate = new InteractionPressGate();
        private lastFootstepAt = 0;
        private footstepVariation = 0;
        private zoomSteps = { house: 0, world: 0 };
        private houseFollowing = false;
        private onMobileDirection = (event: Event) => {
          const detail = (event as CustomEvent<{ direction: string; active: boolean }>).detail;
          if (detail.active) this.mobileDirections.add(detail.direction);
          else this.mobileDirections.delete(detail.direction);
        };
        private onMobileInteract = () => {
          if (this.interactionGate.tap(this.time.now)) this.interact();
        };
        private onKeyboardInteract = (event: KeyboardEvent) => {
          if (this.interactionGate.press(event.code, event.repeat, this.time.now)) this.interact();
        };
        private onKeyboardRelease = (event: KeyboardEvent) => this.interactionGate.release(event.code);
        private onEscape = (event: KeyboardEvent) => {
          // The browser owns Esc while the game element is fullscreen.
          if (typeof document !== "undefined" && document.fullscreenElement) return;
          if (!this.fishing.current || this.pausedByPanel || this.transitioning) return;
          if (this.interactionGate.press(event.code, event.repeat, this.time.now)) this.stopFishing();
        };
        private onFishingCancel = () => {
          if (!this.pausedByPanel && !this.transitioning && this.fishing.current) this.stopFishing();
        };
        private onInputBlur = () => {
          this.interactionGate.reset();
          this.mobileDirections.clear();
          if (this.player?.active) this.player.setVelocity(0);
        };
        private onPanelState = (event: Event) => {
          this.pausedByPanel = (event as CustomEvent<{ paused: boolean }>).detail.paused;
        };
        private onZoomRequest = (event: Event) => {
          const direction = (event as CustomEvent<{ direction: "in" | "out" }>).detail?.direction;
          if (direction !== "in" && direction !== "out") return;

          const next = Phaser.Math.Clamp(
            this.zoomSteps[this.area] + (direction === "in" ? 1 : -1),
            ZOOM_LIMITS.min,
            ZOOM_LIMITS.max,
          );
          if (next === this.zoomSteps[this.area]) return;
          this.zoomSteps[this.area] = next;
          this.configureCamera(true);
        };
        private onGameResize = () => this.configureCamera();
        private onZoomStateRequest = () => this.publishZoomState();
        private onPlayerPostUpdate = () => this.validatePlayerPosition();

        constructor() {
          super("portfolio-world");
        }

        init(data: { area?: "house" | "world" } = {}) {
          this.area = data.area ?? "house";
          this.facing = "down";
          // Only a newly mounted game has no destination. Door returns are awake.
          this.wakingUp = data.area === undefined;
          if (this.area === "world") this.zoomSteps.world = ZOOM_LIMITS.min;
          this.pausedByPanel = false;
          this.transitioning = false;
          this.nearest = null;
          this.promptAnchor = undefined;
          this.promptWrapWidth = 0;
          this.mobileDirections.clear();
          this.lastFootstepAt = 0;
          this.footstepVariation = 0;
          this.houseFollowing = false;
          this.rest.reset();
          this.fishing.reset();
          this.fishingView = undefined;
          this.observation = undefined;
          this.interactionGate.reset();
          this.restSprite = undefined;
          this.houseView = undefined;
          this.exteriorView = undefined;
          this.fireSprite = undefined;
          this.fireGlow = undefined;
          this.fireTexture = undefined;
        }

        preload() {
          preloadHouse(this);
          preloadExterior(this);
          preloadCharacterMotion(this);
          this.load.image(
            "character-masculine-walksheet-source",
            "/game/character-masculine-walksheet.png",
          );
          this.load.image(
            "character-feminine-walksheet-source",
            "/game/character-feminine-walksheet.png",
          );
          this.load.audio(
            "step-wood-01",
            "/game/audio/effects/step-wood-01.mp3",
          );

          this.load.audio(
            "step-wood-02",
            "/game/audio/effects/step-wood-02.mp3",
          );

          this.load.audio(
            "step-grass-01",
            "/game/audio/effects/step-grass-01.mp3",
          );

          this.load.audio(
            "step-grass-02",
            "/game/audio/effects/step-grass-02.mp3",
          );

          this.load.audio(
            "fire-ignite",
            "/game/audio/effects/fire-ignite.mp3",
          );

          this.load.audio(
            "fire-extinguish",
            "/game/audio/effects/fire-extinguish.mp3",
          );

          this.load.audio(
            "chest-open",
            "/game/audio/effects/chest-open.mp3",
          );

          this.load.audio(
            "door-open",
            "/game/audio/effects/door-open.mp3",
          );

          this.load.audio(
            "map-open",
            "/game/audio/effects/map-open.mp3",
          );

          this.load.audio(
            "tv-turn-on",
            "/game/audio/effects/tv-turn-on.mp3",
          );

          this.load.audio(
            "ui-select",
            "/game/audio/effects/ui-select.mp3",
          );
        }

        create() {
          const syncAudio = () => {
            const { soundEnabled, volume } = usePortfolioStore.getState();
            this.sound.setMute(!soundEnabled);
            this.sound.setVolume(volume);
          };
          syncAudio();
          this.unsubscribeAudio = usePortfolioStore.subscribe((state, previous) => {
            if (state.soundEnabled !== previous.soundEnabled || state.volume !== previous.volume) syncAudio();
          });
          this.createCharacterAnimations();
          this.buildArea();
          this.cursors = this.input.keyboard!.createCursorKeys();
          this.keys = this.input.keyboard!.addKeys("W,A,S,D") as typeof this.keys;
          this.input.keyboard!.on("keydown-E", this.onKeyboardInteract);
          this.input.keyboard!.on("keydown-SPACE", this.onKeyboardInteract);
          this.input.keyboard!.on("keyup-E", this.onKeyboardRelease);
          this.input.keyboard!.on("keyup-SPACE", this.onKeyboardRelease);
          this.input.keyboard!.on("keydown-ESC", this.onEscape);
          this.input.keyboard!.on("keyup-ESC", this.onKeyboardRelease);
          window.addEventListener("blur", this.onInputBlur);
          window.addEventListener("portfolio:mobile-direction", this.onMobileDirection);
          window.addEventListener("portfolio:mobile-interact", this.onMobileInteract);
          window.addEventListener("portfolio:panel-state", this.onPanelState);
          window.addEventListener("portfolio:zoom", this.onZoomRequest);
          window.addEventListener("portfolio:zoom-state-request", this.onZoomStateRequest);
          window.addEventListener("portfolio:fishing-cancel", this.onFishingCancel);
          this.scale.on(Phaser.Scale.Events.RESIZE, this.onGameResize);
          // O Arcade já reposicionou o sprite quando este evento é disparado.
          this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.onPlayerPostUpdate);
          this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupListeners());
          this.cameras.main.fadeIn(220, 20, 12, 8);
        }

        private createCharacterAnimations() {
          const textureKey = this.characterTextureKey();
          if (!this.textures.exists(textureKey)) {
            const source = this.textures
              .get(`${textureKey}-source`)
              .getSourceImage() as HTMLImageElement;
            this.textures.addSpriteSheet(textureKey, source, {
              frameWidth: Math.floor(source.width / 4),
              frameHeight: Math.floor(source.height / 4),
            });
          }

          const directions: Facing[] = ["down", "left", "right", "up"];

          directions.forEach((direction, row) => {
            const key = this.animationKey(direction);
            if (this.anims.exists(key)) return;
            this.anims.create({
              key,
              frames: [0, 1, 2, 3].map((column) => ({
                key: textureKey,
                frame: row * 4 + column,
              })),
              // O ciclo um pouco mais rápido acompanha melhor a velocidade do
              // deslocamento e evita a sensação de pausas entre as passadas.
              frameRate: 10,
              skipMissedFrames: false,
              repeat: -1,
            });
          });
          createDiagonalAnimations(this, character);
        }

        private animationKey(direction: Facing) {
          return `walk-${character}-${direction}`;
        }

        private characterTextureKey() {
          return `character-${character}-walksheet`;
        }

        private idleFrame(direction: Facing) {
          if (isDiagonalDirection(direction)) return getDiagonalFrame(character, direction, 0);
          const row = { down: 0, left: 1, right: 2, up: 3 }[direction];
          // A primeira coluna de cada direção é a pose neutra. Usá-la ao
          // parar evita que o personagem congele no meio de uma passada.
          return row * 4;
        }

        private stopWalking() {
          this.player.setVelocity(0);
          this.stopWalkingAnimation();
        }

        private stopWalkingAnimation() {
          this.player.anims.stop();
          this.player.setTexture(isDiagonalDirection(this.facing) ? CHARACTER_MOTION_TEXTURE : this.characterTextureKey(), this.idleFrame(this.facing));
        }

        private configureCamera(animated = false) {
          const camera = this.cameras.main;
          const multiplier = 1 + this.zoomSteps[this.area] * 0.2;
          camera.setBackgroundColor("#000000");
          this.publishZoomState();

          if (this.area === "house") {
            camera.removeBounds();
            // O zoom inicial mostra todo o quarto, sem deformar a arte quadrada.
            const fittedZoom = Math.min(
              this.scale.width / SCENE_SIZE.house.width,
              this.scale.height / SCENE_SIZE.house.height,
            );
            const zoom = Math.max(fittedZoom * multiplier, 0.01);

            if (this.zoomSteps.house > 0 && !this.houseFollowing) {
              const { scrollX, scrollY } = camera;
              camera.startFollow(this.player, true, 0.12, 0.12);
              if (animated) camera.setScroll(scrollX, scrollY);
              this.houseFollowing = true;
            } else if (this.zoomSteps.house <= 0) {
              if (this.houseFollowing) camera.stopFollow();
              this.houseFollowing = false;
              if (animated) {
                camera.pan(SCENE_SIZE.house.width / 2, SCENE_SIZE.house.height / 2, 240, "Sine.easeInOut", true);
              } else {
                camera.centerOn(SCENE_SIZE.house.width / 2, SCENE_SIZE.house.height / 2);
              }
            }

            if (animated) camera.zoomTo(zoom, 240, "Sine.easeInOut", true);
            else camera.setZoom(zoom);
            return;
          }

          // Amplia o mapa pela câmera, preservando o tamanho nativo da textura.
          const baseZoom = Math.max(
            this.scale.width < 720 ? 1 : 2,
            Math.ceil(this.scale.width / SCENE_SIZE.world.width),
            Math.ceil(this.scale.height / SCENE_SIZE.world.height),
          );
          const zoom = baseZoom * multiplier;
          if (zoom < Math.max(this.scale.width / SCENE_SIZE.world.width, this.scale.height / SCENE_SIZE.world.height)) {
            camera.removeBounds();
          } else {
            camera.setBounds(0, 0, SCENE_SIZE.world.width, SCENE_SIZE.world.height);
          }
          if (animated) camera.zoomTo(zoom, 240, "Sine.easeInOut", true);
          else camera.setZoom(zoom);
        }

        private publishZoomState() {
          window.dispatchEvent(new CustomEvent("portfolio:zoom-state", {
            detail: { area: this.area, step: this.zoomSteps[this.area], ...ZOOM_LIMITS },
          }));
        }

        private buildArea() {
          const isHouse = this.area === "house";
          const { width: worldWidth, height: worldHeight } = SCENE_SIZE[this.area];
          this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

          if (isHouse) {
            this.houseView = buildHouse(this);
            this.addHouseLightingEffects();
          } else {
            this.exteriorView = buildExterior(this);
            this.exteriorView.update(this.worldElapsedMs());
          }

          const spawn = SPAWN_POINTS[this.area];
          this.lastWalkablePosition = { ...spawn };
          this.player = this.physics.add.sprite(
            spawn.x,
            spawn.y,
            this.characterTextureKey(),
          );
          this.player
            .setFrame(this.idleFrame(this.facing))
            .setDisplaySize(PLAYER_SIZE[this.area], PLAYER_SIZE[this.area])
            .setCollideWorldBounds(true)
            .setDepth(spawn.y + PLAYER_SIZE[this.area] * 0.43);
          this.player.body!.setSize(
            this.player.width * PLAYER_FOOTPRINT.width,
            this.player.height * PLAYER_FOOTPRINT.height,
          );
          this.player.body!.setOffset(
            this.player.width * PLAYER_FOOTPRINT.offsetX,
            this.player.height * PLAYER_FOOTPRINT.offsetY,
          );
          this.configureCamera();

          this.interactions = isHouse
            ? HOUSE_INTERACTIONS.map((interaction) => ({ ...interaction }))
            : [...WORLD_INTERACTIONS, ...WORLD_ACTIVITIES];

          this.prompt = this.add
            .text(0, 0, "", {
              fontFamily: "Stardew Valley",
              fontSize: "20px",
              fontStyle: "bold",
              color: "#4b2b22",
              backgroundColor: "#f6d99c",
              padding: { x: 12, y: 8 },
              align: "center",
              stroke: "#fff0b6",
              strokeThickness: 1,
            })
            .setOrigin(0.5, 1)
            .setDepth(5000)
            .setVisible(false);

          if (!isHouse) {
            // A geometria exterior usa a mesma área dos pés do validador de
            // terreno. Colliders Arcade maiores fechariam os caminhos estreitos.
            // Deixa o telhado inteiro visível ao sair pela porta, mesmo com zoom.
            this.cameras.main.startFollow(this.player, true, 0.09, 0.09, 0, 100);
          } else {
            this.applyRoomLightStates();
            if (this.wakingUp) this.enterRest("bed");
          }
        }

        private addHouseLightingEffects() {
          // Nenhuma máscara é desenhada atrás do fogo: permanecem somente
          // a abertura original da lareira e as três chamas animadas.
          this.fireGlow = this.add
            .ellipse(HOUSE_LIGHTS.fire.x, HOUSE_LIGHTS.fire.y, 118, 72, 0xff8a24, 0.22)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(353);
          this.createPixelFire();

          this.tweens.add({
            targets: this.fireGlow,
            alpha: { from: 0.14, to: 0.3 },
            scale: { from: 0.94, to: 1.06 },
            duration: 420,
            yoyo: true,
            repeat: -1,
          });

          this.applyRoomLightStates();
        }

        private createPixelFire() {
          const textureKey = "room-fire-pixels";
          if (this.textures.exists(textureKey)) this.textures.remove(textureKey);

          const texture = this.textures.createCanvas(textureKey, 48, 16);
          if (!texture) return;
          texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
          this.fireTexture = texture;

          const baseY = [2, 1, 0, 0, 0, 0, 1, 2];
          const maximum = [7, 9, 11, 13, 13, 11, 9, 7];
          const minimum = [4, 7, 8, 10, 10, 8, 7, 4];

          const drawFlames = () => {
            const context = texture.context;
            context.save();
            context.setTransform(1, 0, 0, 1, 0, 0);
            context.clearRect(0, 0, 48, 16);
            context.imageSmoothingEnabled = false;
            context.translate(0, 16);
            context.scale(1, -1);
            context.lineWidth = 1;

            for (let flameIndex = 0; flameIndex < 3; flameIndex += 1) {
              const offset = flameIndex * 16;

              context.strokeStyle = "#d14234";
              let i = 0;
              for (let x = 4; x < 12; x += 1) {
                const height = Math.random() * (maximum[i] - minimum[i] + 1) + minimum[i];
                context.beginPath();
                context.moveTo(offset + x + 0.5, baseY[i]);
                context.lineTo(offset + x + 0.5, height);
                context.stroke();
                i += 1;
              }

              context.strokeStyle = "#f2a55f";
              let j = 1;
              for (let x = 5; x < 11; x += 1) {
                const height = Math.random() * (maximum[j] - minimum[j] + 1) + (minimum[j] - 5);
                context.beginPath();
                context.moveTo(offset + x + 0.5, baseY[j] + 1);
                context.lineTo(offset + x + 0.5, height);
                context.stroke();
                j += 1;
              }

              context.strokeStyle = "#e8dec5";
              let k = 3;
              for (let x = 7; x < 9; x += 1) {
                const height = Math.random() * (maximum[k] - minimum[k] + 1) + (minimum[k] - 9);
                context.beginPath();
                context.moveTo(offset + x + 0.5, baseY[k]);
                context.lineTo(offset + x + 0.5, height);
                context.stroke();
                k += 1;
              }
            }

            context.restore();
            texture.refresh();
          };

          drawFlames();
          this.time.addEvent({ delay: 1000 / 7, loop: true, callback: drawFlames });
          this.fireSprite = this.add
            .image(HOUSE_LIGHTS.fire.x, HOUSE_LIGHTS.fire.y, textureKey)
            .setDisplaySize(72, 42)
            .setDepth(354);
        }

        private applyRoomLightStates() {
          this.fireGlow?.setVisible(this.fireLit);
          this.fireSprite?.setVisible(this.fireLit);
          for (const interaction of this.interactions) {
            if (interaction.action === "toggle-fire") interaction.label = this.fireLit ? "Apagar lareira" : "Acender lareira";
          }
        }

        private playFireToggleSound() {
          const soundKey = this.fireLit
            ? "fire-ignite"
            : "fire-extinguish";

          if (!this.cache.audio.exists(soundKey)) {
            return;
          }

          this.sound.play(soundKey, {
            volume: 0.25,
          });
        }

        private toggleRoomObject(
          action: NonNullable<Interaction["action"]>,
        ) {
          if (action === "toggle-fire") {
            this.fireLit = !this.fireLit;
            this.playFireToggleSound();
          }

          this.applyRoomLightStates();

          this.updateInteraction();
        }

        private enterRest(restId: HouseRestId) {
          const spot = this.rest.enter(restId, this.lastWalkablePosition);
          if (!spot) return;
          this.stopWalking();
          const body = this.player.body as import("phaser").Physics.Arcade.Body;
          body.reset(spot.x, spot.y);
          body.enable = false;
          this.player.setVisible(false);
          this.restSprite = this.add.image(spot.x, spot.y, "house-poses", getRestPoseFrame(character, spot.kind))
            .setDisplaySize(spot.width, spot.height).setDepth(spot.depth).setFlipX(spot.facing === "left");
          this.houseView?.bedCover.setVisible(spot.kind === "lie");
          this.updateInteraction();
        }

        private leaveRest() {
          const exit = this.rest.leave();
          if (!exit) return;
          this.wakingUp = false;
          this.restSprite?.destroy();
          this.restSprite = undefined;
          this.houseView?.bedCover.setVisible(false);
          this.facing = "down";
          const body = this.player.body as import("phaser").Physics.Arcade.Body;
          body.reset(exit.x, exit.y);
          body.enable = true;
          this.player.setVisible(true).setDepth(exit.y + PLAYER_SIZE.house * 0.43);
          this.stopWalking();
          this.lastWalkablePosition = { ...exit };
          this.mobileDirections.clear();
          this.updateInteraction();
        }

        private startFishing() {
          if (this.area !== "world") return;
          const spot = this.fishing.begin(this.lastWalkablePosition);
          if (!spot) return;
          this.observation = undefined;
          this.facing = spot.facing;
          this.stopWalking();
          const body = this.player.body as import("phaser").Physics.Arcade.Body;
          body.reset(spot.position.x, spot.position.y);
          body.enable = false;
          this.player.setDepth(spot.position.y + PLAYER_SIZE.world * 0.43);
          this.fishingStartedAt = this.time.now;
          this.fishingView = createFishingView(this, spot);
          this.player.setTexture(CHARACTER_MOTION_TEXTURE, getFishingPoseFrame(character, "cast-0"));
          window.dispatchEvent(new CustomEvent("portfolio:fishing-state", { detail: { active: true } }));
          this.updateInteraction();
        }

        private stopFishing() {
          const exit = this.fishing.leave();
          if (!exit) return;
          this.fishingView?.destroy();
          this.fishingView = undefined;
          window.dispatchEvent(new CustomEvent("portfolio:fishing-state", { detail: { active: false } }));
          const body = this.player.body as import("phaser").Physics.Arcade.Body;
          body.reset(exit.x, exit.y);
          body.enable = true;
          this.facing = "down";
          this.stopWalking();
          this.player.setDepth(exit.y + PLAYER_SIZE.world * 0.43);
          this.lastWalkablePosition = { ...exit };
          this.mobileDirections.clear();
          this.updateInteraction();
        }

        private observeWorld(interaction: Interaction) {
          if (!interaction.response) return;
          this.observation = {
            text: interaction.response, x: interaction.x, y: interaction.y,
            expires: this.time.now + 3600,
          };
          this.updateInteraction();
        }

        private canOccupy(position: Position) {
          if (this.area === "world") {
            return canOccupyWorld(position);
          }

          return canOccupyHouse(position);
        }

        private validatePlayerPosition() {
          if (!this.player?.active) return;
          if (this.rest.current || this.fishing.current) return;

          // Both areas validate the complete foot path in short steps, including
          // furniture and tile boundaries, so slow frames cannot tunnel through.
          const previous = this.lastWalkablePosition;
          const current = { x: this.player.x, y: this.player.y };
          const accepted = moveAlongWalkablePath(previous, current, (position) => this.canOccupy(position));
          if (Phaser.Math.Distance.Between(current.x, current.y, accepted.x, accepted.y) > 0.01) {
            (this.player.body as import("phaser").Physics.Arcade.Body).reset(accepted.x, accepted.y);
          }

          const distance = Phaser.Math.Distance.Between(previous.x, previous.y, accepted.x, accepted.y);
          this.lastWalkablePosition = accepted;
          if (distance > 0.1 && !this.pausedByPanel && this.player.anims.isPlaying) {
            this.playFootstep();
          } else if (distance <= 0.1 && !this.pausedByPanel) {
            // A física processa a velocidade definida em update() no próximo
            // frame; zerá-la aqui prenderia o personagem no ponto inicial.
            this.stopWalkingAnimation();
          }

          this.player.setDepth(this.player.y + PLAYER_SIZE[this.area] * 0.43);
          this.updateInteraction();
        }

        private playFootstep() {
          const now = this.time.now;
          const footstepInterval = 320;

          if (now - this.lastFootstepAt < footstepInterval) {
            return;
          }

          this.lastFootstepAt = now;

          const surface = this.area === "house" ? "wood" : "grass";
          const variation = this.footstepVariation === 0 ? "01" : "02";
          const soundKey = `step-${surface}-${variation}`;

          this.footstepVariation =
            this.footstepVariation === 0 ? 1 : 0;

          if (!this.cache.audio.exists(soundKey)) {
            return;
          }

          this.sound.play(soundKey, {
            volume: 0.22,
            rate: Phaser.Math.FloatBetween(0.96, 1.04),
          });
        }

        update() {
          this.fitPromptToCamera();
          this.exteriorView?.update(this.worldElapsedMs(), this.player ? {
            x: this.player.x,
            y: this.player.y + PLAYER_SIZE.world * (PLAYER_FOOTPRINT.offsetY + PLAYER_FOOTPRINT.height / 2 - 0.5),
          } : undefined);
          if (!this.player) return;
          if (this.fishing.current) {
            this.player.setVelocity(0);
            const elapsed = this.time.now - this.fishingStartedAt;
            const outcome = this.fishing.tick(elapsed);
            this.fishingView?.update(elapsed);
            const motion = getFishingAnimation(this.fishing.current, elapsed);
            const pose = motion.characterPose === "cast"
              ? motion.poseProgress < 0.45 ? "cast-0" : "cast-1"
              : motion.characterPose === "reel" ? "reel" : "hold";
            this.player.setTexture(CHARACTER_MOTION_TEXTURE, getFishingPoseFrame(character, pose));
            if (outcome.caught) {
              const unlocked = usePortfolioStore.getState().recordFishCatch();
              if (unlocked) window.dispatchEvent(new CustomEvent("portfolio:fishing-achievement", {
                detail: { fishCaught: usePortfolioStore.getState().fishCaught },
              }));
            }
            this.updateInteraction();
            return;
          }
          if (this.rest.current) {
            this.player.setVelocity(0);
            return;
          }
          if (this.pausedByPanel) {
            this.stopWalking();
            return;
          }

          const left = this.cursors.left.isDown || this.keys.A.isDown || this.mobileDirections.has("left");
          const right = this.cursors.right.isDown || this.keys.D.isDown || this.mobileDirections.has("right");
          const up = this.cursors.up.isDown || this.keys.W.isDown || this.mobileDirections.has("up");
          const down = this.cursors.down.isDown || this.keys.S.isDown || this.mobileDirections.has("down");

          const direction = new Phaser.Math.Vector2(Number(right) - Number(left), Number(down) - Number(up));
          if (direction.lengthSq() > 0) direction.normalize().scale(190);
          this.player.setVelocity(direction.x, direction.y);

          if (direction.lengthSq() > 0) {
            const nextFacing = getMovementFacing(direction.x, direction.y, this.facing);
            this.facing = nextFacing;
            const animation = this.animationKey(nextFacing);
            if (this.player.anims.currentAnim?.key !== animation || !this.player.anims.isPlaying) {
              this.player.anims.play(animation, true);
            }
          } else {
            this.stopWalking();
          }
        }

        private updateInteraction() {
          const fishing = this.fishing.current;
          if (fishing) {
            const messages = {
              cast: "Lançando a linha…\n[Esc] Cancelar",
              waiting: "Aguardando uma fisgada…\n[Esc] Cancelar",
              bite: "Fisgou!\n[Esc] Cancelar",
              reel: "Recolhendo o peixe…\n[Esc] Cancelar",
              caught: "Peixe capturado!",
              ready: "[E] Pescar novamente\n[Esc] Encerrar",
            };
            this.prompt.setText(messages[this.fishing.phase]);
            this.showPrompt(fishing.position.x, fishing.position.y - 70);
            return;
          }
          const resting = this.rest.current;
          if (resting) {
            this.prompt.setText(this.wakingUp
              ? "Um novo dia começa neste mundo. Pressione E para levantar."
              : "[E] Levantar");
            this.showPrompt(this.wakingUp ? resting.x - 72 : resting.x, resting.y - resting.height / 2 - 12);
            return;
          }
          let nearest: Interaction | null = null;
          let nearestDistance = Number.POSITIVE_INFINITY;
          for (const interaction of this.interactions) {
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, interaction.x, interaction.y);
            if (distance < interaction.radius && distance < nearestDistance) {
              nearest = interaction;
              nearestDistance = distance;
            }
          }
          this.nearest = nearest;
          if (this.observation) {
            const { x, y, text, expires } = this.observation;
            if (this.time.now < expires && Math.hypot(this.player.x - x, this.player.y - y) < 110) {
              this.prompt.setText(text);
              this.showPrompt(x, y - 40);
              return;
            }
            this.observation = undefined;
          }
          if (!nearest) {
            this.prompt.setVisible(false);
            return;
          }
          this.prompt.setText(nearest.prompt ?? `${nearest.label}\n[E] Interagir`);
          this.showPrompt(nearest.x, this.area === "house" && nearest.panel === "intro" ? HOUSE_MARKER.y - 30 : nearest.y - 36);
        }

        private showPrompt(x: number, y: number) {
          this.promptAnchor = { x, y };
          this.prompt.setPosition(x, y).setVisible(true);
          this.fitPromptToCamera();
        }

        private fitPromptToCamera() {
          if (!this.prompt?.visible || !this.promptAnchor) return;
          const camera = this.cameras.main;
          const zoom = Math.max(0.01, camera.zoom);
          // Keep 20px text in screen pixels, including the fitted indoor camera.
          this.prompt.setScale(1 / zoom);
          const wrapWidth = Math.max(160, Math.min(330, this.scale.width - 56));
          // Text wrapping uploads a canvas texture; only redo it on resize.
          if (wrapWidth !== this.promptWrapWidth) {
            this.prompt.setWordWrapWidth(wrapWidth);
            this.promptWrapWidth = wrapWidth;
          }
          const view = camera.worldView;
          // The camera computes its world rectangle at the first pre-render.
          if (!view?.width || !view.height) return;
          const margin = 12 / zoom;
          const halfWidth = this.prompt.displayWidth / 2;
          this.prompt.setPosition(
            Phaser.Math.Clamp(this.promptAnchor.x, view.x + margin + halfWidth, view.right - margin - halfWidth),
            Phaser.Math.Clamp(this.promptAnchor.y, view.y + margin + this.prompt.displayHeight, view.bottom - margin),
          );
        }

        private playInteractionSound(interaction: Interaction) {
          if (!interaction.sound) {
            return;
          }

          if (!this.cache.audio.exists(interaction.sound)) {
            return;
          }

          const sound = this.sound.add(interaction.sound, {
            volume: 0.3,
          });

          sound.play();

          this.time.delayedCall(2000, () => {
            if (sound.isPlaying) {
              sound.stop();
            }

            sound.destroy();
          });
        }

        private interact() {
          if (this.pausedByPanel || this.transitioning) {
            return;
          }
          if (this.rest.current) {
            this.leaveRest();
            return;
          }
          if (this.fishing.current) {
            if (this.fishing.retry()) {
              this.fishingStartedAt = this.time.now;
              this.fishingView?.update(0);
              this.player.setTexture(CHARACTER_MOTION_TEXTURE, getFishingPoseFrame(character, "cast-0"));
              this.updateInteraction();
            }
            return;
          }
          if (!this.nearest) return;

          this.playInteractionSound(this.nearest);

          if (this.nearest.activity) {
            if (this.nearest.activity === "fish") this.startFishing();
            else this.observeWorld(this.nearest);
            return;
          }

          if (this.nearest.restId) {
            this.enterRest(this.nearest.restId);
            return;
          }

          if (this.nearest.action) {
            this.toggleRoomObject(this.nearest.action);
            return;
          }

          if (this.nearest.destination) {
            this.transitionTo(this.nearest.destination);
            return;
          }

          if (this.nearest.panel) {
            window.dispatchEvent(
              new CustomEvent("portfolio:open-panel", {
                detail: {
                  panel: this.nearest.panel,
                },
              }),
            );
          }
        }

        private transitionTo(destination: "house" | "world") {
          if (this.transitioning) return;
          this.transitioning = true;
          this.pausedByPanel = true;
          this.cameras.main.fadeOut(180, 20, 12, 8);
          this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.restart({ area: destination });
          });
        }

        private cleanupListeners() {
          this.unsubscribeAudio?.();
          this.unsubscribeAudio = undefined;
          this.input.keyboard?.off("keydown-E", this.onKeyboardInteract);
          this.input.keyboard?.off("keydown-SPACE", this.onKeyboardInteract);
          this.input.keyboard?.off("keyup-E", this.onKeyboardRelease);
          this.input.keyboard?.off("keyup-SPACE", this.onKeyboardRelease);
          this.input.keyboard?.off("keydown-ESC", this.onEscape);
          this.input.keyboard?.off("keyup-ESC", this.onKeyboardRelease);
          window.removeEventListener("blur", this.onInputBlur);
          this.rest.reset();
          this.fishingView?.destroy();
          this.exteriorView?.destroy();
          this.fishing.reset();
          window.dispatchEvent(new CustomEvent("portfolio:fishing-state", { detail: { active: false } }));
          this.interactionGate.reset();
          window.removeEventListener("portfolio:mobile-direction", this.onMobileDirection);
          window.removeEventListener("portfolio:mobile-interact", this.onMobileInteract);
          window.removeEventListener("portfolio:panel-state", this.onPanelState);
          window.removeEventListener("portfolio:zoom", this.onZoomRequest);
          window.removeEventListener("portfolio:zoom-state-request", this.onZoomStateRequest);
          window.removeEventListener("portfolio:fishing-cancel", this.onFishingCancel);
          this.scale.off(Phaser.Scale.Events.RESIZE, this.onGameResize);
          this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.onPlayerPostUpdate);
        }

        private worldElapsedMs() {
          return Math.max(0, performance.now() - this.worldTimeStartedAt);
        }
      }

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: hostRef.current,
        width: 960,
        height: 600,
        backgroundColor: "#000000",
        pixelArt: true,
        antialias: false,
        roundPixels: true,
        physics: {
          default: "arcade",
          arcade: { debug: false },
        },
        scale: {
          mode: Phaser.Scale.RESIZE,
        },
        scene: [PortfolioScene],
      });
    }

    void mountGame();
    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [character]);

  return (
    <div
      ref={hostRef}
      className="size-full [&>canvas]:block [&>canvas]:[image-rendering:pixelated]"
      aria-label="Mundo interativo do portfólio"
    />
  );
}
