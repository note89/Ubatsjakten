import { FIXED_DELTA_TIME, INITIAL_TIME_SCALE } from "./unity-scene";

/** Which clock Time.time reads: the fixed step's time inside FixedUpdate/physics, the frame's time otherwise. */
type ClockPhase = "fixed" | "frame";

/**
 * Unity's TimeManager. It is engine-global: Time.time, Time.fixedTime and Time.timeScale all
 * survive Application.LoadLevel, so one instance outlives every Level.
 */
export class UnityClock {
  private frameTime = 0;
  private fixedTime = 0;
  private phase: ClockPhase = "frame";
  private timeScale = INITIAL_TIME_SCALE;

  /** Time.time. */
  get time(): number {
    return this.phase === "fixed" ? this.fixedTime : this.frameTime;
  }

  setTimeScale(timeScale: number): void {
    this.timeScale = timeScale;
  }

  /** Start of a frame: Time.time advances by the (already clamped) real delta, scaled by Time.timeScale. */
  advanceFrame(unscaledDeltaTime: number): void {
    this.frameTime += unscaledDeltaTime * this.timeScale;
  }

  /** The fixed loop: one step per fixedDeltaTime until fixedTime has caught up with the frame. */
  runFixedSteps(step: () => void): void {
    this.phase = "fixed";
    while (this.fixedTime + FIXED_DELTA_TIME <= this.frameTime) {
      this.fixedTime += FIXED_DELTA_TIME;
      step();
    }
    this.phase = "frame";
  }
}
