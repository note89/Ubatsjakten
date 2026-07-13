export class AudioManager {
  private audioContext: AudioContext;
  private sounds: Map<string, AudioBuffer> = new Map();
  private bgmSource: AudioBufferAudioNode | null = null;
  private bgmGain: GainNode;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.bgmGain = this.audioContext.createGain();
    this.bgmGain.connect(this.audioContext.destination);
    this.bgmGain.gain.value = 0.3;
    this.preloadSounds();
  }

  private preloadSounds() {
    const soundList = [
      "SpeletStartar.aiff",
      "DuringGame.aiff",
      "LoseLife1.aiff",
      "LoseLife2.aiff",
      "ZlatanFlyger1.aiff",
      "ZlatanFlyger2.aiff",
      "KungenKommentar1.aiff",
      "KungenKommentar2.aiff",
      "GameOver.aiff",
      "implode.aiff",
      "Island.wav",
      "Naturligt.wav",
      "Tack.wav",
      "Trevligt.wav",
      "upphetsad.wav",
    ];

    soundList.forEach((sound) => {
      this.loadSound(`/assets/sounds/${sound}`, sound.split(".")[0]);
    });
  }

  private loadSound(url: string, name: string) {
    fetch(url)
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
      console.warn(`Sound not loaded: ${name}`);
      return;
    }

    const source = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();

    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.audioContext.destination);
    gain.gain.value = volume;

    source.start(0);
  }

  playGameStart() {
    this.playSound("SpeletStartar", 0.6);
  }

  playBackgroundMusic() {
    if (this.bgmSource) return;
    const buffer = this.sounds.get("DuringGame");
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.bgmGain);
    source.start(0);
    this.bgmSource = source as unknown as AudioBufferAudioNode;
  }

  stopBackgroundMusic() {
    if (this.bgmSource) {
      (this.bgmSource as any).stop();
      this.bgmSource = null;
    }
  }

  playKingComment() {
    const comments = ["Island", "Naturligt", "Tack", "Trevligt", "upphetsad"];
    const random = comments[Math.floor(Math.random() * comments.length)];
    this.playSound(random, 0.7);
  }

  playZlatanAttack() {
    const attacks = ["ZlatanFlyger1", "ZlatanFlyger2"];
    const random = attacks[Math.floor(Math.random() * attacks.length)];
    this.playSound(random, 0.8);
  }

  playHit() {
    this.playSound("implode", 0.5);
  }

  playGameOver() {
    this.stopBackgroundMusic();
    this.playSound("GameOver", 0.7);
  }

  playLoseLife() {
    const sounds = ["LoseLife1", "LoseLife2"];
    const random = sounds[Math.floor(Math.random() * sounds.length)];
    this.playSound(random, 0.6);
  }
}
