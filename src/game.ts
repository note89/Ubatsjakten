import { Player } from "./entities";
import { Enemy } from "./entities";
import { Bullet } from "./entities";
import { AudioManager } from "./audio";

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private player: Player;
  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private score = 100000;
  private gameOver = false;
  private paused = false;
  private spawnTimer = 0;
  private spawnInterval = 120;
  private spawnMultiplier = 0.98;
  private audio: AudioManager;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.player = new Player(
      this.canvas.width / 2,
      this.canvas.height / 2,
      30,
      40
    );
    this.audio = new AudioManager();

    this.setupInputs();
    this.setupResize();
  }

  private setupInputs() {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.paused = !this.paused;
      }
      if (e.key === "ArrowUp") {
        this.player.moveUp();
      }
      if (e.key === "ArrowDown") {
        this.player.moveDown();
      }
      if (e.key === " ") {
        e.preventDefault();
        if (!this.gameOver) {
          const bullet = this.player.shoot();
          if (bullet) {
            this.bullets.push(bullet);
            this.audio.playShoot();
          }
        } else {
          this.resetGame();
        }
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.key === "ArrowUp") {
        this.player.stopMoveUp();
      }
      if (e.key === "ArrowDown") {
        this.player.stopMoveDown();
      }
    });
  }

  private setupResize() {
    window.addEventListener("resize", () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });
  }

  private update() {
    if (this.gameOver || this.paused) return;

    this.player.update(this.canvas.height);

    this.spawnTimer++;
    if (this.spawnTimer > this.spawnInterval) {
      this.spawnEnemy();
      this.spawnInterval *= this.spawnMultiplier;
      this.spawnTimer = 0;
    }

    this.enemies.forEach((enemy, idx) => {
      enemy.update();
      if (enemy.x < -50) {
        this.enemies.splice(idx, 1);
      }
    });

    this.bullets.forEach((bullet, idx) => {
      bullet.update();
      if (bullet.x > this.canvas.width + 50) {
        this.bullets.splice(idx, 1);
      }
    });

    this.checkCollisions();

    if (!this.player.alive) {
      this.gameOver = true;
      this.audio.playPutinWins();
    }
  }

  private checkCollisions() {
    this.bullets.forEach((bullet, bIdx) => {
      this.enemies.forEach((enemy, eIdx) => {
        if (bullet.collidesWith(enemy)) {
          this.bullets.splice(bIdx, 1);
          this.enemies.splice(eIdx, 1);
          this.score--;
          this.audio.playHit();
        }
      });
    });

    this.enemies.forEach((enemy, eIdx) => {
      if (enemy.collidesWith(this.player)) {
        this.enemies.splice(eIdx, 1);
        this.player.alive = false;
      }
    });
  }

  private spawnEnemy() {
    const y = Math.random() * (this.canvas.height - 60) + 30;
    const speed = -2 - Math.random() * 1.5;
    this.enemies.push(new Enemy(this.canvas.width, y, 40, 30, speed));
  }

  private render() {
    this.ctx.fillStyle = "#1a1a2e";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.player.render(this.ctx);

    this.enemies.forEach((enemy) => {
      enemy.render(this.ctx);
    });

    this.bullets.forEach((bullet) => {
      bullet.render(this.ctx);
    });

    this.renderUI();
  }

  private renderUI() {
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "30px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(`Ubåtar kvar: ${this.score}`, this.canvas.width / 2, 50);

    if (this.paused) {
      this.ctx.fillStyle = "rgba(0,0,0,0.7)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = "#fff";
      this.ctx.font = "48px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2);
    }

    if (this.gameOver) {
      this.ctx.fillStyle = "rgba(0,0,0,0.8)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = "#ff0000";
      this.ctx.font = "48px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText("PUTIN WINS", this.canvas.width / 2, this.canvas.height / 2 - 50);
      this.ctx.fillStyle = "#fff";
      this.ctx.font = "24px Arial";
      this.ctx.fillText("Press SPACE to restart", this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
  }

  public start() {
    const gameLoop = () => {
      this.update();
      this.render();
      requestAnimationFrame(gameLoop);
    };
    gameLoop();
  }

  public getBullets(): Bullet[] {
    return this.bullets;
  }

  public addBullet(bullet: Bullet) {
    this.bullets.push(bullet);
  }

  public resetGame() {
    this.gameOver = false;
    this.paused = false;
    this.score = 100000;
    this.spawnInterval = 120;
    this.spawnTimer = 0;
    this.enemies = [];
    this.bullets = [];
    this.player.alive = true;
    this.player.x = this.canvas.width / 2;
    this.player.y = this.canvas.height / 2;
  }
}
