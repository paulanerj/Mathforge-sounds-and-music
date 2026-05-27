────────────────────────────────────────────────────────────────────────────────
import { TargetProfile, TargetCategory } from '../../../engine/SpawnEngine';
import { ZERO_TILE_VALUE } from '../constants';

export interface SpawnAuditReport {
  target: number;
  path: "initial" | "merge-refill" | "bomb-refill" | "zero-refill" | "stalemate-refill" | "audit-command";
  totalTiles: number;
  valueCounts: Record<number, number>;
  distinctValues: number[];
  factorValuesPresent: number[];
  distractorValuesPresent: number[];
  dominantValue: number;
  dominantShare: number;
  maxStreak: number;
  summary: string;
}

export function auditSpawnOutput(
  values: number[],
  target: number,
  profile: TargetProfile,
  path: SpawnAuditReport["path"]
): SpawnAuditReport {
  const counts: Record<number, number> = {};
  values.forEach(v => counts[v] = (counts[v] || 0) + 1);

  const distinctValues = Object.keys(counts).map(Number).sort((a, b) => a - b);
  
  const factorsPresent = distinctValues.filter(v => 
    v !== 1 && v !== ZERO_TILE_VALUE && target % v === 0
  );
  
  const distractorsPresent = distinctValues.filter(v => 
    v !== 1 && v !== ZERO_TILE_VALUE && target % v !== 0
  );

  let dominantValue = -1;
  let maxCount = 0;
  for (const [vStr, count] of Object.entries(counts)) {
    const v = Number(vStr);
    if (count > maxCount) {
      maxCount = count;
      dominantValue = v;
    }
  }

  const dominantShare = values.length > 0 ? maxCount / values.length : 0;

  let maxStreak = 0;
  if (values.length > 0) {
    let currentStreak = 1;
    let lastVal = values[0];
    for (let i = 1; i < values.length; i++) {
       if (values[i] === lastVal) {
         currentStreak++;
       } else {
         maxStreak = Math.max(maxStreak, currentStreak);
         currentStreak = 1;
         lastVal = values[i];
       }
    }
    maxStreak = Math.max(maxStreak, currentStreak);
  }

  const summary = `Path: ${path} | Target: ${target} | Tiles: ${values.length} | Factors: ${factorsPresent.length} | Dist: ${distractorsPresent.length} | Streak: ${maxStreak} | Dom: ${dominantValue} (${(dominantShare * 100).toFixed(1)}%)`;

  return {
    target, path, totalTiles: values.length, valueCounts: counts, distinctValues,
    factorValuesPresent: factorsPresent, distractorValuesPresent: distractorsPresent,
    dominantValue, dominantShare, maxStreak, summary
  };
}

export function enforceSpawnQuality(report: SpawnAuditReport, profile: TargetProfile, dominanceThreshold: number = 0.25) {
  const errors: string[] = [];

  const isInitial = report.path === "initial";
  const isLargeBatch = report.totalTiles >= 10;
  
  if (report.dominantShare > dominanceThreshold && (isInitial || isLargeBatch)) {
    errors.push(`[SPAWN DOMINANCE VIOLATION] Value ${report.dominantValue} occupies ${(report.dominantShare * 100).toFixed(1)}% of the board (limit ${dominanceThreshold * 100}%)`);
  }

  if (isInitial || (report.totalTiles >= 6 && !isInitial)) {
    const coreFactorsFound = profile.coreFactors.filter(f => (report.valueCounts[f] || 0) > 0);
    const minFactorsRequired = isInitial ? Math.min(2, profile.coreFactors.length) : 1;
    
    if (coreFactorsFound.length < minFactorsRequired) {
       const msg = `[SPAWN TARGET AWARENESS] Low core factors for target ${report.target}. Found: ${coreFactorsFound.length}. Expected ${minFactorsRequired}`;
       if (isInitial) {
         errors.push(msg);
       } else {
         console.warn(msg);
       }
    }
  }

  if (isInitial && report.maxStreak > 4) {
     errors.push(`[SPAWN REPETITION VIOLATION] Pathological streak detected: ${report.maxStreak} consecutive identical values.`);
  }

  if (isInitial) {
    if (report.distractorValuesPresent.length < 3 && profile.distractors.length >= 4) {
      errors.push(`[SPAWN DISTRACTOR VIOLATION] Insufficient distractor diversity: ${report.distractorValuesPresent.length} < 3 distinct distractors found for initial board.`);
    }

    const totalFactorsAndSpecials = (report.valueCounts[1] || 0) + (report.valueCounts[ZERO_TILE_VALUE] || 0) + 
      Object.keys(report.valueCounts).filter(v => profile.coreFactors.includes(Number(v))).reduce((acc, v) => acc + report.valueCounts[Number(v)], 0);
    
    const relevantShare = totalFactorsAndSpecials / report.totalTiles;
    if (relevantShare < 0.35) {
      errors.push(`[SPAWN CROWDING VIOLATION] Distractors are crowding the board: only ${(relevantShare * 100).toFixed(1)}% of tiles are target-relevant (need >= 35%).`);
    }
  }

  if (errors.length > 0) {
    const errorMsg = `[SPAWN AUDIT FAILURE]\n${errors.join('\n')}\nAudit Summary: ${report.summary}`;
    console.error(errorMsg, report);
    throw new Error(errorMsg);
  }
}

export function runInitialSpawnAudit(target: number, profile: any): SpawnAuditReport {
  const prng = () => Math.random();
  const coreFactors = profile.coreFactors;
  const distractors = profile.distractors;
  const N = 30; 
  
  const values: number[] = [];
  if (coreFactors.length >= 2) {
    values.push(coreFactors[0], coreFactors[1]);
  } else {
    values.push(coreFactors[0] || 2, coreFactors[0] || 2);
  }
  
  const categories = [
    ...Array(Math.floor((N - 2) * 0.45)).fill(TargetCategory.FACTOR),
    ...Array(Math.floor((N - 2) * 0.45)).fill(TargetCategory.DISTRACTOR),
    ...Array(Math.floor((N - 2) * 0.10)).fill(TargetCategory.ONE)
  ];
  
  while(values.length < N) {
    const cat = categories[Math.floor(Math.random() * categories.length)] || TargetCategory.DISTRACTOR;
    if (cat === TargetCategory.FACTOR) values.push(coreFactors[Math.floor(Math.random() * coreFactors.length)]);
    else if (cat === TargetCategory.DISTRACTOR) values.push(distractors[Math.floor(Math.random() * distractors.length)]);
    else values.push(1);
  }

  const report = auditSpawnOutput(values, target, profile, "initial");
  enforceSpawnQuality(report, profile);
  return report;
}
────────────────────────────────────────────────────────────────────────────────
