export type ClipName =
  | "SpeletStartar"
  | "DuringGame"
  | "GameOver"
  | "implode"
  | "LoseLife1"
  | "LoseLife2"
  | "ZlatanFlyger1"
  | "ZlatanFlyger2"
  | "Naturligt"
  | "Island"
  | "Tack"
  | "Trevligt"
  | "upphetsad"
  | "KungenKommentar1"
  | "KungenKommentar2";

const CLIP_NAMES: readonly ClipName[] = [
  "SpeletStartar",
  "DuringGame",
  "GameOver",
  "implode",
  "LoseLife1",
  "LoseLife2",
  "ZlatanFlyger1",
  "ZlatanFlyger2",
  "Naturligt",
  "Island",
  "Tack",
  "Trevligt",
  "upphetsad",
  "KungenKommentar1",
  "KungenKommentar2",
];

const SOUNDS_URL_PREFIX = "/assets/sounds/";

export class AudioClipLibrary {
  private constructor(private readonly clips: ReadonlyMap<ClipName, AudioBuffer>) {}

  static async load(context: AudioContext): Promise<AudioClipLibrary> {
    const decoded = await Promise.all(
      CLIP_NAMES.map(async (name): Promise<readonly [ClipName, AudioBuffer]> => {
        const response = await fetch(`${SOUNDS_URL_PREFIX}${name}.wav`);
        if (!response.ok) {
          throw new Error(`AudioClipLibrary.load: HTTP ${response.status} for ${name}`);
        }
        return [name, await context.decodeAudioData(await response.arrayBuffer())];
      }),
    );
    return new AudioClipLibrary(new Map(decoded));
  }

  clip(name: ClipName): AudioBuffer {
    const clip = this.clips.get(name);
    if (clip === undefined) {
      throw new Error(`AudioClipLibrary.clip: ${name} not loaded`);
    }
    return clip;
  }
}

export type Looping = "loop" | "once";

/**
 * One Unity AudioSource: a fixed volume, one clip playing at a time (Play interrupts the clip only),
 * plus fire-and-forget one-shots mixed at the same volume until the source is stopped or destroyed.
 */
export class AudioSourceChannel {
  private readonly gain: GainNode;
  private current: AudioBufferSourceNode | null = null;
  private readonly oneShots = new Set<AudioBufferSourceNode>();

  constructor(
    private readonly context: AudioContext,
    volume: number,
    private readonly looping: Looping,
  ) {
    this.gain = context.createGain();
    this.gain.gain.value = volume;
    this.gain.connect(context.destination);
  }

  get isPlaying(): boolean {
    return this.current !== null;
  }

  play(clip: AudioBuffer): void {
    this.startAt(clip, this.context.currentTime);
  }

  playDelayed(clip: AudioBuffer, delaySeconds: number): void {
    this.startAt(clip, this.context.currentTime + delaySeconds);
  }

  playOneShot(clip: AudioBuffer): void {
    const source = this.context.createBufferSource();
    source.buffer = clip;
    source.connect(this.gain);
    source.onended = () => {
      this.oneShots.delete(source);
    };
    source.start();
    this.oneShots.add(source);
  }

  /** AudioSource.Stop, or the source being destroyed: silences the clip and every one-shot. */
  stop(): void {
    this.interruptClip();
    for (const source of this.oneShots) {
      source.stop();
    }
    this.oneShots.clear();
  }

  private interruptClip(): void {
    if (this.current === null) {
      return;
    }
    this.current.stop();
    this.current = null;
  }

  private startAt(clip: AudioBuffer, when: number): void {
    this.interruptClip();
    const source = this.context.createBufferSource();
    source.buffer = clip;
    source.loop = this.looping === "loop";
    source.connect(this.gain);
    source.onended = () => {
      if (this.current === source) {
        this.current = null;
      }
    };
    source.start(when);
    this.current = source;
  }
}
