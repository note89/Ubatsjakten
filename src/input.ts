/** Physical keys the original binds: UpArrow, DownArrow, Space, Z, Escape. */
export type KeyCode = "ArrowUp" | "ArrowDown" | "Space" | "KeyZ" | "Escape";

const HANDLED_KEYS: ReadonlySet<string> = new Set<KeyCode>(["ArrowUp", "ArrowDown", "Space", "KeyZ", "Escape"]);

/** Unity Input semantics: GetKey while held, GetKeyDown/GetKeyUp only during the frame of the edge. */
export class KeyboardInput {
  private readonly held = new Set<string>();
  private readonly pressedThisFrame = new Set<string>();
  private readonly releasedThisFrame = new Set<string>();

  constructor(target: Window) {
    target.addEventListener("keydown", (event) => {
      if (!HANDLED_KEYS.has(event.code)) {
        return;
      }
      event.preventDefault();
      if (event.repeat || this.held.has(event.code)) {
        return;
      }
      this.held.add(event.code);
      this.pressedThisFrame.add(event.code);
    });
    target.addEventListener("keyup", (event) => {
      if (!HANDLED_KEYS.has(event.code)) {
        return;
      }
      event.preventDefault();
      this.held.delete(event.code);
      this.releasedThisFrame.add(event.code);
    });
    target.addEventListener("blur", () => {
      for (const code of this.held) {
        this.releasedThisFrame.add(code);
      }
      this.held.clear();
    });
  }

  getKey(code: KeyCode): boolean {
    return this.held.has(code) || this.pressedThisFrame.has(code);
  }

  getKeyDown(code: KeyCode): boolean {
    return this.pressedThisFrame.has(code);
  }

  getKeyUp(code: KeyCode): boolean {
    return this.releasedThisFrame.has(code);
  }

  endFrame(): void {
    this.pressedThisFrame.clear();
    this.releasedThisFrame.clear();
  }
}
