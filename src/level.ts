import { AudioClipLibrary, AudioSourceChannel } from "./audio";
import {
  DESTROY_AT_END_OF_FRAME,
  King,
  SpriteObject,
  StaticCollider,
  Sub,
  Trekronor,
  type GameObject,
  type ImplodeSound,
  type SceneContext,
  type SpriteView,
  type SubCounter,
  type Transform2D,
} from "./entities";
import type { KeyboardInput } from "./input";
import { PhysicsWorld } from "./physics";
import { randomRange } from "./random";
import {
  ARROWS_HINT_SPRITE,
  BACKGROUND_SPRITE,
  BORDER_COLLIDER,
  BORDER_POSITION,
  CROWN_SPRITES,
  FIXED_DELTA_TIME,
  GAME_MASTER_POSITION,
  GAME_START_SOUND_VOLUME,
  INITIAL_SPAWN_INTERVAL_SECONDS,
  INITIAL_SUBS_LEFT,
  MUSIC_START_DELAY_SECONDS,
  MUSIC_VOLUME,
  PUTIN_SPAWN_OFFSET,
  PUTIN_SPRITE_SORTING_ORDER,
  RESTART_BUTTON_RECT,
  SPACE_HINT_SPRITE,
  SPAWN_INTERVAL_MULTIPLIER,
  SUB_SPAWN_Y_SPREAD,
  WALL_COLLIDER,
  WALL_POSITIONS,
  Z_INDICATOR_SPRITE,
  type Vec2Like,
} from "./unity-scene";

export type PauseState = "running" | "paused";
export type MenuVisibility = "hidden" | "shown";
export type ClickOutcome = "restart-requested" | "ignored";

export interface VisibleSprite {
  readonly transform: Transform2D;
  readonly sprite: SpriteView;
}

/** Everything the renderer needs to draw one frame of a level. */
export interface LevelView {
  readonly subsLeft: number;
  readonly menu: MenuVisibility;
  /** Active sprites in draw order: by sorting order, then creation order. */
  visibleSprites(): readonly VisibleSprite[];
}

function togglePause(pause: PauseState): PauseState {
  return pause === "paused" ? "running" : "paused";
}

function toggleMenu(menu: MenuVisibility): MenuVisibility {
  return menu === "shown" ? "hidden" : "shown";
}

function insideRect(point: Vec2Like, rect: typeof RESTART_BUTTON_RECT): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

/**
 * One load of the "main" scene: the GameMaster script plus Unity's frame loop
 * (FixedUpdate + physics at 50 Hz in scaled time, Update every rendered frame, Destroy at end of frame).
 */
export class Level implements SceneContext, SubCounter, ImplodeSound, LevelView {
  time = 0;
  private fixedTime = 0;
  private pause: PauseState = "running";
  menu: MenuVisibility = "hidden";
  subsLeft = INITIAL_SUBS_LEFT;
  private spawnInterval = INITIAL_SPAWN_INTERVAL_SECONDS;
  private nextSpawnTime: number;
  private objects: GameObject[] = [];
  private pendingStart: GameObject[] = [];
  private king: King | null;
  private readonly physics = new PhysicsWorld();
  private readonly trekronor: Trekronor;
  private readonly musicChannel: AudioSourceChannel;
  private readonly startSoundChannel: AudioSourceChannel;

  constructor(
    private readonly input: KeyboardInput,
    audioContext: AudioContext,
    private readonly clips: AudioClipLibrary,
  ) {
    this.addSceneObject(new SpriteObject(BACKGROUND_SPRITE));
    this.addSceneObject(new SpriteObject(ARROWS_HINT_SPRITE));
    this.addSceneObject(new SpriteObject(SPACE_HINT_SPRITE));

    const zIndicator = new SpriteObject(Z_INDICATOR_SPRITE);
    zIndicator.activeState = "inactive";
    this.addSceneObject(zIndicator);

    const crowns = CROWN_SPRITES.map((crown) => new SpriteObject(crown));
    for (const crown of crowns) {
      this.addSceneObject(crown);
    }

    this.king = new King(this.physics, this, input, zIndicator, audioContext, clips);
    this.addSceneObject(this.king);

    this.trekronor = new Trekronor(crowns, this.king, this, audioContext, clips);
    this.addSceneObject(this.trekronor);

    for (const wallPosition of WALL_POSITIONS) {
      this.addSceneObject(new StaticCollider(this.physics, "Untagged", wallPosition, WALL_COLLIDER, "solid"));
    }
    this.addSceneObject(new StaticCollider(this.physics, "kungen", BORDER_POSITION, BORDER_COLLIDER, "trigger"));

    this.musicChannel = new AudioSourceChannel(audioContext, MUSIC_VOLUME, "loop");
    this.startSoundChannel = new AudioSourceChannel(audioContext, GAME_START_SOUND_VOLUME, "once");
    this.startSoundChannel.play(clips.clip("SpeletStartar"));
    this.musicChannel.playDelayed(clips.clip("DuringGame"), MUSIC_START_DELAY_SECONDS);

    this.nextSpawnTime = this.time + this.spawnInterval;
  }

  /** Time.timeScale as masterScript.Update sets it from the pause flag. */
  timeScale(): number {
    return this.pause === "paused" ? 0 : 1;
  }

  frame(unscaledDeltaTime: number): void {
    this.time += unscaledDeltaTime * this.timeScale();
    this.runPendingStarts();
    while (this.fixedTime + FIXED_DELTA_TIME <= this.time) {
      this.fixedTime += FIXED_DELTA_TIME;
      this.fixedUpdate();
      this.king?.syncBodyFromTransform();
      this.physics.step();
      for (const gameObject of this.objects) {
        gameObject.afterPhysicsStep();
      }
    }
    this.runPendingStarts();
    this.update();
    this.flushDestroyed();
  }

  clickAt(point: Vec2Like): ClickOutcome {
    if (this.menu === "shown" && insideRect(point, RESTART_BUTTON_RECT)) {
      return "restart-requested";
    }
    return "ignored";
  }

  dispose(): void {
    this.musicChannel.stop();
    this.startSoundChannel.stop();
    for (const gameObject of this.objects) {
      gameObject.onDestroyed();
    }
    this.objects = [];
  }

  visibleSprites(): readonly VisibleSprite[] {
    const visible: VisibleSprite[] = [];
    for (const gameObject of this.objects) {
      if (gameObject.activeState === "active" && gameObject.sprite !== null) {
        visible.push({ transform: gameObject.transform, sprite: gameObject.sprite });
      }
    }
    return visible.sort((a, b) => a.sprite.sortingOrder - b.sprite.sortingOrder);
  }

  instantiate(gameObject: GameObject): void {
    this.objects.push(gameObject);
    this.pendingStart.push(gameObject);
  }

  destroy(gameObject: GameObject): void {
    this.scheduleDestroy(gameObject, DESTROY_AT_END_OF_FRAME);
  }

  destroyAfter(gameObject: GameObject, delaySeconds: number): void {
    this.scheduleDestroy(gameObject, this.time + delaySeconds);
  }

  decreaseSubs(): void {
    this.subsLeft -= 1;
  }

  playImplode(): void {
    this.musicChannel.playOneShot(this.clips.clip("implode"));
  }

  private addSceneObject(gameObject: GameObject): void {
    this.objects.push(gameObject);
  }

  private scheduleDestroy(gameObject: GameObject, destroyAt: number): void {
    const current = gameObject.lifecycle;
    const earliest = current.type === "doomed" ? Math.min(current.destroyAt, destroyAt) : destroyAt;
    gameObject.lifecycle = { type: "doomed", destroyAt: earliest };
  }

  private runPendingStarts(): void {
    const starting = this.pendingStart;
    this.pendingStart = [];
    for (const gameObject of starting) {
      gameObject.start();
    }
  }

  private fixedUpdate(): void {
    if (this.fixedTime > this.nextSpawnTime) {
      this.spawnRussianSub();
      this.spawnInterval *= SPAWN_INTERVAL_MULTIPLIER;
      this.nextSpawnTime = this.fixedTime + this.spawnInterval;
    }
    for (const gameObject of this.objects) {
      gameObject.fixedUpdate();
    }
    if (this.king === null) {
      this.putinWins();
    }
  }

  private update(): void {
    for (const gameObject of this.objects) {
      gameObject.update();
    }
    if (this.input.getKeyUp("Escape")) {
      this.pause = togglePause(this.pause);
      this.menu = toggleMenu(this.menu);
    }
  }

  private spawnRussianSub(): void {
    const position = {
      x: GAME_MASTER_POSITION.x,
      y: GAME_MASTER_POSITION.y + randomRange(-SUB_SPAWN_Y_SPREAD, SUB_SPAWN_Y_SPREAD),
    };
    this.instantiate(new Sub(this.physics, position, this, this.trekronor, this));
  }

  private putinWins(): void {
    this.musicChannel.play(this.clips.clip("GameOver"));
    this.instantiate(
      new SpriteObject({
        sprite: "putinwins",
        position: { x: GAME_MASTER_POSITION.x + PUTIN_SPAWN_OFFSET.x, y: GAME_MASTER_POSITION.y + PUTIN_SPAWN_OFFSET.y },
        scale: 1,
        sortingOrder: PUTIN_SPRITE_SORTING_ORDER,
      }),
    );
    this.pause = togglePause(this.pause);
    this.menu = "shown";
  }

  private flushDestroyed(): void {
    const survivors: GameObject[] = [];
    for (const gameObject of this.objects) {
      if (gameObject.lifecycle.type === "doomed" && gameObject.lifecycle.destroyAt <= this.time) {
        gameObject.onDestroyed();
        if (gameObject === this.king) {
          this.king = null;
        }
      } else {
        survivors.push(gameObject);
      }
    }
    this.objects = survivors;
  }
}
