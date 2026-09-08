import { Box, Polygon, Settings, Vec2, World, type Body, type Contact, type Fixture, type Shape } from "planck";
import type { ConvexPiece } from "./ibra-collider";
import {
  DEFAULT_FRICTION,
  DEFAULT_RESTITUTION,
  FIXED_DELTA_TIME,
  GRAVITY,
  MAX_ROTATION_SPEED_DEGREES_PER_SECOND,
  MIN_PENETRATION_FOR_PENALTY,
  POSITION_ITERATIONS,
  VELOCITY_ITERATIONS,
  type Size2D,
  type Vec2Like,
} from "./unity-scene";

/** Unity GameObject tag as read by dieOnCollision.js. */
export type ColliderTag = "kungen" | "boat90" | "Untagged";

/** What Unity calls a GameObject with a Collider2D: receives OnTriggerEnter2D. */
export interface Collidable {
  readonly tag: ColliderTag;
  onTriggerEnter2D(other: Collidable): void;
}

export type ColliderKind = "solid" | "trigger";

export type ColliderSpec =
  | { readonly shape: "box"; readonly size: Size2D; readonly kind: ColliderKind }
  | { readonly shape: "convex-pieces"; readonly pieces: readonly ConvexPiece[]; readonly kind: ColliderKind };

/** Rigidbody2D settings that matter per body type (mass and drag only exist for dynamic bodies). */
export type RigidbodySpec =
  | { readonly type: "dynamic"; readonly mass: number; readonly angularDrag: number }
  | { readonly type: "kinematic" }
  | { readonly type: "static" };

export interface BodySpec {
  readonly owner: Collidable;
  readonly rigidbody: RigidbodySpec;
  readonly position: Vec2Like;
  readonly angle: number;
  readonly colliders: readonly ColliderSpec[];
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function polygonArea(points: readonly Vec2Like[]): number {
  let twiceArea = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    twiceArea += a.x * b.y - b.x * a.y;
  }
  return Math.abs(twiceArea) / 2;
}

function colliderArea(collider: ColliderSpec): number {
  switch (collider.shape) {
    case "box":
      return collider.size.width * collider.size.height;
    case "convex-pieces":
      return collider.pieces.reduce((sum, piece) => sum + polygonArea(piece), 0);
  }
}

function colliderShapes(collider: ColliderSpec): readonly Shape[] {
  switch (collider.shape) {
    case "box":
      return [new Box(collider.size.width / 2, collider.size.height / 2)];
    case "convex-pieces":
      return collider.pieces.map((piece) => new Polygon(piece.map((p) => new Vec2(p.x, p.y))));
  }
}

/** Identifies one Unity Collider2D; a concave polygon collider spans several Box2D fixtures. */
type ColliderId = number;

function colliderPairKey(a: ColliderId, b: ColliderId): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

/**
 * Box2D 2.3 through planck, configured like Unity 4.5's Physics2D. Trigger contacts are queued
 * during the step and delivered as OnTriggerEnter2D to both GameObjects afterwards, like Unity does.
 * Unity reports one enter per Collider2D pair, so fixture contacts are counted per collider pair.
 */
export class PhysicsWorld {
  private readonly world: World;
  private readonly owners = new WeakMap<Body, Collidable>();
  private readonly colliderIds = new WeakMap<Fixture, ColliderId>();
  private nextColliderId: ColliderId = 1;
  private readonly touchingFixturesPerColliderPair = new Map<string, number>();
  private pendingTriggerPairs: Array<readonly [Collidable, Collidable]> = [];

  constructor() {
    Settings.maxRotation = degreesToRadians(MAX_ROTATION_SPEED_DEGREES_PER_SECOND) * FIXED_DELTA_TIME;
    Settings.linearSlop = MIN_PENETRATION_FOR_PENALTY;
    this.world = new World({ gravity: new Vec2(GRAVITY.x, GRAVITY.y) });
    this.world.on("begin-contact", (contact) => this.onBeginContact(contact));
    this.world.on("end-contact", (contact) => this.onEndContact(contact));
  }

  addBody(spec: BodySpec): Body {
    const body = this.world.createBody({
      type: spec.rigidbody.type,
      position: new Vec2(spec.position.x, spec.position.y),
      angle: spec.angle,
      linearDamping: 0,
      angularDamping: spec.rigidbody.type === "dynamic" ? spec.rigidbody.angularDrag : 0,
      gravityScale: 0,
      allowSleep: true,
      awake: true,
    });
    // Unity spreads Rigidbody2D.mass evenly over every collider on the body.
    const totalArea = spec.colliders.reduce((sum, collider) => sum + colliderArea(collider), 0);
    const density = spec.rigidbody.type === "dynamic" ? spec.rigidbody.mass / totalArea : 0;
    for (const collider of spec.colliders) {
      const colliderId = this.nextColliderId++;
      for (const shape of colliderShapes(collider)) {
        const fixture = body.createFixture({
          shape,
          density,
          friction: DEFAULT_FRICTION,
          restitution: DEFAULT_RESTITUTION,
          isSensor: collider.kind === "trigger",
        });
        this.colliderIds.set(fixture, colliderId);
      }
    }
    this.owners.set(body, spec.owner);
    return body;
  }

  removeBody(body: Body): void {
    this.world.destroyBody(body);
  }

  step(): void {
    this.world.step(FIXED_DELTA_TIME, VELOCITY_ITERATIONS, POSITION_ITERATIONS);
    const pairs = this.pendingTriggerPairs;
    this.pendingTriggerPairs = [];
    for (const [a, b] of pairs) {
      a.onTriggerEnter2D(b);
      b.onTriggerEnter2D(a);
    }
  }

  private onBeginContact(contact: Contact): void {
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();
    if (!fixtureA.isSensor() && !fixtureB.isSensor()) {
      return;
    }
    const key = colliderPairKey(this.colliderIdOf(fixtureA), this.colliderIdOf(fixtureB));
    const touchingBefore = this.touchingFixturesPerColliderPair.get(key) ?? 0;
    this.touchingFixturesPerColliderPair.set(key, touchingBefore + 1);
    if (touchingBefore === 0) {
      this.pendingTriggerPairs.push([this.ownerOf(fixtureA.getBody()), this.ownerOf(fixtureB.getBody())]);
    }
  }

  private onEndContact(contact: Contact): void {
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();
    if (!fixtureA.isSensor() && !fixtureB.isSensor()) {
      return;
    }
    const key = colliderPairKey(this.colliderIdOf(fixtureA), this.colliderIdOf(fixtureB));
    const touchingBefore = this.touchingFixturesPerColliderPair.get(key) ?? 0;
    if (touchingBefore <= 1) {
      this.touchingFixturesPerColliderPair.delete(key);
    } else {
      this.touchingFixturesPerColliderPair.set(key, touchingBefore - 1);
    }
  }

  private colliderIdOf(fixture: Fixture): ColliderId {
    const id = this.colliderIds.get(fixture);
    if (id === undefined) {
      throw new Error("PhysicsWorld.colliderIdOf: fixture was not created through addBody");
    }
    return id;
  }

  private ownerOf(body: Body): Collidable {
    const owner = this.owners.get(body);
    if (owner === undefined) {
      throw new Error("PhysicsWorld.ownerOf: body was not created through addBody");
    }
    return owner;
  }
}
