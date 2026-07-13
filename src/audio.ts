export class AudioManager {
  private audioContext: AudioContext;
  private sounds: Map<string, AudioBuffer> = new Map();
  private bgmSource: AudioBufferAudioNode | null = null;
  private bgmGain: GainNode;
  private loadingPromises: Promise<void>[] = [];
  private allSoundsLoaded = false;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.bgmGain = this.audioContext.createGain();
    this.bgmGain.connect(this.audioContext.destination);
    this.bgmGain.gain.value = 0.6;
    this.preloadSounds();
    this.waitForAllSounds();

    // Resume audio context on first user interaction
    const resumeAudio = () => {
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }
      document.removeEventListener("click", resumeAudio);
      document.removeEventListener("keydown", resumeAudio);
      document.removeEventListener("touchstart", resumeAudio);
    };
    document.addEventListener("click", resumeAudio);
    document.addEventListener("keydown", resumeAudio);
    document.addEventListener("touchstart", resumeAudio);
  }

  private preloadSounds() {
    const soundList = [
      { name: "SpeletStartar", path: "/assets/sounds/SpeletStartar.wav" },
      { name: "DuringGame", path: "/assets/sounds/DuringGame.wav" },
      { name: "LoseLife1", path: "/assets/sounds/LoseLife1.wav" },
      { name: "LoseLife2", path: "/assets/sounds/LoseLife2.wav" },
      { name: "ZlatanFlyger1", path: "/assets/sounds/ZlatanFlyger1.wav" },
      { name: "ZlatanFlyger2", path: "/assets/sounds/ZlatanFlyger2.wav" },
      { name: "GameOver", path: "/assets/sounds/GameOver.wav" },
      { name: "implode", path: "/assets/sounds/implode.wav" },
      { name: "Island", path: "/assets/sounds/Island.wav" },
      { name: "Naturligt", path: "/assets/sounds/Naturligt.wav" },
      { name: "Tack", path: "/assets/sounds/Tack.wav" },
      { name: "Trevligt", path: "/assets/sounds/Trevligt.wav" },
      { name: "upphetsad", path: "/assets/sounds/upphetsad.wav" },
      { name: "KungenKommentar1", path: "/assets/sounds/KungenKommentar1.wav" },
      { name: "KungenKommentar2", path: "/assets/sounds/KungenKommentar2.wav" },
    ];

    soundList.forEach(({ name, path }) => {
      const promise = this.loadSound(path, name);
      this.loadingPromises.push(promise);
    });
  }

  private waitForAllSounds() {
    Promise.all(this.loadingPromises).then(() => {
      this.allSoundsLoaded = true;
      console.log("✓ All audio loaded and ready");
    });
  }

  isReady(): boolean {
    return this.allSoundsLoaded;
  }

  private loadSound(url: string, name: string): Promise<void> {
    return fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${name}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        if (buffer.byteLength === 0) throw new Error(`Empty buffer for ${name}`);
        return this.audioContext.decodeAudioData(buffer);
      })
      .then((decoded) => {
        this.sounds.set(name, decoded);
        console.log(`✓ Loaded ${name} (${(decoded.duration / 60).toFixed(1)}min)`);
      })
      .catch((err) => console.error(`✗ Failed to load ${name}:`, err));
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
    if (this.bgmSource) {
      console.log("Music already playing, ignoring play request");
      return;
    }
    const buffer = this.sounds.get("DuringGame");
    if (!buffer) {
      console.error("❌ DuringGame buffer NOT loaded. Available sounds:", Array.from(this.sounds.keys()));
      return;
    }

    console.log(`🎵 DuringGame buffer found: ${buffer.duration.toFixed(1)}s, ${buffer.numberOfChannels}ch`);

    const startMusic = () => {
      try {
        console.log(`📍 Starting playback - context: ${this.audioContext.state}, dest channels: ${this.audioContext.destination.maxChannelCount}`);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(this.bgmGain);

        console.log(`🔊 BGM gain value: ${this.bgmGain.gain.value}`);

        source.start(0);
        this.bgmSource = source as unknown as AudioBufferAudioNode;
        console.log(`✓ Background music playing (loop: true, volume: ${(this.bgmGain.gain.value * 100).toFixed(0)}%)`);
      } catch (err) {
        console.error("❌ Error playing background music:", err);
      }
    };

    // Resume audio context if suspended, then start music
    if (this.audioContext.state === "suspended") {
      console.log("⏸️ Audio context suspended, resuming...");
      this.audioContext.resume()
        .then(() => {
          console.log("✓ Audio context resumed");
          startMusic();
        })
        .catch(err => console.error("❌ Failed to resume audio context:", err));
    } else {
      startMusic();
    }
  }

  stopBackgroundMusic() {
    if (this.bgmSource) {
      try {
        (this.bgmSource as any).stop();
        console.log("⏹️ Background music stopped");
      } catch (err) {
        console.warn("⚠️ Error stopping background music:", err);
      }
      this.bgmSource = null;
    } else {
      console.log("ℹ️ No music currently playing");
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

  setVolume(volume: number) {
    this.bgmGain.gain.value = Math.max(0, Math.min(1, volume));
    console.log(`🔊 Music volume: ${(volume * 100).toFixed(0)}%`);
  }

  stopAllSounds() {
    this.stopBackgroundMusic();
    // Close and recreate audio context to stop all playing sounds
    if (this.audioContext.state !== "closed") {
      this.audioContext.close();
    }
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.bgmGain = this.audioContext.createGain();
    this.bgmGain.connect(this.audioContext.destination);
    this.bgmGain.gain.value = 0.6;
    console.log("🔇 All audio stopped and context reset");
  }
}
