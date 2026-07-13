export class AudioManager {
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  private playSound(frequency: number, duration: number, type: OscillatorType = "sine") {
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playHit() {
    this.playSound(800, 0.1);
  }

  playPutinWins() {
    this.playSound(100, 1.0, "square");
    setTimeout(() => this.playSound(80, 1.0, "square"), 250);
    setTimeout(() => this.playSound(60, 1.5, "square"), 500);
  }

  playShoot() {
    this.playSound(1200, 0.05);
  }
}
