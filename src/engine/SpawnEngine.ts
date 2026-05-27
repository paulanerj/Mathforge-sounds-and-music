import type { PracticeProfile } from './PracticeProfile';

export interface SpawnedTile {
  value: number;
  isBonus: boolean;
}

export enum TargetCategory {
  FACTOR = 'factor',
  DISTRACTOR = 'distractor',
  ONE = 'one',
  ZERO = 'zero'
}

export interface TargetProfile {
  target: number;
  coreFactors: number[];
  secondaryFactors: number[];
  distractors: number[];
  priorityDistractors: number[];
}

export function createTargetProfile(target: number, profile: PracticeProfile): TargetProfile {
  const { tileMin, tileMax } = profile;
  
  const allFactors: number[] = [];
  for (let v = 2; v <= target; v++) {
    if (target % v === 0 && v >= tileMin && v <= tileMax) {
      allFactors.push(v);
    }
  }

  const coreFactors = allFactors.filter(f => {
    const pair = target / f;
    return pair >= tileMin && pair <= tileMax;
  });

  const secondaryFactors = allFactors.filter(f => !coreFactors.includes(f));
  
  const factorSet = new Set([1, target, ...allFactors]);
  const allPossibleDistractors: number[] = [];
  for (let v = tileMin; v <= tileMax; v++) {
    if (v >= 2 && !factorSet.has(v)) {
      allPossibleDistractors.push(v);
    }
  }

  if (allPossibleDistractors.length < 4) {
    for (let v = tileMax + 1; v <= 30 && allPossibleDistractors.length < 4; v++) {
      if (target % v !== 0 && v !== 1 && v !== target && !factorSet.has(v)) {
        allPossibleDistractors.push(v);
      }
    }
  }

  const priorityDistractors = allPossibleDistractors.filter(d => {
    return allFactors.some(f => Math.abs(f - d) === 1);
  });

  return {
    target,
    coreFactors: coreFactors.length > 0 ? coreFactors : (secondaryFactors.length > 0 ? [secondaryFactors[0]] : [2]),
    secondaryFactors,
    distractors: allPossibleDistractors,
    priorityDistractors: priorityDistractors.length > 0 ? priorityDistractors : allPossibleDistractors
  };
}

export function getBalancedBags(
  targetProfile: TargetProfile,
  prng: () => number,
  zeroSentinel: number
): { factors: number[]; distractors: number[]; ones: number[]; zeros: number[] } {
  const { coreFactors, secondaryFactors, distractors } = targetProfile;
  const total = 100;
  
  const shuffle = (arr: number[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const fBag: number[] = [];
  const allFactors = [...coreFactors, ...secondaryFactors];
  if (allFactors.length > 0) {
    for (let i = 0; i < total; i++) {
        fBag.push(allFactors[i % allFactors.length]);
    }
  } else {
    for (let i = 0; i < total; i++) fBag.push(2);
  }

  const dBag: number[] = [];
  if (distractors.length > 0) {
    for (let i = 0; i < total; i++) {
      dBag.push(distractors[i % distractors.length]);
    }
  } else {
    for (let i = 0; i < total; i++) dBag.push(7);
  }

  return {
    factors: shuffle(fBag),
    distractors: shuffle(dBag),
    ones: Array(total).fill(1),
    zeros: Array(total).fill(zeroSentinel)
  };
}

export function getCategorySequence(count: number, prng: () => number): TargetCategory[] {
  const seq: TargetCategory[] = [];
  const nFactors = Math.floor(count * 0.45);
  const nDistractors = Math.floor(count * 0.50);
  const nSpecial = count - nFactors - nDistractors;
  
  const nOnes = Math.floor(nSpecial * 0.5);
  const nZeros = nSpecial - nOnes;

  for (let i = 0; i < nFactors; i++) seq.push(TargetCategory.FACTOR);
  for (let i = 0; i < nDistractors; i++) seq.push(TargetCategory.DISTRACTOR);
  for (let i = 0; i < nOnes; i++) seq.push(TargetCategory.ONE);
  for (let i = 0; i < nZeros; i++) seq.push(TargetCategory.ZERO);

  for (let i = seq.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [seq[i], seq[j]] = [seq[j], seq[i]];
  }

  for (let i = 1; i < seq.length - 1; i++) {
    if (seq[i] === TargetCategory.FACTOR && seq[i - 1] === TargetCategory.FACTOR) {
      for (let k = i + 1; k < seq.length; k++) {
        if (seq[k] !== TargetCategory.FACTOR) {
          [seq[i], seq[k]] = [seq[k], seq[i]];
          break;
        }
      }
    }
  }

  return seq;
}

function getFactors(target: number, min: number, max: number): number[] {
  const factors: number[] = [];
  for (let v = Math.max(min, 2); v <= max; v++) {
    if (target % v === 0) factors.push(v);
  }
  return factors;
}

export function spawnTileCombineGrid(
  target: number,
  profile: PracticeProfile,
  prng: () => number,
  zeroSentinel: number,
): SpawnedTile {
  const roll = prng();
  const { tileMin, tileMax, bonusTileProbability } = profile;
  let value: number;

  if (roll < 0.10) {
    value = zeroSentinel; 
  } else if (roll < 0.20) {
    value = 1; 
  } else if (roll < 0.60) {
    const factors = getFactors(target, tileMin, tileMax);
    if (factors.length === 0) {
      value = 2;
    } else {
      const idx = Math.floor(prng() * factors.length);
      value = factors[Math.max(0, Math.min(idx, factors.length - 1))];
    }
  } else {
    const factorSet = new Set(getFactors(target, tileMin, target));
    const distractors: number[] = [];
    for (let v = Math.max(tileMin, 2); v <= tileMax; v++) {
      if (!factorSet.has(v)) distractors.push(v);
    }
    if (distractors.length === 0) {
      value = 7;
    } else {
      const idx = Math.floor(prng() * distractors.length);
      value = distractors[Math.max(0, Math.min(idx, distractors.length - 1))];
    }
  }

  return { value, isBonus: prng() < bonusTileProbability };
}

export function spawnTile(profile: PracticeProfile, prng: () => number): SpawnedTile {
  const value = Math.floor(prng() * (profile.tileMax - profile.tileMin + 1)) + profile.tileMin;
  return { value, isBonus: prng() < profile.bonusTileProbability };
}

export function spawnBoard(rows: number, cols: number, profile: PracticeProfile, prng: () => number): SpawnedTile[] {
  return Array.from({ length: rows * cols }, () => spawnTile(profile, prng));
}

export function spawnColumn(count: number, profile: PracticeProfile, prng: () => number): SpawnedTile[] {
  return Array.from({ length: count }, () => spawnTile(profile, prng));
}

export function spawnTileWeighted(target: number, profile: PracticeProfile, prng: () => number): SpawnedTile {
  return spawnTileCombineGrid(target, profile, prng, 0);
}

export function spawnTileZero(target: number, profile: PracticeProfile, prng: () => number, zeroSentinel: number): SpawnedTile {
  return spawnTileCombineGrid(target, profile, prng, zeroSentinel);
}