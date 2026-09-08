import { SpriteLibrary } from "./assets";
import { AudioClipLibrary } from "./audio";
import { KeyboardInput } from "./input";
import { Level } from "./level";
import { CanvasRenderer, START_BUTTON_RECT } from "./render";
import { MAXIMUM_DELTA_TIME, type ScreenRect, type Vec2Like } from "./unity-scene";

interface LoadedAssets {
  readonly sprites: SpriteLibrary;
  readonly clips: AudioClipLibrary;
}

type Phase =
  | { readonly type: "loading" }
  | { readonly type: "loading-failed"; readonly message: string }
  | { readonly type: "menu"; readonly assets: LoadedAssets }
  | { readonly type: "playing"; readonly assets: LoadedAssets; readonly level: Level };

function insideRect(point: Vec2Like, rect: ScreenRect): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

/** Browser shell around the Unity level: asset loading, the START screen, and the frame clock. */
export class Game {
  private phase: Phase = { type: "loading" };
  private readonly renderer: CanvasRenderer;
  private readonly input = new KeyboardInput(window);
  private readonly audioContext = new AudioContext();
  private lastFrameTimestamp: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new CanvasRenderer(canvas);
    canvas.addEventListener("click", (event) => this.onClick(this.renderer.toScreenPoint(event.clientX, event.clientY)));
    this.loadAssets();
  }

  start(): void {
    requestAnimationFrame((timestamp) => this.frame(timestamp));
  }

  private async loadAssets(): Promise<void> {
    try {
      const [sprites, clips] = await Promise.all([SpriteLibrary.load(), AudioClipLibrary.load(this.audioContext)]);
      this.phase = { type: "menu", assets: { sprites, clips } };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Game.loadAssets: ${message}`);
      this.phase = { type: "loading-failed", message };
    }
  }

  private frame(timestamp: number): void {
    const realDeltaTime = this.lastFrameTimestamp === null ? 0 : (timestamp - this.lastFrameTimestamp) / 1000;
    this.lastFrameTimestamp = timestamp;

    switch (this.phase.type) {
      case "loading":
        this.renderer.drawLoading("Loading...");
        break;
      case "loading-failed":
        this.renderer.drawLoading(`Failed to load: ${this.phase.message}`);
        break;
      case "menu":
        this.renderer.drawMenu();
        if (this.input.getKeyDown("Space")) {
          this.loadLevel(this.phase.assets);
        }
        break;
      case "playing":
        this.phase.level.frame(Math.min(realDeltaTime, MAXIMUM_DELTA_TIME));
        this.renderer.drawLevel(this.phase.level, this.phase.assets.sprites);
        break;
    }

    this.input.endFrame();
    requestAnimationFrame((next) => this.frame(next));
  }

  private onClick(point: Vec2Like): void {
    switch (this.phase.type) {
      case "menu":
        if (insideRect(point, START_BUTTON_RECT)) {
          this.loadLevel(this.phase.assets);
        }
        break;
      case "playing":
        if (this.phase.level.clickAt(point) === "restart-requested") {
          this.phase.level.dispose();
          this.loadLevel(this.phase.assets);
        }
        break;
      case "loading":
      case "loading-failed":
        break;
    }
  }

  /** Application.LoadLevel("main"): a fresh scene, fresh scripts, fresh audio. */
  private loadLevel(assets: LoadedAssets): void {
    void this.audioContext.resume();
    this.phase = { type: "playing", assets, level: new Level(this.input, this.audioContext, assets.clips) };
  }
}
