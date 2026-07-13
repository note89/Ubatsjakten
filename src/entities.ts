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
  moveSpeed = 6;
  private lastShotTime = 0;
  private shootCooldown = 200;
  private shootCount = 0;
  private pendingBullets: Bullet[] = [];
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

  shoot() {
    const now = Date.now();
    if (now - this.lastShotTime > this.shootCooldown) {
      this.lastShotTime = now;
      this.shootCount++;
      const bullet = new Bullet(
        this.x + this.width,
        this.y + this.height / 2,
        25,
        12
      );
      this.pendingBullets.push(bullet);
    }
  }

  fireIbra() {
    if (this.shootCount >= 20) {
      this.shootCount = 0;
      const ibra = new Bullet(this.x + this.width, this.y + this.height / 2, 200, 150, true);
      this.pendingBullets.push(ibra);
      return true;
    }
    return false;
  }

  ibraReady(): boolean {
    return this.shootCount >= 20;
  }

  getBullets(): Bullet[] {
    return this.pendingBullets;
  }

  clearBullets() {
    this.pendingBullets = [];
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

  reset() {
    this.shootCount = 0;
    this.pendingBullets = [];
  }
}

export class Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  velocity: number;
  private image: HTMLImageElement;
  private createdAt: number;

  constructor(x: number, y: number, width: number, height: number, velocity: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.velocity = velocity;
    this.image = loadImage("/assets/sprites/sub.png");
    this.createdAt = Date.now();
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

  isOutOfBounds(): boolean {
    return Date.now() - this.createdAt > 14000;
  }
}

export class Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  velocity: number;
  isIbra: boolean;
  private image: HTMLImageElement;
  private ibraImage: HTMLImageElement;

  constructor(x: number, y: number, width: number, height: number, isIbra = false) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.isIbra = isIbra;
    this.velocity = isIbra ? 8 : 6;
    this.image = loadImage("/assets/sprites/booat90.png");
    this.ibraImage = loadImage("/assets/sprites/Ibrahimovic.png");
  }

  update() {
    this.x += this.velocity;
  }

  render(ctx: CanvasRenderingContext2D) {
    const img = this.isIbra ? this.ibraImage : this.image;
    if (img.complete) {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
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
