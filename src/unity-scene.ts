// Every number in this file was decoded from the original Unity 4.5 project
// (Assets/main.unity, Assets/prefabs/*.prefab, ProjectSettings/*.asset).
// UNITY_SCENE_SOURCE: keep this file the single home for those values.

export interface Vec2Like {
  readonly x: number;
  readonly y: number;
}

export interface Size2D {
  readonly width: number;
  readonly height: number;
}

export interface ScreenRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

// TimeManager.asset
export const FIXED_DELTA_TIME = 0.02;
export const MAXIMUM_DELTA_TIME = 1 / 3;
/** Time.timeScale when the player starts; the value is engine-global and survives Application.LoadLevel. */
export const INITIAL_TIME_SCALE = 1;

// PlayerSettings.asset: default standalone window, not resizable
export const SCREEN_WIDTH = 1280;
export const SCREEN_HEIGHT = 720;

// Main Camera
export const CAMERA_ORTHOGRAPHIC_SIZE = 3.47;
export const CAMERA_BACKGROUND_COLOR = "rgb(49, 77, 121)";

// Sprite import settings: every sprite uses 100 pixels per unit, center pivot
export const PIXELS_PER_UNIT = 100;

export type SpriteName =
  | "background"
  | "kungen"
  | "sub"
  | "booat90"
  | "ibrahimovic"
  | "putinwins"
  | "treFull"
  | "tretwo"
  | "treett"
  | "trerussia"
  | "z"
  | "arrows"
  | "spaceText";

export const SPRITE_FILES: Readonly<Record<SpriteName, string>> = {
  background: "background.png",
  kungen: "kungen.png",
  sub: "sub.png",
  booat90: "booat90.png",
  ibrahimovic: "Ibrahimovic.png",
  putinwins: "putinwins.png",
  treFull: "treFull.png",
  tretwo: "tretwo.png",
  treett: "treett.png",
  trerussia: "trerussia.png",
  z: "z.png",
  arrows: "arrows.png",
  spaceText: "space-text.png",
};

export interface SceneSprite {
  readonly sprite: SpriteName;
  readonly position: Vec2Like;
  readonly scale: number;
  readonly sortingOrder: number;
}

export const BACKGROUND_SPRITE: SceneSprite = {
  sprite: "background",
  position: { x: -0.05889, y: -0.05429 },
  scale: 1.1,
  sortingOrder: -10,
};

export const ARROWS_HINT_SPRITE: SceneSprite = {
  sprite: "arrows",
  position: { x: -4.00266, y: 2.5141 },
  scale: 0.5,
  sortingOrder: -1,
};

export const SPACE_HINT_SPRITE: SceneSprite = {
  sprite: "spaceText",
  position: { x: -2.69691, y: 2.51357 },
  scale: 0.5,
  sortingOrder: -1,
};

// GameMaster child 0: hidden until Ibra is ready
export const Z_INDICATOR_SPRITE: SceneSprite = {
  sprite: "z",
  position: { x: -1.47862, y: 2.52509 },
  scale: 0.1,
  sortingOrder: 0,
};

// Trekronor children, in child order (deActivate.js hides child i on hit i)
const CROWN_POSITION: Vec2Like = { x: -5.27187, y: 2.53462 };
export const CROWN_SPRITES: readonly SceneSprite[] = [
  { sprite: "treFull", position: CROWN_POSITION, scale: 1, sortingOrder: 3 },
  { sprite: "tretwo", position: CROWN_POSITION, scale: 1, sortingOrder: 2 },
  { sprite: "treett", position: CROWN_POSITION, scale: 1, sortingOrder: 1 },
  { sprite: "trerussia", position: CROWN_POSITION, scale: 1, sortingOrder: 0 },
];
export const HITS_UNTIL_KING_DIES = 3;
export const LOSE_LIFE_VOLUME = 0.218;

// kungen (scene object + updownshoot.js + soundsKungen.js)
export const KING_START_POSITION: Vec2Like = { x: -4.35339, y: 0.37661 };
export const KING_COLLIDER: Size2D = { width: 3.37, height: 2.2 };
export const KING_MASS = 1;
export const KING_ANGULAR_DRAG = 0.05;
export const KING_MOVE_STEP_PER_FRAME = 0.08;
export const KING_FIRE_OFFSET: Vec2Like = { x: 1.5, y: 0 };
export const SHOOT_COOLDOWN_FRAMES = 20;
export const IBRA_COOLDOWN_FRAMES = SHOOT_COOLDOWN_FRAMES * 20;
export const KING_COMMENT_VOLUME = 0.279;
export const KING_COMMENT_ROLL_RANGE = 600;
export const KING_COMMENT_ROLL_HIT = 50;
export const KING_SPRITE_SORTING_ORDER = 0;

// GameMaster transform: subs spawn here, Putin appears 6 units to its left
export const GAME_MASTER_POSITION: Vec2Like = { x: 5.93956, y: 0.09218 };

// sub.prefab + moveForward.js
export const SUB_SPAWN_Y_SPREAD = 2.8;
export const SUB_COLLIDER: Size2D = { width: 2.01, height: 0.72 };
export const SUB_MASS = 1;
export const SUB_ANGULAR_DRAG = 0.05;
export const SUB_BASE_SPEED = 2;
export const SUB_SPEED_VARIATION_MIN = -1.3;
export const SUB_SPEED_VARIATION_MAX = 2.4;
export const SUB_LIFETIME_SECONDS = 14;

// booat90.prefab + boat90.js
export const BULLET_COLLIDER: Size2D = { width: 1.19, height: 0.34 };
export const BULLET_SPEED = 6;
export const BULLET_LIFETIME_SECONDS = 5;

// Ibrahimovic.prefab + boat90.js + SoundZlatan.js
export const IBRA_SCALE = 2;
export const IBRA_SPEED = 10;
export const IBRA_LIFETIME_SECONDS = 5;
export const IBRA_VOLUME = 0.566;

// Gränsen: static trigger tagged "kungen" at the left edge
export const BORDER_POSITION: Vec2Like = { x: -7.28587, y: -0.25315 };
export const BORDER_COLLIDER: Size2D = { width: 1, height: 10 };

// Two static "Collider" objects above and below the play field
export const WALL_COLLIDER: Size2D = { width: 15, height: 1 };
export const WALL_POSITIONS: readonly Vec2Like[] = [
  { x: -0.04603, y: 3.94369 },
  { x: -0.04603, y: -4.04313 },
];

// GameMaster (masterScript.js + audioMaster.js + audioSub.js)
export const INITIAL_SPAWN_INTERVAL_SECONDS = 1.0;
export const SPAWN_INTERVAL_MULTIPLIER = 0.99;
export const INITIAL_SUBS_LEFT = 100000;
export const PUTIN_SPAWN_OFFSET: Vec2Like = { x: -6, y: 0 };
export const PUTIN_SPRITE_SORTING_ORDER = 0;
export const MUSIC_VOLUME = 0.201;
export const MUSIC_START_DELAY_SECONDS = 1;
export const GAME_START_SOUND_VOLUME = 0.504;

// Physics2DSettings.asset
export const GRAVITY: Vec2Like = { x: 0, y: -9.81 };
export const VELOCITY_ITERATIONS = 8;
export const POSITION_ITERATIONS = 3;
export const DEFAULT_FRICTION = 0.4;
export const DEFAULT_RESTITUTION = 0;
export const MAX_ROTATION_SPEED_DEGREES_PER_SECOND = 360;
/** Box2D's linear slop; Unity 4.5 exposes it as "Min Penetration For Penalty". */
export const MIN_PENETRATION_FOR_PENALTY = 0.01;

// OnGUI (masterScript.js)
export const SUBS_LEFT_LABEL_FONT_PX = 30;
export const SUBS_LEFT_LABEL_TOP_PX = 10;
export const RESTART_BUTTON_RECT: ScreenRect = {
  x: (SCREEN_WIDTH - SCREEN_WIDTH * 0.4) * 0.5,
  y: SCREEN_HEIGHT * 0.7,
  width: SCREEN_WIDTH * 0.4,
  height: SCREEN_HEIGHT * 0.15,
};
