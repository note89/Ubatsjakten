import type { SpriteLibrary } from "./assets";
import type { LevelView } from "./level";
import {
  CAMERA_BACKGROUND_COLOR,
  CAMERA_ORTHOGRAPHIC_SIZE,
  PIXELS_PER_UNIT,
  RESTART_BUTTON_RECT,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  SUBS_LEFT_LABEL_FONT_PX,
  SUBS_LEFT_LABEL_TOP_PX,
  type ScreenRect,
  type Vec2Like,
} from "./unity-scene";

/** Screen pixels per world unit for a 720 px tall orthographic view of size 3.47. */
const SCREEN_PX_PER_UNIT = SCREEN_HEIGHT / (2 * CAMERA_ORTHOGRAPHIC_SIZE);

/** Unity's built-in IMGUI font. */
const GUI_FONT_FAMILY = "Arial";
const GUI_LABEL_COLOR = "#000000";
const GUI_LABEL_HIGHLIGHT_COLOR = "#ffff00";
const GUI_BUTTON_FONT_PX = 13;
const GUI_BUTTON_FILL = "#4a4a4a";
const GUI_BUTTON_BORDER = "#242424";
const GUI_BUTTON_TEXT = "#e6e6e6";
const GUI_BUTTON_CORNER_RADIUS = 5;
const LETTERBOX_COLOR = "#000000";

export const START_BUTTON_RECT: ScreenRect = {
  x: SCREEN_WIDTH / 2 - 220,
  y: SCREEN_HEIGHT / 2 + 100,
  width: 440,
  height: 90,
};

interface Viewport {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly scale: number;
}

/** Draws the fixed 1280×720 Unity window letterboxed into whatever size the browser canvas has. */
export class CanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private viewport: Viewport = { offsetX: 0, offsetY: 0, scale: 1 };

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (ctx === null) {
      throw new Error("CanvasRenderer: 2d context unavailable");
    }
    this.ctx = ctx;
    this.fitToWindow();
    window.addEventListener("resize", () => this.fitToWindow());
  }

  /** Browser client coordinates → Unity screen pixels (origin top-left of the 1280×720 window). */
  toScreenPoint(clientX: number, clientY: number): Vec2Like {
    const bounds = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - bounds.left - this.viewport.offsetX) / this.viewport.scale,
      y: (clientY - bounds.top - this.viewport.offsetY) / this.viewport.scale,
    };
  }

  drawLevel(level: LevelView, sprites: SpriteLibrary): void {
    this.beginWindow();
    this.ctx.fillStyle = CAMERA_BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    for (const { transform, sprite } of level.visibleSprites()) {
      const image = sprites.image(sprite.sprite);
      const width = (image.naturalWidth / PIXELS_PER_UNIT) * transform.scale * SCREEN_PX_PER_UNIT;
      const height = (image.naturalHeight / PIXELS_PER_UNIT) * transform.scale * SCREEN_PX_PER_UNIT;
      this.ctx.save();
      this.ctx.translate(SCREEN_WIDTH / 2 + transform.x * SCREEN_PX_PER_UNIT, SCREEN_HEIGHT / 2 - transform.y * SCREEN_PX_PER_UNIT);
      this.ctx.rotate(-transform.angle);
      this.ctx.drawImage(image, -width / 2, -height / 2, width, height);
      this.ctx.restore();
    }

    this.drawSubsLeftLabel(level.subsLeft);
    if (level.menu === "shown") {
      this.drawButton(RESTART_BUTTON_RECT, "Restart Game");
    }
    this.ctx.restore();
  }

  drawLoading(message: string): void {
    this.beginWindow();
    this.ctx.fillStyle = "rgba(0,0,0,0.8)";
    this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "bold 48px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "alphabetic";
    this.ctx.fillText("UBÅTSJAKTEN", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50);
    this.ctx.font = "24px Arial";
    this.ctx.fillText(message, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 50);
    this.ctx.restore();
  }

  drawMenu(): void {
    this.beginWindow();
    this.ctx.fillStyle = "rgba(0,0,0,0.7)";
    this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "bold 60px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "alphabetic";
    this.ctx.fillText("UBÅTSJAKTEN", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 100);
    this.ctx.font = "24px Arial";
    this.ctx.fillText("↑/↓ Move | SPACE Shoot | Z Zlatan | ESC Pause", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 50);

    const { x, y, width, height } = START_BUTTON_RECT;
    const cornerRadius = 25;

    this.ctx.fillStyle = "rgba(0,0,0,0.5)";
    this.roundRect(x + 6, y + 8, width, height, cornerRadius);
    this.ctx.fill();

    this.ctx.strokeStyle = "rgba(0,0,0,0.3)";
    this.ctx.lineWidth = 6;
    this.roundRect(x - 2, y - 2, width + 4, height + 4, cornerRadius + 2);
    this.ctx.stroke();

    const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, "#FFD700");
    gradient.addColorStop(0.45, "#FFA500");
    gradient.addColorStop(1, "#0066FF");
    this.ctx.fillStyle = gradient;
    this.roundRect(x, y, width, height, cornerRadius);
    this.ctx.fill();

    this.ctx.strokeStyle = "#FFE44D";
    this.ctx.lineWidth = 5;
    this.roundRect(x, y, width, height, cornerRadius);
    this.ctx.stroke();

    const highlight = this.ctx.createLinearGradient(x, y, x, y + height * 0.4);
    highlight.addColorStop(0, "rgba(255,255,255,0.4)");
    highlight.addColorStop(1, "rgba(255,255,255,0)");
    this.ctx.fillStyle = highlight;
    this.roundRect(x + 5, y + 5, width - 10, height * 0.35, cornerRadius - 3);
    this.ctx.fill();

    this.ctx.font = "bold 48px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "rgba(0,0,0,0.4)";
    this.ctx.fillText("▶ START GAME", SCREEN_WIDTH / 2 + 2, y + 65);
    this.ctx.fillStyle = "#fff";
    this.ctx.shadowColor = "rgba(0,0,0,0.5)";
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    this.ctx.fillText("▶ START GAME", SCREEN_WIDTH / 2, y + 63);
    this.ctx.shadowColor = "transparent";

    this.ctx.fillStyle = "#cccccc";
    this.ctx.font = "16px Arial";
    this.ctx.fillText("(Or press SPACE)", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 210);
    this.ctx.restore();
  }

  private fitToWindow(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    const scale = Math.min(this.canvas.width / SCREEN_WIDTH, this.canvas.height / SCREEN_HEIGHT);
    this.viewport = {
      scale,
      offsetX: (this.canvas.width - SCREEN_WIDTH * scale) / 2,
      offsetY: (this.canvas.height - SCREEN_HEIGHT * scale) / 2,
    };
  }

  /** Clears the letterbox and maps drawing to Unity screen pixels; pair with ctx.restore(). */
  private beginWindow(): void {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = LETTERBOX_COLOR;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.setTransform(this.viewport.scale, 0, 0, this.viewport.scale, this.viewport.offsetX, this.viewport.offsetY);
    this.ctx.beginPath();
    this.ctx.rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    this.ctx.clip();
  }

  /** GUI.Label(Rect(Screen.width/2-50, 10, 100, 100), "<size=30>Ubåtar kvar: <color=yellow>N</color></size>") with UpperCenter alignment. */
  private drawSubsLeftLabel(subsLeft: number): void {
    const prefix = "Ubåtar kvar: ";
    const count = String(subsLeft);
    this.ctx.font = `${SUBS_LEFT_LABEL_FONT_PX}px ${GUI_FONT_FAMILY}`;
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "top";
    const prefixWidth = this.ctx.measureText(prefix).width;
    const totalWidth = prefixWidth + this.ctx.measureText(count).width;
    const left = SCREEN_WIDTH / 2 - totalWidth / 2;
    this.ctx.fillStyle = GUI_LABEL_COLOR;
    this.ctx.fillText(prefix, left, SUBS_LEFT_LABEL_TOP_PX);
    this.ctx.fillStyle = GUI_LABEL_HIGHLIGHT_COLOR;
    this.ctx.fillText(count, left + prefixWidth, SUBS_LEFT_LABEL_TOP_PX);
  }

  private drawButton(rect: ScreenRect, label: string): void {
    this.ctx.fillStyle = GUI_BUTTON_FILL;
    this.roundRect(rect.x, rect.y, rect.width, rect.height, GUI_BUTTON_CORNER_RADIUS);
    this.ctx.fill();
    this.ctx.strokeStyle = GUI_BUTTON_BORDER;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    this.ctx.fillStyle = GUI_BUTTON_TEXT;
    this.ctx.font = `${GUI_BUTTON_FONT_PX}px ${GUI_FONT_FAMILY}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(label, rect.x + rect.width / 2, rect.y + rect.height / 2);
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }
}
