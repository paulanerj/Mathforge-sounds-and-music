────────────────────────────────────────────────────────────────────────────────
import { TargetCategory } from '../SpawnEngine';
import { assertSpawnIntentCount } from '../ENGINE_CONTRACT';

export interface SpawnConfiguration {
  target: number;
  bags: {
    [K in TargetCategory]: number[];
  };
  diversity: {
    minDistinctFactors: number;
    minDistinctDistractors: number;
    maxDominancePercent: number;
  };
  antiStreakLimit: number;
}

export interface SpawnResult {
  values: number[];
  updatedBags: {
    [K in TargetCategory]: number[];
  };
  log: string;
}

export function drawBatchFromEngine(
  count: number,
  categories: TargetCategory[],
  config: SpawnConfiguration,
  recentHistory: number[],
  boardCount: { [key: number]: number },
  boardTotalSlots: number,
  prng: () => number,
  source: string = "ENGINE"
): SpawnResult {
  assertSpawnIntentCount(count, categories.length);

  const values: number[] = [];
  const localCounts = { ...boardCount };
  const localHistory = [...recentHistory];
  const bags = { ...config.bags };
  
  const hardCap = Math.max(2, Math.floor(boardTotalSlots * config.diversity.maxDominancePercent));

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const bag = bags[cat];

    if (bag.length === 0) {
      console.warn(`SpawnEngine: Bag for category ${cat} was EMPTY. Falling back to default values.`);
      const fallback = cat === TargetCategory.ZERO ? 0 : cat === TargetCategory.ONE ? 1 : 2;
      values.push(fallback);
      continue; 
    }

    let val = bag.pop()!;
    let attempts = 0;

    while (attempts < 30) {
      const streak = localHistory.slice(-6).filter(v => v === val).length;
      const dominance = localCounts[val] || 0;

      const isStreak = streak >= config.antiStreakLimit;
      const isDominant = dominance >= hardCap;

      let varietyFail = false;
      if (count >= 4 && i < 3 && values.includes(val)) {
        varietyFail = true;
      }

      if (!isStreak && !isDominant && !varietyFail) break;

      bag.unshift(val);
      val = bag.pop()!;
      attempts++;
    }

    values.push(val);
    localCounts[val] = (localCounts[val] || 0) + 1;
    localHistory.push(val);
  }

  const resultLog = `SPAWN_DEBUG { value: [${values.join(',')}], categories: [${categories.join(',')}], source: "${source}", target: ${config.target}, history: [${localHistory.slice(-6).join(',')}] }`;

  return {
    values,
    updatedBags: bags,
    log: resultLog
  };
}
────────────────────────────────────────────────────────────────────────────────
