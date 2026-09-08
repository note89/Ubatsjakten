/** Unity Random.Range(float, float): both ends inclusive. */
export function randomRange(minInclusive: number, maxInclusive: number): number {
  return minInclusive + Math.random() * (maxInclusive - minInclusive);
}

/** Unity Random.Range(int, int): max exclusive. */
export function randomRangeInt(minInclusive: number, maxExclusive: number): number {
  return minInclusive + Math.floor(Math.random() * (maxExclusive - minInclusive));
}

export function randomElement<T>(items: readonly T[]): T {
  return items[randomRangeInt(0, items.length)];
}
