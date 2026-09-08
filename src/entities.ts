import { Vec2, type Body } from "planck";
import { AudioClipLibrary, AudioSourceChannel, type ClipName } from "./audio";
import { ibraConvexPieces } from "./ibra-collider";
import type { KeyboardInput } from "./input";
import { PhysicsWorld, type Collidable, type ColliderKind, type ColliderSpec, type ColliderTag, type RigidbodySpec } from "./physics";
import { randomElement, randomRange, randomRangeInt } from "./random";
import {
  BULLET_COLLIDER,
  BULLET_LIFETIME_SECONDS,
  BULLET_SPEED,
  HITS_UNTIL_KING_DIES,
  IBRA_COOLDOWN_FRAMES,
  IBRA_LIFETIME_SECONDS,
  IBRA_SCALE,
  IBRA_SPEED,
  IBRA_VOLUME,
  KING_ANGULAR_DRAG,
  KING_COLLIDER,
  KING_COMMENT_ROLL_HIT,
  KING_COMMENT_ROLL_RANGE,
  KING_COMMENT_VOLUME,
  KING_FIRE_OFFSET,
  KING_MASS,
  KING_MOVE_STEP_PER_FRAME,
  KING_SPRITE_SORTING_ORDER,
  KING_START_POSITION,
  LOSE_LIFE_VOLUME,
  SHOOT_COOLDOWN_FRAMES,
  SUB_ANGULAR_DRAG,
  SUB_BASE_SPEED,
  SUB_COLLIDER,
  SUB_LIFETIME_SECONDS,
  SUB_MASS,
  SUB_SPEED_VARIATION_MAX,
  SUB_SPEED_VARIATION_MIN,
  type SceneSprite,
  type Size2D,
  type SpriteName,
  type Vec2Like,
} from "./unity-scene";

export class Transform2D {
  constructor(
    public x: number,
    public y: number,
    public angle: number,
    public readonly scale: number,
  ) {}
}

export interface SpriteView {
  readonly sprite: SpriteName;
  readonly sortingOrder: number;
}

export type ActiveState = "active" | "inactive";

/**
 * Unity Destroy(obj, t): the object dies at the first delayed-call slot (after a physics step or after
 * Update) once Time.time has reached destroyAt; plain Destroy(obj) is the same call with t = 0.
 */
type Lifecycle = { readonly type: "alive" } | { readonly type: "doomed"; readonly destroyAt: number };

/** What scripts can ask of the scene they live in (Instantiate / Destroy). */
export interface SceneContext {
  instantiate(gameObject: GameObject): void;
  destroy(gameObject: GameObject): void;
  destroyAfter(gameObject: GameObject, delaySeconds: number): void;
}

export abstract class GameObject {
  private lifecycle: Lifecycle = { type: "alive" };
  activeState: ActiveState = "active";

  constructor(
    readonly transform: Transform2D,
    readonly sprite: SpriteView | null,
  ) {}

  /** Several Destroy calls on one object: the earliest deadline wins. */
  scheduleDestroy(destroyAt: number): void {
    const earliest = this.lifecycle.type === "doomed" ? Math.min(this.lifecycle.destroyAt, destroyAt) : destroyAt;
    this.lifecycle = { type: "doomed", destroyAt: earliest };
  }

  isDestroyDue(time: number): boolean {
    return this.lifecycle.type === "doomed" && this.lifecycle.destroyAt <= time;
  }

  /** Unity Start: runs once, in the delayed-call slot right after the phase that instantiated the object. */
  start(): void {}
  update(): void {}
  fixedUpdate(): void {}
  afterPhysicsStep(): void {}
  onDestroyed(): void {}
}

export class SpriteObject extends GameObject {
  constructor(sceneSprite: SceneSprite) {
    super(
      new Transform2D(sceneSprite.position.x, sceneSprite.position.y, 0, sceneSprite.scale),
      { sprite: sceneSprite.sprite, sortingOrder: sceneSprite.sortingOrder },
    );
  }
}

export abstract class PhysicsGameObject extends GameObject implements Collidable {
  abstract readonly tag: ColliderTag;
  readonly body: Body;

  constructor(
    protected readonly physics: PhysicsWorld,
    transform: Transform2D,
    sprite: SpriteView | null,
    rigidbody: RigidbodySpec,
    colliders: readonly ColliderSpec[],
  ) {
    super(transform, sprite);
    this.body = physics.addBody({ owner: this, rigidbody, position: transform, angle: transform.angle, colliders });
  }

  onTriggerEnter2D(_other: Collidable): void {}

  override afterPhysicsStep(): void {
    const position = this.body.getPosition();
    this.transform.x = position.x;
    this.transform.y = position.y;
    this.transform.angle = this.body.getAngle();
  }

  override onDestroyed(): void {
    this.physics.removeBody(this.body);
  }

  /** transform.right: the local +x axis in world space. */
  protected rightVector(): Vec2 {
    return new Vec2(Math.cos(this.transform.angle), Math.sin(this.transform.angle));
  }
}

export class StaticCollider extends PhysicsGameObject {
  constructor(
    physics: PhysicsWorld,
    readonly tag: ColliderTag,
    position: Vec2Like,
    size: Size2D,
    kind: ColliderKind,
  ) {
    super(physics, new Transform2D(position.x, position.y, 0, 1), null, { type: "static" }, [{ shape: "box", size, kind }]);
  }
}

export interface SubCounter {
  decreaseSubs(): void;
}

export interface ImplodeSound {
  playImplode(): void;
}

const LOSE_LIFE_CLIPS: readonly ClipName[] = ["LoseLife1", "LoseLife2"];

/** deActivate.js hides child number `hits`; once every child is hidden, GetChild throws and unwinds the caller too. */
export type DeactivateOutcome = "crown-hidden" | "threw-child-out-of-bounds";

/** Trekronor: the crown sprites in the corner, one hidden per hit; the third hit kills the king (deActivate.js). */
export class Trekronor extends GameObject {
  private hits = 0;
  private readonly loseLifeChannel: AudioSourceChannel;

  constructor(
    private readonly crowns: readonly GameObject[],
    private readonly king: King,
    private readonly context: SceneContext,
    audioContext: AudioContext,
    private readonly clips: AudioClipLibrary,
  ) {
    super(new Transform2D(0.66769, 2.6268, 0, 1), null);
    this.loseLifeChannel = new AudioSourceChannel(audioContext, LOSE_LIFE_VOLUME, "once");
  }

  deActivate(): DeactivateOutcome {
    this.loseLifeChannel.play(this.clips.clip(randomElement(LOSE_LIFE_CLIPS)));
    if (this.hits >= this.crowns.length) {
      return "threw-child-out-of-bounds";
    }
    this.crowns[this.hits].activeState = "inactive";
    this.hits += 1;
    if (this.hits === HITS_UNTIL_KING_DIES) {
      this.context.destroy(this.king);
    }
    return "crown-hidden";
  }

  override onDestroyed(): void {
    this.loseLifeChannel.stop();
  }
}

/** Russian sub (sub.prefab + moveForward.js + dieOnCollision.js). */
export class Sub extends PhysicsGameObject {
  readonly tag = "Untagged";

  constructor(
    physics: PhysicsWorld,
    position: Vec2Like,
    private readonly context: SceneContext,
    private readonly trekronor: Trekronor,
    private readonly master: SubCounter & ImplodeSound,
  ) {
    super(
      physics,
      new Transform2D(position.x, position.y, 0, 1),
      { sprite: "sub", sortingOrder: 0 },
      { type: "dynamic", mass: SUB_MASS, angularDrag: SUB_ANGULAR_DRAG },
      [{ shape: "box", size: SUB_COLLIDER, kind: "solid" }],
    );
  }

  override start(): void {
    const speed = SUB_BASE_SPEED + randomRange(SUB_SPEED_VARIATION_MIN, SUB_SPEED_VARIATION_MAX);
    this.body.setLinearVelocity(this.rightVector().neg().mul(speed));
    this.context.destroyAfter(this, SUB_LIFETIME_SECONDS);
  }

  override onTriggerEnter2D(other: Collidable): void {
    switch (other.tag) {
      case "kungen":
        if (this.trekronor.deActivate() === "threw-child-out-of-bounds") {
          // The exception unwinds dieOnCollision.OnTriggerEnter2D: no decreaseSubs, no Destroy.
          return;
        }
        this.master.decreaseSubs();
        this.context.destroy(this);
        break;
      case "boat90":
        this.master.playImplode();
        this.master.decreaseSubs();
        this.context.destroy(this);
        break;
      case "Untagged":
        break;
    }
  }
}

/** The king's shot (booat90.prefab + boat90.js): a kinematic trigger that keeps flying through everything it kills. */
export class Bullet extends PhysicsGameObject {
  readonly tag = "boat90";

  constructor(
    physics: PhysicsWorld,
    position: Vec2Like,
    angle: number,
    private readonly context: SceneContext,
  ) {
    super(
      physics,
      new Transform2D(position.x, position.y, angle, 1),
      { sprite: "booat90", sortingOrder: 0 },
      { type: "kinematic" },
      [{ shape: "box", size: BULLET_COLLIDER, kind: "trigger" }],
    );
  }

  override start(): void {
    this.body.setLinearVelocity(this.rightVector().mul(BULLET_SPEED));
    this.context.destroyAfter(this, BULLET_LIFETIME_SECONDS);
  }
}

const ZLATAN_CLIPS: readonly ClipName[] = ["ZlatanFlyger1", "ZlatanFlyger2"];

/** Ibrahimovic.prefab + boat90.js + SoundZlatan.js: a huge flying trigger shaped like Zlatan. */
export class Ibra extends PhysicsGameObject {
  readonly tag = "boat90";
  private readonly zlatanChannel: AudioSourceChannel;

  constructor(
    physics: PhysicsWorld,
    position: Vec2Like,
    angle: number,
    private readonly context: SceneContext,
    audioContext: AudioContext,
    private readonly clips: AudioClipLibrary,
  ) {
    super(
      physics,
      new Transform2D(position.x, position.y, angle, IBRA_SCALE),
      { sprite: "ibrahimovic", sortingOrder: 0 },
      { type: "kinematic" },
      [{ shape: "convex-pieces", pieces: ibraConvexPieces(IBRA_SCALE), kind: "trigger" }],
    );
    this.zlatanChannel = new AudioSourceChannel(audioContext, IBRA_VOLUME, "once");
  }

  override start(): void {
    this.body.setLinearVelocity(this.rightVector().mul(IBRA_SPEED));
    this.context.destroyAfter(this, IBRA_LIFETIME_SECONDS);
    this.zlatanChannel.play(this.clips.clip(randomElement(ZLATAN_CLIPS)));
  }

  override onDestroyed(): void {
    this.zlatanChannel.stop();
    super.onDestroyed();
  }
}

const KING_COMMENT_CLIPS: readonly ClipName[] = [
  "Naturligt",
  "Island",
  "Tack",
  "Trevligt",
  "upphetsad",
  "KungenKommentar1",
  "KungenKommentar2",
];

type TransformSync = "in-sync" | "moved-by-script";

/** kungen: a dynamic body steered by rewriting its Transform every frame (updownshoot.js + soundsKungen.js). */
export class King extends PhysicsGameObject {
  readonly tag = "kungen";
  private shootTimer = 0;
  private ibraTimer = 0;
  private transformSync: TransformSync = "in-sync";
  private readonly commentChannel: AudioSourceChannel;

  constructor(
    physics: PhysicsWorld,
    private readonly context: SceneContext,
    private readonly input: KeyboardInput,
    private readonly zIndicator: GameObject,
    private readonly audioContext: AudioContext,
    private readonly clips: AudioClipLibrary,
  ) {
    super(
      physics,
      new Transform2D(KING_START_POSITION.x, KING_START_POSITION.y, 0, 1),
      { sprite: "kungen", sortingOrder: KING_SPRITE_SORTING_ORDER },
      { type: "dynamic", mass: KING_MASS, angularDrag: KING_ANGULAR_DRAG },
      [
        { shape: "box", size: KING_COLLIDER, kind: "trigger" },
        { shape: "box", size: KING_COLLIDER, kind: "solid" },
      ],
    );
    this.commentChannel = new AudioSourceChannel(audioContext, KING_COMMENT_VOLUME, "once");
  }

  override update(): void {
    if (this.input.getKey("ArrowUp")) {
      this.transform.y += KING_MOVE_STEP_PER_FRAME;
      this.transformSync = "moved-by-script";
    } else if (this.input.getKey("ArrowDown")) {
      this.transform.y -= KING_MOVE_STEP_PER_FRAME;
      this.transformSync = "moved-by-script";
    }
    if (this.input.getKeyDown("Space") && this.shootTimer > SHOOT_COOLDOWN_FRAMES) {
      this.fireBoat();
      this.shootTimer = 0;
    }
    if (this.ibraTimer > IBRA_COOLDOWN_FRAMES) {
      this.zIndicator.activeState = "active";
      if (this.input.getKeyDown("KeyZ")) {
        this.fireIbra();
        this.ibraTimer = 0;
      }
    }
    this.shootTimer += 1;
    this.ibraTimer += 1;
  }

  /** Unity copies a script-edited Transform into Box2D before the next physics step; velocity survives. */
  syncBodyFromTransform(): void {
    if (this.transformSync === "in-sync") {
      return;
    }
    this.body.setTransform(new Vec2(this.transform.x, this.transform.y), this.body.getAngle());
    this.transformSync = "in-sync";
  }

  override afterPhysicsStep(): void {
    super.afterPhysicsStep();
    this.transformSync = "in-sync";
  }

  override fixedUpdate(): void {
    if (randomRangeInt(0, KING_COMMENT_ROLL_RANGE) === KING_COMMENT_ROLL_HIT && !this.commentChannel.isPlaying) {
      this.commentChannel.play(this.clips.clip(randomElement(KING_COMMENT_CLIPS)));
    }
  }

  override onDestroyed(): void {
    this.commentChannel.stop();
    super.onDestroyed();
  }

  private firePosition(): Vec2Like {
    return { x: this.transform.x + KING_FIRE_OFFSET.x, y: this.transform.y + KING_FIRE_OFFSET.y };
  }

  private fireBoat(): void {
    this.context.instantiate(new Bullet(this.physics, this.firePosition(), this.transform.angle, this.context));
  }

  private fireIbra(): void {
    this.context.instantiate(
      new Ibra(this.physics, this.firePosition(), this.transform.angle, this.context, this.audioContext, this.clips),
    );
    this.zIndicator.activeState = "inactive";
  }
}
