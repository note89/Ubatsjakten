const imageCache: Map<string, HTMLImageElement> = new Map();

const loadImage = (src: string): HTMLImageElement => {
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }
  const img = new Image();
  img.src = src;
  imageCache.set(src, img);
  return img;
};

export class Player {
  x: number;
  y: number;
  width: number;
  height: number;
  moveUpActive = false;
  moveDownActive = false;
  moveSpeed = 5;
  alive = true;
  private lastShotTime = 0;
  private shootCooldown = 300;
  private image: HTMLImageElement;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.image = loadImage("/assets/sprites/kungen.png");
  }

  moveUp() {
    this.moveUpActive = true;
  }

  stopMoveUp() {
    this.moveUpActive = false;
  }

  moveDown() {
    this.moveDownActive = true;
  }

  stopMoveDown() {
    this.moveDownActive = false;
  }

  shoot(): Bullet | null {
    const now = Date.now();
    if (now - this.lastShotTime > this.shootCooldown) {
      this.lastShotTime = now;
      return new Bullet(this.x + this.width, this.y + this.height / 2, 40, 20);
    }
    return null;
  }

  update(canvasHeight: number) {
    if (this.moveUpActive) {
      this.y = Math.max(0, this.y - this.moveSpeed);
    }
    if (this.moveDownActive) {
      this.y = Math.min(canvasHeight - this.height, this.y + this.moveSpeed);
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.image.complete) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }

  collidesWith(other: Entity): boolean {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
  }
}

export class Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  velocity: number;
  private image: HTMLImageElement;

  constructor(x: number, y: number, width: number, height: number, velocity: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.velocity = velocity;
    this.image = loadImage("/assets/sprites/sub.png");
  }

  update() {
    this.x += this.velocity;
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.image.complete) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }

  collidesWith(other: Entity): boolean {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
  }
}

export class Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  velocity = 6;
  private image: HTMLImageElement;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.image = loadImage("/assets/sprites/booat90.png");
  }

  update() {
    this.x += this.velocity;
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.image.complete) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }

  collidesWith(other: Entity): boolean {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
  }
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}
