export class AudioManager {
  private audioContext: AudioContext;
  private sounds: Map<string, AudioBuffer> = new Map();
  private bgmSource: AudioBufferAudioNode | null = null;
  private bgmGain: GainNode;
  private loadingPromises: Promise<void>[] = [];

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.bgmGain = this.audioContext.createGain();
    this.bgmGain.connect(this.audioContext.destination);
    this.bgmGain.gain.value = 0.2;
    this.preloadSounds();
  }

  private preloadSounds() {
    const soundList = [
      { name: "SpeletStartar", path: "/assets/sounds/SpeletStartar.aiff" },
      { name: "DuringGame", path: "/assets/sounds/DuringGame.aiff" },
      { name: "LoseLife1", path: "/assets/sounds/LoseLife1.aiff" },
      { name: "LoseLife2", path: "/assets/sounds/LoseLife2.aiff" },
      { name: "ZlatanFlyger1", path: "/assets/sounds/ZlatanFlyger1.aiff" },
      { name: "ZlatanFlyger2", path: "/assets/sounds/ZlatanFlyger2.aiff" },
      { name: "GameOver", path: "/assets/sounds/GameOver.aiff" },
      { name: "implode", path: "/assets/sounds/implode.aiff" },
      { name: "Island", path: "/assets/sounds/Island.wav" },
      { name: "Naturligt", path: "/assets/sounds/Naturligt.wav" },
      { name: "Tack", path: "/assets/sounds/Tack.wav" },
      { name: "Trevligt", path: "/assets/sounds/Trevligt.wav" },
      { name: "upphetsad", path: "/assets/sounds/upphetsad.wav" },
      { name: "KungenKommentar1", path: "/assets/sounds/KungenKommentar1.aiff" },
      { name: "KungenKommentar2", path: "/assets/sounds/KungenKommentar2.aiff" },
    ];

    soundList.forEach(({ name, path }) => {
      const promise = this.loadSound(path, name);
      this.loadingPromises.push(promise);
    });
  }

  private loadSound(url: string, name: string): Promise<void> {
    return fetch(url)
      .then((res) => res.arrayBuffer())
      .then((buffer) => this.audioContext.decodeAudioData(buffer))
      .then((decoded) => {
        this.sounds.set(name, decoded);
      })
      .catch((err) => console.warn(`Failed to load ${name}:`, err));
  }

  private playSound(name: string, volume = 0.5) {
    const buffer = this.sounds.get(name);
    if (!buffer) {
      return;
    }

    try {
      const source = this.audioContext.createBufferSource();
      const gain = this.audioContext.createGain();

      source.buffer = buffer;
      source.connect(gain);
      gain.connect(this.audioContext.destination);
      gain.gain.value = volume;

      source.start(0);
    } catch (err) {
      console.warn(`Error playing ${name}:`, err);
    }
  }

  playGameStart() {
    this.playSound("SpeletStartar", 0.5);
  }

  playBackgroundMusic() {
    if (this.bgmSource) return;
    const buffer = this.sounds.get("DuringGame");
    if (!buffer) {
      console.warn("DuringGame buffer not loaded yet");
      return;
    }

    try {
      // Resume audio context if suspended
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume().catch(err => console.warn("Failed to resume audio context:", err));
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(this.bgmGain);
      source.start(0);
      this.bgmSource = source as unknown as AudioBufferAudioNode;
      console.log("Background music started");
    } catch (err) {
      console.warn("Error playing background music:", err);
    }
  }

  stopBackgroundMusic() {
    if (this.bgmSource) {
      try {
        (this.bgmSource as any).stop();
      } catch (err) {
        console.warn("Error stopping background music:", err);
      }
      this.bgmSource = null;
    }
  }

  playKingComment() {
    const comments = ["Island", "Naturligt", "Tack", "Trevligt", "upphetsad", "KungenKommentar1", "KungenKommentar2"];
    const random = comments[Math.floor(Math.random() * comments.length)];
    this.playSound(random, 0.6);
  }

  playZlatanAttack() {
    const attacks = ["ZlatanFlyger1", "ZlatanFlyger2"];
    const random = attacks[Math.floor(Math.random() * attacks.length)];
    this.playSound(random, 0.7);
  }

  playHit() {
    this.playSound("implode", 0.4);
  }

  playGameOver() {
    this.stopBackgroundMusic();
    this.playSound("GameOver", 0.6);
  }

  playLoseLife() {
    const sounds = ["LoseLife1", "LoseLife2"];
    const random = sounds[Math.floor(Math.random() * sounds.length)];
    this.playSound(random, 0.5);
  }
}
