export function makePrng(seed: number): () => number {
  let s = seed | 0;
  return function (): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0xffffffff;
  };
}

export function randomSeed(): number {
  return (Math.random() * 0xffffffff) | 0;
}

export function randomInt(prng: () => number, min: number, max: number): number {
  return Math.floor(prng() * (max - min + 1)) + min;
}

export function randomPick<T>(prng: () => number, arr: readonly T[]): T {
  if (arr.length === 0) throw new Error("randomPick: array is empty");
  const roll = prng();
  const idx = Math.floor(roll * arr.length);
  const safeIdx = Math.max(0, Math.min(idx, arr.length - 1));
  const val = arr[safeIdx];
  if (val === undefined) {
    throw new Error(`randomPick: undefined at idx ${safeIdx} (roll ${roll}, len ${arr.length})`);
  }
  return val;
}

export function randomShuffle<T>(prng: () => number, arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return result;
}