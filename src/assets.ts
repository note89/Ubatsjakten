import { SPRITE_FILES, type SpriteName } from "./unity-scene";

const SPRITES_URL_PREFIX = "/assets/sprites/";

const SPRITE_NAMES = Object.keys(SPRITE_FILES) as SpriteName[];

export class SpriteLibrary {
  private constructor(private readonly images: ReadonlyMap<SpriteName, HTMLImageElement>) {}

  static async load(): Promise<SpriteLibrary> {
    const loaded = await Promise.all(
      SPRITE_NAMES.map(async (name): Promise<readonly [SpriteName, HTMLImageElement]> => {
        const image = new Image();
        image.src = `${SPRITES_URL_PREFIX}${SPRITE_FILES[name]}`;
        await image.decode();
        return [name, image];
      }),
    );
    return new SpriteLibrary(new Map(loaded));
  }

  image(name: SpriteName): HTMLImageElement {
    const image = this.images.get(name);
    if (image === undefined) {
      throw new Error(`SpriteLibrary.image: ${name} not loaded`);
    }
    return image;
  }
}
