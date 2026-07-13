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

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
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
      return new Bullet(this.x + this.width, this.y + this.height / 2, 8, 8, 6);
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
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "#ffff00";
    ctx.fillRect(this.x + 20, this.y + 10, 15, 5);
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

  constructor(x: number, y: number, width: number, height: number, velocity: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.velocity = velocity;
  }

  update() {
    this.x += this.velocity;
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "#ffff00";
    ctx.fillRect(this.x + 5, this.y + 10, 10, 5);
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
  velocity: number;

  constructor(x: number, y: number, width: number, height: number, velocity: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.velocity = velocity;
  }

  update() {
    this.x += this.velocity;
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#ffff00";
    ctx.fillRect(this.x, this.y, this.width, this.height);
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
