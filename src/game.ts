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
  private lives = 3;
  private submarinesKilled = 0;
  private gameOver = false;
  private paused = false;
  private started = false;
  private musicPlaying = false;
  private spawnTimer = 0;
  private spawnInterval = 180;
  private spawnMultiplier = 0.95;
  private voiceTimer = 0;
  private audio: AudioManager;
  private bgImage: HTMLImageElement;
  private heartImages: HTMLImageElement[] = [];
  private startButtonBounds = { x: 0, y: 0, w: 0, h: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.player = new Player(
      80,
      this.canvas.height / 2,
      120,
      100
    );
    this.audio = new AudioManager();
    this.bgImage = new Image();
    this.bgImage.src = "/assets/sprites/background.png";

    this.loadHeartImages();
    this.setupInputs();
    this.setupResize();
  }

  private loadHeartImages() {
    const sources = ["treFull.png", "trenoll.png", "treett.png"];
    this.heartImages = sources.map((src) => {
      const img = new Image();
      img.src = `/assets/sprites/${src}`;
      return img;
    });
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
        if (!this.started) {
          this.startGame();
        } else if (this.gameOver) {
          this.resetGame();
        } else {
          this.player.shoot();
        }
      }
      if (e.key === "z" || e.key === "Z") {
        if (!this.gameOver && this.started) {
          if (this.player.fireIbra()) {
            this.audio.playZlatanAttack();
          }
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

    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (!this.started && this.isPointInButton(x, y, this.startButtonBounds)) {
        this.startGame();
      }
    });
  }

  private isPointInButton(x: number, y: number, button: { x: number; y: number; w: number; h: number }): boolean {
    return x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h;
  }

  private setupResize() {
    window.addEventListener("resize", () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });
  }

  private startGame() {
    this.started = true;
    this.audio.playGameStart();
    this.musicPlaying = true;
    // Audio manager handles context resumption internally
    this.audio.playBackgroundMusic();
  }

  private update() {
    if (!this.started || this.gameOver || this.paused) return;

    this.player.update(this.canvas.height);

    // Handle player shooting
    const bullets = this.player.getBullets();
    bullets.forEach((b) => this.bullets.push(b));
    this.player.clearBullets();

    // Spawn enemies (cap minimum spawn interval at 60 frames)
    this.spawnTimer++;
    if (this.spawnTimer > this.spawnInterval) {
      this.spawnEnemy();
      this.spawnInterval = Math.max(60, this.spawnInterval * this.spawnMultiplier);
      this.spawnTimer = 0;
    }

    // Update enemies
    this.enemies = this.enemies.filter((enemy) => {
      enemy.update();
      return enemy.x > -100;
    });

    // Update bullets
    this.bullets = this.bullets.filter((bullet) => {
      bullet.update();
      return bullet.x < this.canvas.width + 100;
    });

    // Random King voice
    this.voiceTimer++;
    if (this.voiceTimer > 600) {
      if (Math.random() < 0.01) {
        this.audio.playKingComment();
        this.voiceTimer = 0;
      }
    }

    this.checkCollisions();

    if (this.lives <= 0) {
      this.gameOver = true;
      this.audio.playGameOver();
    }
  }

  private checkCollisions() {
    const bulletsToRemove: number[] = [];
    const enemiesToRemove: number[] = [];

    this.bullets.forEach((bullet, bIdx) => {
      if (bullet.isIbra) {
        // Zlatan sweeps across screen, destroys all enemies he touches
        this.enemies.forEach((enemy, eIdx) => {
          if (bullet.collidesWith(enemy)) {
            if (!enemiesToRemove.includes(eIdx)) {
              enemiesToRemove.push(eIdx);
              this.submarinesKilled++;
            }
          }
        });
        // Remove Zlatan when he exits right side
        if (bullet.x > this.canvas.width + 500) {
          bulletsToRemove.push(bIdx);
        }
      } else {
        this.enemies.forEach((enemy, eIdx) => {
          if (bullet.collidesWith(enemy)) {
            if (!bulletsToRemove.includes(bIdx)) bulletsToRemove.push(bIdx);
            if (!enemiesToRemove.includes(eIdx)) enemiesToRemove.push(eIdx);
            this.submarinesKilled++;
            this.audio.playHit();
          }
        });
      }
    });

    // Remove in reverse order to maintain indices
    bulletsToRemove.sort((a, b) => b - a).forEach((idx) => this.bullets.splice(idx, 1));
    enemiesToRemove.sort((a, b) => b - a).forEach((idx) => this.enemies.splice(idx, 1));

    // Player collision
    this.enemies = this.enemies.filter((enemy, eIdx) => {
      if (enemy.collidesWith(this.player)) {
        this.lives--;
        this.audio.playLoseLife();
        return false;
      }
      return true;
    });
  }

  private spawnEnemy() {
    const y = Math.random() * (this.canvas.height - 100) + 50;
    const speedVariation = Math.random() * 3.7 - 1.3;
    const speed = -2 - speedVariation;
    this.enemies.push(new Enemy(this.canvas.width, y, 90, 70, speed));
  }


  private render() {
    // Background
    if (this.bgImage.complete) {
      this.ctx.drawImage(this.bgImage, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.fillStyle = "#1a1a2e";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    if (!this.started) {
      if (!this.audio.isReady()) {
        this.renderLoading();
        return;
      }
      this.renderMenu();
      return;
    }

    // Game entities
    this.player.render(this.ctx);
    this.enemies.forEach((e) => e.render(this.ctx));
    this.bullets.forEach((b) => b.render(this.ctx));

    this.renderUI();

    if (this.paused) {
      this.ctx.fillStyle = "rgba(0,0,0,0.6)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = "#fff";
      this.ctx.font = "48px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2);
    }

    if (this.gameOver) {
      this.renderGameOver();
    }
  }

  private renderLoading() {
    this.ctx.fillStyle = "rgba(0,0,0,0.8)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "bold 48px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("UBÅTSJAKTEN", this.canvas.width / 2, this.canvas.height / 2 - 50);
    this.ctx.font = "24px Arial";
    this.ctx.fillText("Loading audio...", this.canvas.width / 2, this.canvas.height / 2 + 50);
  }

  private renderMenu() {
    this.ctx.fillStyle = "rgba(0,0,0,0.7)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "bold 60px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("UBÅTSJAKTEN", this.canvas.width / 2, this.canvas.height / 2 - 100);
    this.ctx.font = "24px Arial";
    this.ctx.fillText("↑/↓ Move | SPACE Shoot | Z Zlatan", this.canvas.width / 2, this.canvas.height / 2 + 50);

    const btnX = this.canvas.width / 2 - 220;
    const btnY = this.canvas.height / 2 + 100;
    const btnW = 440;
    const btnH = 90;
    const cornerRadius = 25;

    this.startButtonBounds = { x: btnX, y: btnY, w: btnW, h: btnH };

    // Deep shadow (King style)
    this.ctx.fillStyle = "rgba(0,0,0,0.5)";
    this.roundRect(btnX + 6, btnY + 8, btnW, btnH, cornerRadius);
    this.ctx.fill();

    // Outer glow/border shadow
    this.ctx.strokeStyle = "rgba(0,0,0,0.3)";
    this.ctx.lineWidth = 6;
    this.roundRect(btnX - 2, btnY - 2, btnW + 4, btnH + 4, cornerRadius + 2);
    this.ctx.stroke();

    // Main gradient (gold to blue)
    const gradient = this.ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    gradient.addColorStop(0, "#FFD700"); // Gold
    gradient.addColorStop(0.45, "#FFA500"); // Orange
    gradient.addColorStop(1, "#0066FF"); // Blue

    this.ctx.fillStyle = gradient;
    this.roundRect(btnX, btnY, btnW, btnH, cornerRadius);
    this.ctx.fill();

    // Gold border
    this.ctx.strokeStyle = "#FFE44D";
    this.ctx.lineWidth = 5;
    this.roundRect(btnX, btnY, btnW, btnH, cornerRadius);
    this.ctx.stroke();

    // Inner highlight (shine effect)
    const highlight = this.ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH * 0.4);
    highlight.addColorStop(0, "rgba(255,255,255,0.4)");
    highlight.addColorStop(1, "rgba(255,255,255,0)");
    this.ctx.fillStyle = highlight;
    this.roundRect(btnX + 5, btnY + 5, btnW - 10, btnH * 0.35, cornerRadius - 3);
    this.ctx.fill();

    // Draw text with shadow (King style)
    this.ctx.font = "bold 48px Arial";
    this.ctx.textAlign = "center";

    // Black shadow
    this.ctx.fillStyle = "rgba(0,0,0,0.4)";
    this.ctx.fillText("▶ START GAME", this.canvas.width / 2 + 2, btnY + 65);

    // White main text
    this.ctx.fillStyle = "#fff";
    this.ctx.shadowColor = "rgba(0,0,0,0.5)";
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    this.ctx.fillText("▶ START GAME", this.canvas.width / 2, btnY + 63);
    this.ctx.shadowColor = "transparent";

    this.ctx.fillStyle = "#cccccc";
    this.ctx.font = "16px Arial";
    this.ctx.fillText("(Or press SPACE • Music plays automatically)", this.canvas.width / 2, this.canvas.height / 2 + 210);
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number) {
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

  private renderUI() {
    // Score
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "24px Arial";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`Ubåtar kvar: ${this.submarinesKilled}`, 20, 40);

    // Lives (hearts)
    for (let i = 0; i < 3; i++) {
      const img = this.heartImages[Math.max(0, 2 - this.lives)] || this.heartImages[2];
      if (img.complete) {
        this.ctx.drawImage(img, this.canvas.width - 160 + i * 50, 60, 45, 45);
      }
    }

    // Ibra indicator
    if (this.player.ibraReady()) {
      this.ctx.fillStyle = "#ffff00";
      this.ctx.font = "bold 20px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText("ZLATAN READY (Z)", this.canvas.width / 2, 50);
    }
  }

  private renderGameOver() {
    const putinImg = new Image();
    putinImg.src = "/assets/sprites/putinwins.png";
    this.ctx.fillStyle = "rgba(0,0,0,0.5)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (putinImg.complete) {
      this.ctx.drawImage(
        putinImg,
        this.canvas.width / 2 - 150,
        this.canvas.height / 2 - 150,
        300,
        300
      );
    } else {
      this.ctx.fillStyle = "#ff0000";
      this.ctx.font = "48px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText("PUTIN WINS", this.canvas.width / 2, this.canvas.height / 2);
    }
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "24px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(`Ubåtar förstörda: ${this.submarinesKilled}`, this.canvas.width / 2, this.canvas.height - 100);
    this.ctx.fillText("Press SPACE to restart", this.canvas.width / 2, this.canvas.height - 50);
  }

  public start() {
    const gameLoop = () => {
      this.update();
      this.render();
      requestAnimationFrame(gameLoop);
    };
    gameLoop();
  }

  private resetGame() {
    this.gameOver = false;
    this.paused = false;
    this.started = true;
    this.lives = 3;
    this.submarinesKilled = 0;
    this.spawnInterval = 180;
    this.spawnTimer = 0;
    this.enemies = [];
    this.bullets = [];
    this.player.x = 80;
    this.player.y = this.canvas.height / 2;
    this.player.reset();
    this.musicPlaying = false;
    this.audio.stopAllSounds();
    setTimeout(() => {
      this.audio.playBackgroundMusic();
      this.musicPlaying = true;
    }, 100);
  }
}
