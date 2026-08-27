"use client";

import { useEffect, useRef } from "react";
import type { Character, PanelType } from "@/components/portfolio/store/portfolio-store";
import {
  HIDDEN_HOUSE_PATHS,
  HOUSE_COLLISIONS,
  HOUSE_FLOOR_AREAS,
  SCENE_SIZE,
  SPAWN_POINTS,
  WORLD_COLLISIONS,
  WORLD_FOREGROUND_REGIONS,
  WORLD_SPECIAL_WALKABLE_AREAS,
  type CollisionBox,
} from "@/components/portfolio/game/world-config";

type PhaserGameProps = {
  character: Character;
};

type Facing = "down" | "left" | "right" | "up";

type Interaction = {
  x: number;
  y: number;
  radius: number;
  label: string;
  panel?: Exclude<PanelType, null>;
  destination?: "house" | "world";
  action?: "toggle-fire";
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
        private cursors!: import("phaser").Types.Input.Keyboard.CursorKeys;
        private keys!: Record<"W" | "A" | "S" | "D", import("phaser").Input.Keyboard.Key>;
        private mobileDirections = new Set<string>();
        private pausedByPanel = false;
        private transitioning = false;
        private lastWalkablePosition = { x: 0, y: 0 };
        private worldCollisionPixels?: Uint8ClampedArray;
        private worldCollisionWidth = 0;
        private worldCollisionHeight = 0;
        private fireLit = true;
        private fireGlow?: import("phaser").GameObjects.Ellipse;
        private fireSprite?: import("phaser").GameObjects.Image;
        private fireTexture?: import("phaser").Textures.CanvasTexture;
        private lastFootstepAt = 0;
        private footstepVariation = 0;
        private onMobileDirection = (event: Event) => {
          const detail = (event as CustomEvent<{ direction: string; active: boolean }>).detail;
          if (detail.active) this.mobileDirections.add(detail.direction);
          else this.mobileDirections.delete(detail.direction);
        };
        private onMobileInteract = () => this.interact();
        private onKeyboardInteract = () => this.interact();
        private onPanelState = (event: Event) => {
          this.pausedByPanel = (event as CustomEvent<{ paused: boolean }>).detail.paused;
        };

        constructor() {
          super("portfolio-world");
        }

        init(data: { area?: "house" | "world" }) {
          this.area = data.area ?? "house";
          this.pausedByPanel = false;
          this.transitioning = false;
          this.nearest = null;
          this.mobileDirections.clear();
          this.worldCollisionPixels = undefined;
          this.worldCollisionWidth = 0;
          this.worldCollisionHeight = 0;
          this.lastFootstepAt = 0;
          this.footstepVariation = 0;
        }

        preload() {
          this.load.image("house", "/game/house-interior.png");
          this.load.image("world", "/game/exterior-world.png");
          this.load.image("exit-direction-sign", "/game/exit-direction-sign.png");
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
        }

        create() {
          this.createCharacterAnimations();
          this.buildArea();
          this.cursors = this.input.keyboard!.createCursorKeys();
          this.keys = this.input.keyboard!.addKeys("W,A,S,D") as typeof this.keys;
          this.input.keyboard!.on("keydown-E", this.onKeyboardInteract);
          this.input.keyboard!.on("keydown-SPACE", this.onKeyboardInteract);
          window.addEventListener("portfolio:mobile-direction", this.onMobileDirection);
          window.addEventListener("portfolio:mobile-interact", this.onMobileInteract);
          window.addEventListener("portfolio:panel-state", this.onPanelState);
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
        }

        private animationKey(direction: Facing) {
          return `walk-${character}-${direction}`;
        }

        private characterTextureKey() {
          return `character-${character}-walksheet`;
        }

        private idleFrame(direction: Facing) {
          const row = { down: 0, left: 1, right: 2, up: 3 }[direction];
          // A primeira coluna de cada direção é a pose neutra. Usá-la ao
          // parar evita que o personagem congele no meio de uma passada.
          return row * 4;
        }

        private stopWalking() {
          this.player.setVelocity(0);
          this.player.anims.stop();
          this.player.setFrame(this.idleFrame(this.facing));
        }

        private buildArea() {
          const isHouse = this.area === "house";
          const { width: worldWidth, height: worldHeight } = SCENE_SIZE[this.area];
          this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
          this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

          const background = this.add.image(worldWidth / 2, worldHeight / 2, isHouse ? "house" : "world");
          background.setDisplaySize(worldWidth, worldHeight).setDepth(0);

          if (isHouse) this.addHouseLightingEffects();
          else {
            this.prepareWorldCollisionMap();
            this.addExitSign();
            this.addWorldForegroundLayers();
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
            .setDisplaySize(64, 64)
            .setCollideWorldBounds(true)
            .setDepth(spawn.y + 28);
          this.player.body!.setSize(this.player.width * 0.44, this.player.height * 0.18);
          this.player.body!.setOffset(this.player.width * 0.28, this.player.height * 0.77);

          this.interactions = isHouse
            ? [
                { x: 615, y: 455, radius: 82, label: "Abrir guia do portfólio", panel: "intro" },
                { x: 170, y: 160, radius: 115, label: "Ligar TV", panel: "tv" },
                { x: 740, y: 180, radius: 95, label: this.fireLit ? "Apagar lareira" : "Acender lareira", action: "toggle-fire" },
                { x: 480, y: 558, radius: 44, label: "Sair da casa", destination: "world" },
              ]
            : [
                { x: 625, y: 95, radius: 95, label: "Projetos", panel: "projects" },
                { x: 230, y: 405, radius: 135, label: "Habilidades", panel: "skills" },
                { x: 1015, y: 405, radius: 135, label: "Experiências", panel: "experiences" },
                { x: 620, y: 505, radius: 86, label: "Mapa do mundo", panel: "map" },
                { x: 695, y: 1050, radius: 105, label: "Ver caminho dos baús", panel: "map" },
                { x: 625, y: 900, radius: 72, label: "Entrar na casa", destination: "house" },
              ];

          this.prompt = this.add
            .text(0, 0, "", {
              fontFamily: "Stardew Valley",
              fontSize: "17px",
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
            this.addWorldCollisions();
            this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
          } else {
            this.addHouseCollisions();
            this.add
              .text(615, 398, "!", {
                fontFamily: "Stardew Valley",
                fontSize: "28px",
                fontStyle: "bold",
                color: "#ffe9a9",
                stroke: "#5d2e1d",
                strokeThickness: 5,
              })
              .setOrigin(0.5)
              .setDepth(1200);
          }
        }

        private addHouseLightingEffects() {
          // Nenhuma máscara é desenhada atrás do fogo: permanecem somente
          // a abertura original da lareira e as três chamas animadas.
          this.fireGlow = this.add
            .ellipse(740, 174, 118, 72, 0xff8a24, 0.22)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(6);
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
            .image(740, 181, textureKey)
            .setDisplaySize(72, 42)
            .setDepth(7);
        }

        private applyRoomLightStates() {
          this.fireGlow?.setVisible(this.fireLit);
          this.fireSprite?.setVisible(this.fireLit);
        }

        private toggleRoomObject(action: NonNullable<Interaction["action"]>) {
          if (action === "toggle-fire") this.fireLit = !this.fireLit;
          this.applyRoomLightStates();

          const interaction = this.interactions.find((item) => item.action === action);
          if (!interaction) return;
          if (action === "toggle-fire") interaction.label = this.fireLit ? "Apagar lareira" : "Acender lareira";
          this.updateInteraction();
        }

        private addWorldForegroundLayers() {
          const worldSource = this.textures
            .get("world")
            .getSourceImage() as CanvasImageSource;

          WORLD_FOREGROUND_REGIONS.forEach((region) => {
            // O primeiro plano recebe uma textura isolada a cada entrada no
            // exterior. Assim, reiniciar a cena nunca reaproveita um frame
            // recortado da visita anterior nem sobrepõe o mapa inteiro.
            const textureKey = `foreground-${region.key}`;
            if (this.textures.exists(textureKey)) {
              this.textures.remove(textureKey);
            }

            const texture = this.textures.createCanvas(
              textureKey,
              region.width,
              region.height,
            );
            if (!texture) return;

            const context = texture.context;
            context.imageSmoothingEnabled = false;
            context.clearRect(0, 0, region.width, region.height);
            context.save();
            context.beginPath();
            region.polygons.forEach((polygon) => {
              const [first, ...remaining] = polygon;
              context.moveTo(first[0], first[1]);
              remaining.forEach(([x, y]) => context.lineTo(x, y));
              context.closePath();
            });
            context.clip();
            context.drawImage(
              worldSource,
              region.x,
              region.y,
              region.width,
              region.height,
              0,
              0,
              region.width,
              region.height,
            );
            context.restore();
            texture.refresh();

            this.add
              .image(
                region.x,
                region.y,
                textureKey,
              )
              .setOrigin(0)
              .setDepth(region.baseline);
          });
        }

        private addExitSign() {
          // Sprite dedicado com transparência real: evita carregar junto o
          // retângulo de grama que existia no recorte da textura do mapa.
          this.add
            .image(695, 1050, "exit-direction-sign")
            .setOrigin(0.5, 1)
            .setDisplaySize(58, 82)
            .setFlipX(true)
            .setDepth(1050);
        }

        private addHouseCollisions() {
          this.addCollisionBoxes(HOUSE_COLLISIONS);
        }

        private addWorldCollisions() {
          this.addCollisionBoxes(WORLD_COLLISIONS);
        }

        private prepareWorldCollisionMap() {
          const source = this.textures
            .get("world")
            .getSourceImage() as CanvasImageSource & { width: number; height: number };
          const width = source.width || 1254;
          const height = source.height || 1254;
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context) return;

          context.drawImage(source, 0, 0, width, height);
          this.worldCollisionPixels = context.getImageData(0, 0, width, height).data;
          this.worldCollisionWidth = width;
          this.worldCollisionHeight = height;
        }

        private isEarthPixel(x: number, y: number) {
          if (!this.worldCollisionPixels) return false;
          const sampleX = Phaser.Math.Clamp(Math.round(x), 0, this.worldCollisionWidth - 1);
          const sampleY = Phaser.Math.Clamp(Math.round(y), 0, this.worldCollisionHeight - 1);
          const index = (sampleY * this.worldCollisionWidth + sampleX) * 4;
          const red = this.worldCollisionPixels[index];
          const green = this.worldCollisionPixels[index + 1];
          const blue = this.worldCollisionPixels[index + 2];

          // Os caminhos usam tons terrosos quentes; a vegetação é dominada
          // pelo verde. A relação entre canais é mais estável que uma cor fixa.
          return (
            red > 118 &&
            green > 70 &&
            red > green * 1.08 &&
            green > blue * 1.22 &&
            red - blue > 42
          );
        }

        private isWorldPathWalkable(x: number, y: number) {
          // Áreas de madeira/sombra e a clareira superior não compartilham a
          // cor do caminho, por isso recebem limites explícitos e estreitos.
          const specialWalkableAreas = WORLD_SPECIAL_WALKABLE_AREAS.map(
            (area) => new Phaser.Geom.Rectangle(area.x, area.y, area.width, area.height),
          );
          const hiddenHousePaths = HIDDEN_HOUSE_PATHS.map(
            (points) => new Phaser.Geom.Polygon(points.flat()),
          );
          if (
            specialWalkableAreas.some((area) => Phaser.Geom.Rectangle.Contains(area, x, y)) ||
            hiddenHousePaths.some((path) => Phaser.Geom.Polygon.Contains(path, x, y))
          ) {
            return true;
          }

          // Uma pequena amostragem ao redor dos pés tolera pedrinhas e tufos
          // decorativos sem permitir que o personagem atravesse a grama.
          const offsets = [-6, -3, 0, 3, 6];
          let earthSamples = 0;
          offsets.forEach((offsetY) => {
            offsets.forEach((offsetX) => {
              if (this.isEarthPixel(x + offsetX, y + 22 + offsetY)) earthSamples += 1;
            });
          });
          return earthSamples >= 7;
        }

        private addCollisionBoxes(blockers: CollisionBox[]) {
          blockers.forEach((blocker) => {
            const zone = this.add.zone(blocker.x, blocker.y, blocker.width, blocker.height);
            this.physics.add.existing(zone, true);
            this.physics.add.collider(this.player, zone);
          });
        }

        private keepPlayerOnWorldPaths() {
          if (this.area === "house") {
            // A textura possui uma moldura e um vazio preto ao redor do quarto.
            // O assoalho principal e o corredor da porta formam uma área em T:
            // assim as laterais inferiores continuam bloqueadas, sem impedir a saída.
            const roomFloorAreas = HOUSE_FLOOR_AREAS.map(
              (area) => new Phaser.Geom.Rectangle(area.x, area.y, area.width, area.height),
            );
            const isOnFloor = roomFloorAreas.some((area) =>
              Phaser.Geom.Rectangle.Contains(area, this.player.x, this.player.y),
            );

            if (isOnFloor) {
              this.lastWalkablePosition = { x: this.player.x, y: this.player.y };
              return true;
            }

            this.player.setPosition(this.lastWalkablePosition.x, this.lastWalkablePosition.y);
            this.stopWalking();
            return false;
          }

          const isWalkable = this.isWorldPathWalkable(this.player.x, this.player.y);

          if (isWalkable) {
            this.lastWalkablePosition = { x: this.player.x, y: this.player.y };
            return true;
          }

          this.player.setPosition(this.lastWalkablePosition.x, this.lastWalkablePosition.y);
          this.stopWalking();
          return false;
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
            volume: 0.14,
            rate: Phaser.Math.FloatBetween(0.96, 1.04),
          });
        }

        update() {
          if (!this.player) return;
          if (this.pausedByPanel) {
            this.stopWalking();
            return;
          }

          if (!this.keepPlayerOnWorldPaths()) {
            this.updateInteraction();
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
            const nextFacing: Facing = Math.abs(direction.x) > Math.abs(direction.y)
              ? direction.x < 0 ? "left" : "right"
              : direction.y < 0 ? "up" : "down";
            this.facing = nextFacing;
            const animation = this.animationKey(nextFacing);
            if (this.player.anims.currentAnim?.key !== animation || !this.player.anims.isPlaying) {
              this.player.anims.play(animation, true);
            }
            this.playFootstep();
          } else {
            this.stopWalking();
          }

          this.player.setDepth(this.player.y + 28);
          this.updateInteraction();
        }

        private updateInteraction() {
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
          if (!nearest) {
            this.prompt.setVisible(false);
            return;
          }
          this.prompt
            .setText(`${nearest.label}\n[E] Interagir`)
            .setPosition(nearest.x, nearest.y - 36)
            .setVisible(true);
        }

        private interact() {
          if (this.pausedByPanel || !this.nearest) return;
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
              new CustomEvent("portfolio:open-panel", { detail: { panel: this.nearest.panel } }),
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
          this.input.keyboard?.off("keydown-E", this.onKeyboardInteract);
          this.input.keyboard?.off("keydown-SPACE", this.onKeyboardInteract);
          window.removeEventListener("portfolio:mobile-direction", this.onMobileDirection);
          window.removeEventListener("portfolio:mobile-interact", this.onMobileInteract);
          window.removeEventListener("portfolio:panel-state", this.onPanelState);
        }
      }

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: hostRef.current,
        width: 960,
        height: 600,
        backgroundColor: "#160d0b",
        pixelArt: true,
        antialias: false,
        roundPixels: true,
        physics: {
          default: "arcade",
          arcade: { debug: false },
        },
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
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
      className="size-full [&>canvas]:block [&>canvas]:size-full! [&>canvas]:[image-rendering:pixelated]"
      aria-label="Mundo interativo do portfólio"
    />
  );
}
