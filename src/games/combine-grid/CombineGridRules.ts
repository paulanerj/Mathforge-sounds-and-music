import { GridPos, BaseGridState } from '../../engine/grid/GridTypes';
import { GridGameRules } from '../../engine/grid/GridRules';
import { TargetProfile, TargetCategory, getBalancedBags } from '../../engine/SpawnEngine';
import { EvalMode, GameMode, GamePhase } from './types';
import { PracticeProfile } from '../../engine/PracticeProfile';
import { ROWS, COLS, ROUNDS_PER_SESSION, ROUND_DURATION_SECS, ZERO_TILE_VALUE, BOMB_TILE_VALUE, BOMB_TROPHIES_PER_SPAWN } from './constants';
import { evaluateSelection, hasSolution, validateBoard, isRoundComplete, countCombinableTiles, hasBombs } from './services/GridService';
import { toggleTile } from './services/SelectionService';
import { createTargetProfile, makePrng } from '../../engine/public';
import { drawBatchFromEngine, SpawnConfiguration } from '../../engine/grid/SpawnManager';
import { CombineGridSpawnStrategy } from './CombineGridSpawnStrategy';
import { assertPosition, assertPositions } from './debug/assertPosition';
import { auditSpawnOutput, enforceSpawnQuality, SpawnAuditReport } from './debug/cgSpawnAudit';

export interface CGState extends BaseGridState {
  phase: GamePhase;
  mode: EvalMode;
  bonusMask: boolean[][];
  trophyMask: boolean[][];
  frozenMask: boolean[][];
  trophyCount: number;
  dragSource: GridPos | null;
  ignitedBombPos: GridPos | null;
  target: number;
  targetProfile: TargetProfile;
  selectionVal: number;
  score: number;
  roundScore: number;
  roundsCompleted: number;
  roundScores: number[];
  timeLeft: number;
  clearingPositions: GridPos[];
  respawnPositions: GridPos[];
  zeroRespawnPositions: GridPos[];
  pendingBombSpawn: boolean;
  gameMode: GameMode;
  practiceGroups: number[];
  recipeTargets: number[];
  recipeIndex: number;
  factorBag: number[];
  distractorBag: number[];
  oneBag: number[];
  zeroBag: number[];
  categoryBag: TargetCategory[];
  counts: { [key: number]: number };
  recentSpawns: number[];
  history: CGState | null;
  logEvents: string[];
  countingIndex: number;
  countedTrophies: GridPos[];
  lastEquation: { id: string, values: number[], target: number, pos?: {row: number, col: number} } | null;
  phaseTimer: number;
  version: number;
}

export type Action =
  | { type: 'TICK'; deltaMs?: number; version?: number }
  | { type: 'TAP_TILE'; pos: GridPos; version?: number }
  | { type: 'DRAG_START'; pos: GridPos; version?: number }
  | { type: 'DRAG_DROP'; src: GridPos; dst: GridPos; version?: number }
  | { type: 'DRAG_CANCEL' }
  | { type: 'CLEAR_COMPLETE'; profile: PracticeProfile; seed: number; version?: number }
  | { type: 'ADVANCE_ROUND'; profile: PracticeProfile; seed: number; version?: number }
  | { type: 'RESOLVE_STALEMATE'; target: number; version?: number }
  | { type: 'BOMB_EXPLODE'; center: GridPos; version?: number }
  | { type: 'IGNITE_BOMB'; pos: GridPos; version?: number }
  | { type: 'SPAWN_BOMB'; pos: GridPos }
  | { type: 'NEXT_TARGET'; profile: PracticeProfile; prng: () => number }
  | { type: 'PREV_TARGET'; profile: PracticeProfile; prng: () => number }
  | { type: 'COUNT_NEXT_TROPHY'; version?: number }
  | { type: 'FINISH_COUNTING'; version?: number }
  | { type: 'RESET_SESSION'; newState: CGState }
  | { type: 'PLAY_AGAIN'; newState: CGState }
  | { type: 'UNDO' };

function getSpawnConfig(state: CGState): SpawnConfiguration {
  return {
    target: state.target,
    bags: {
      [TargetCategory.FACTOR]: state.factorBag,
      [TargetCategory.DISTRACTOR]: state.distractorBag,
      [TargetCategory.ONE]: state.oneBag,
      [TargetCategory.ZERO]: state.zeroBag
    },
    diversity: {
      minDistinctFactors: 3,
      minDistinctDistractors: 3,
      maxDominancePercent: 0.25
    },
    antiStreakLimit: 3
  };
}

const CG_DEBUG = false;

function drawSpawnBatch(
  count: number,
  state: CGState,
  prng: () => number,
  isZeroSource: boolean = false,
  source: string = "UNKNOWN"
) {
  const N = state.rows * state.cols;
  const strategy = new CombineGridSpawnStrategy();
  const path = source === "ZERO" ? "zero" : source === "BOMB" ? "bomb" : "merge";

  const resp = strategy.generate({
    target: state.target,
    path,
    count,
    context: {
      prng,
      categoryBag: state.categoryBag,
      rows: state.rows,
      cols: state.cols
    }
  });

  const batchCategories = resp.categories;
  const categoryBag = resp.updatedCategoryBag || state.categoryBag;

  const engineConfig = getSpawnConfig(state);

  const refillThreshold = count + 10;
  if (engineConfig.bags[TargetCategory.FACTOR].length < refillThreshold || 
      engineConfig.bags[TargetCategory.DISTRACTOR].length < refillThreshold) {
    const freshBags = getBalancedBags(state.targetProfile, prng, ZERO_TILE_VALUE);
    engineConfig.bags[TargetCategory.FACTOR] = [...(state.factorBag || []), ...freshBags.factors];
    engineConfig.bags[TargetCategory.DISTRACTOR] = [...(state.distractorBag || []), ...freshBags.distractors];
    engineConfig.bags[TargetCategory.ONE] = [...(state.oneBag || []), ...freshBags.ones];
    engineConfig.bags[TargetCategory.ZERO] = [...(state.zeroBag || []), ...freshBags.zeros];
  }

  const res = drawBatchFromEngine(
    count,
    batchCategories,
    engineConfig,
    state.recentSpawns,
    state.counts,
    N,
    prng,
    source
  );

  const auditPath = source === "BOMB" ? "bomb-refill" : source === "ZERO" ? "zero-refill" : "merge-refill";
  const report = auditSpawnOutput(res.values, state.target, state.targetProfile, auditPath);
  if (CG_DEBUG) {
    console.log(`[SPAWN_AUDIT] ${source} Categories:`, batchCategories);
    console.log(`[SPAWN_AUDIT] ${source} Result:`, report);
  }
  
  enforceSpawnQuality(report, state.targetProfile, 0.40);

  return {
    values: res.values,
    bags: res.updatedBags,
    categoryBag,
    counts: state.counts, 
    recent: state.recentSpawns,
    log: res.log
  };
}

function decrementCount(counts: { [key: number]: number }, val: number) {
  if (counts[val] !== undefined && counts[val] > 0) counts[val]--;
}

function applySwap(state: CGState, src: GridPos, dst: GridPos): CGState {
  assertPosition(src, state.board, 'applySwap.src');
  assertPosition(dst, state.board, 'applySwap.dst');

  // Prevent swapping if one of the tiles is an ignited bomb
  if (state.ignitedBombPos) {
    if ((src.row === state.ignitedBombPos.row && src.col === state.ignitedBombPos.col) ||
        (dst.row === state.ignitedBombPos.row && dst.col === state.ignitedBombPos.col)) {
      return { ...state, dragSource: null };
    }
  }

  const swap2D = <T>(grid: T[][], aVal: T, bVal: T): T[][] =>
    grid.map((r, ri) =>
      r.map((v, ci) => {
        if (ri === src.row && ci === src.col) return bVal;
        if (ri === dst.row && ci === dst.col) return aVal;
        return v;
      }),
    );
  const srcBoard = state.board[src.row][src.col];
  const dstBoard = state.board[dst.row][dst.col];
  return {
    ...state,
    board: swap2D(state.board, srcBoard, dstBoard),
    trophyMask: swap2D(state.trophyMask, state.trophyMask[src.row][src.col], state.trophyMask[dst.row][dst.col]),
    frozenMask: swap2D(state.frozenMask, state.frozenMask[src.row][src.col], state.frozenMask[dst.row][dst.col]),
    bonusMask: swap2D(state.bonusMask, state.bonusMask[src.row][src.col], state.bonusMask[dst.row][dst.col]),
    dragSource: null, selection: [], selectionVal: 0,
    clearingPositions: [], respawnPositions: [], zeroRespawnPositions: [],
    version: state.version + 1
  };
}

function clearPos(board: number[][], trophyMask: boolean[][], frozenMask: boolean[][], bonusMask: boolean[][], pos: GridPos) {
  assertPosition(pos, board, 'clearPos');
  const { row, col } = pos;
  const at = (r: number, c: number, orig: any, cleared: any) => r === row && c === col ? cleared : orig;
  return {
    board: board.map((r, ri) => r.map((v, ci) => at(ri, ci, v, 0))),
    trophyMask: trophyMask.map((r, ri) => r.map((v, ci) => at(ri, ci, v, false))),
    frozenMask: frozenMask.map((r, ri) => r.map((v, ci) => at(ri, ci, v, false))),
    bonusMask: bonusMask.map((r, ri) => r.map((v, ci) => at(ri, ci, v, false))),
  };
}

function applyTrophyCreation(state: CGState, src: GridPos, dst: GridPos, result: number): CGState {
  let nc = { ...state.counts || {} }; 
  decrementCount(nc, state.board[src.row][src.col]); 
  decrementCount(nc, state.board[dst.row][dst.col]);
  
  const cl = clearPos(state.board, state.trophyMask, state.frozenMask, state.bonusMask, src);
  let nb = cl.board.map((r, ri) => r.map((v, ci) => (ri === dst.row && ci === dst.col ? state.target : v)));
  const ntm = cl.trophyMask.map((r, ri) => r.map((v, ci) => (ri === dst.row && ci === dst.col ? true : v)));
  const nbm = cl.bonusMask.map((r, ri) => r.map((v, ci) => (ri === dst.row && ci === dst.col ? false : v)));
  const ntc = state.trophyCount + 1;
  
  let seed = state.seed; 
  const prng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  
  let bombPos: GridPos | null = null;
  if (ntc > 0 && ntc % BOMB_TROPHIES_PER_SPAWN === 0) {
    const cand: GridPos[] = [];
    for (let r = 0; r < state.rows; r++) for (let c = 0; c < state.cols; c++) {
      if (r === dst.row && c === dst.col) continue;
      if (!ntm[r][c] && !state.frozenMask[r][c] && nb[r][c] !== BOMB_TILE_VALUE && nb[r][c] !== 0) cand.push({ row: r, col: c });
    }
    if (cand.length > 0) { 
      bombPos = safePick(cand, prng, 'bomb', state.board); 
      nb = nb.map((r, ri) => r.map((v, ci) => (ri === bombPos!.row && ci === bombPos!.col ? BOMB_TILE_VALUE : v))); 
    }
  }

  const ns: CGState = { 
    ...state, 
    board: nb, 
    trophyMask: ntm, 
    frozenMask: cl.frozenMask, 
    bonusMask: nbm, 
    trophyCount: ntc, 
    seed, 
    dragSource: null, 
    selection: [], 
    selectionVal: 0, 
    phase: 'CLEARING', 
    phaseTimer: 0,
    clearingPositions: [src], 
    respawnPositions: [], 
    zeroRespawnPositions: [], 
    score: state.score + result, 
    roundScore: state.roundScore + result, 
    counts: nc,
    lastEquation: {
      id: `merge-trophy-${Date.now()}`,
      values: [state.board[src.row][src.col], state.board[dst.row][dst.col]],
      target: result,
      pos: { row: dst.row, col: dst.col }
    }
  };
  
  const expected = [src, dst];
  if (bombPos) expected.push(bombPos);
  CombineGridRules.verifyIntegrity(state, ns, 'DRAG_DROP (TROPHY)', expected);
  return ns;
}

function safePick<T>(arr: T[], rng: () => number, context: string, board?: any[][]): T {
  if (!arr || arr.length === 0) {
    throw new Error(`[SAFE PICK FAILED] ${context} empty`);
  }
  const idx = Math.floor(rng() * arr.length);
  const pick = arr[Math.max(0, Math.min(idx, arr.length - 1))];
  
  if (board && pick && typeof (pick as any).row === 'number') {
    assertPosition(pick as any, board, context);
  }
  
  return pick;
}

function pickValidFactorPair(target: number, rng: () => number): { a: number, b: number } {
  const pairs: { a: number, b: number }[] = [];
  for (let i = 2; i <= 9; i++) {
    if (target % i === 0) {
      const other = target / i;
      if (other >= 2 && other <= 9) pairs.push({ a: i, b: other });
    }
  }
  if (pairs.length > 0) return safePick(pairs, rng, 'pickValidFactorPair');
  for (let i = 2; i <= target / 2; i++) {
    if (target % i === 0) return { a: i, b: target / i };
  }
  return { a: 1, b: target };
}

function assertValidPositions(arr: GridPos[], context: string, board: any[][]) {
  for (let i = 0; i < arr.length; i++) {
    assertPosition(arr[i], board, `${context}[${i}]`);
  }
}

export const CombineGridRules: GridGameRules<CGState, Action> = {
  isValidPos(pos: GridPos | null | undefined, state: CGState): pos is GridPos {
    if (!pos || typeof pos.row !== 'number' || typeof pos.col !== 'number') return false;
    return pos.row >= 0 && pos.row < state.rows && pos.col >= 0 && pos.col < state.cols;
  },

  name: 'CombineGrid',

  generateInitialState(config: {
    profile: PracticeProfile;
    prng: () => number;
    seed: number;
    mode?: EvalMode;
    rows?: number;
    cols?: number;
    gameMode?: GameMode;
    practiceGroups?: number[];
    recipeTargets?: number[];
    recipeIndex?: number;
    overrideTarget?: number;
  }): CGState {
    const { profile, prng, seed, mode = 'product', rows = ROWS, cols = COLS, gameMode = 'practice', practiceGroups = [2, 3, 4, 5, 6], recipeTargets = [12, 15, 24, 32, 56], recipeIndex = 0, overrideTarget } = config;
    let currentSeed = seed;
    let globalAttempts = 0;
    
    while (globalAttempts < 100) {
      globalAttempts++;
      let target = overrideTarget || 0;
      if (!target) {
        if (gameMode === 'recipe') {
          const idx = ((recipeIndex % recipeTargets.length) + recipeTargets.length) % recipeTargets.length;
          target = recipeTargets[idx];
        } else if (gameMode === 'practice') target = safePick(practiceGroups, prng, 'init') * (Math.floor(prng() * 8) + 2);
        else {
          const base = [2, 3, 4, 5, 6, 7, 8, 9];
          target = safePick(base, prng, 'f1') * safePick(base, prng, 'f2');
        }
      }

      let effectiveProfile = { ...profile };
      const possibleFactors = [];
      for (let i = 2; i <= 9; i++) if (target % i === 0) possibleFactors.push(i);
      const maxNeededFactor = possibleFactors.length > 0 ? Math.max(...possibleFactors) : 0;
      if (maxNeededFactor > effectiveProfile.tileMax) {
        effectiveProfile.tileMax = Math.max(effectiveProfile.tileMax, maxNeededFactor);
      }

      const targetProfile = createTargetProfile(target, effectiveProfile);
      const N = rows * cols;
      const dominanceLimit = Math.floor(N * 0.25); 

      const values: number[] = [];
      const counts: { [key: number]: number } = {};
      const addValue = (v: number) => {
        values.push(v);
        counts[v] = (counts[v] || 0) + 1;
      };

      for (let i = 0; i < 4; i++) {
        const pair = pickValidFactorPair(target, prng);
        addValue(pair.a);
        addValue(pair.b);
      }

      for (let i = 0; i < 3; i++) {
        addValue(1);
        addValue(ZERO_TILE_VALUE);
      }

      const allFactors = [...targetProfile.coreFactors, ...targetProfile.secondaryFactors];
      const distractors = [...targetProfile.distractors];
      
      const stateBags = getBalancedBags(targetProfile, prng, ZERO_TILE_VALUE);
      const strategy = new CombineGridSpawnStrategy();
      const initialCats = strategy.generate({ 
        target,
        path: "initial", 
        count: N, 
        context: { prng, rows, cols } 
      }).categories;
      const categoryBag = strategy.generate({
        target,
        path: "merge", 
        count: N * 4, 
        context: { prng, rows, cols } 
      }).categories;

      const poolFactors = [...allFactors];
      const poolDistractors = [...distractors];
      
      let fIdx = 0;
      let dIdx = 0;
      let catIdx = 14; 
      
      while (values.length < N) {
        const cat = initialCats[catIdx++];
        let candidate: number;
        
        if (cat === TargetCategory.FACTOR && poolFactors.length > 0) {
           candidate = poolFactors[fIdx % poolFactors.length];
           fIdx++;
        } else if (poolDistractors.length > 0) {
           candidate = poolDistractors[dIdx % poolDistractors.length];
           dIdx++;
        } else {
           candidate = 7; 
        }

        if ((counts[candidate] || 0) < dominanceLimit) {
          addValue(candidate);
        } else {
          let found = false;
          const searchPool = (cat === TargetCategory.FACTOR) ? poolFactors : poolDistractors;
          for (let offset = 1; offset < searchPool.length; offset++) {
            const currentIdx = (cat === TargetCategory.FACTOR) ? fIdx : dIdx;
            const alt = searchPool[(currentIdx + offset) % searchPool.length];
            if ((counts[alt] || 0) < dominanceLimit) {
              addValue(alt);
              found = true;
              break;
            }
          }
          if (!found) {
            const otherPool = (cat === TargetCategory.FACTOR) ? poolDistractors : poolFactors;
            for (const alt of otherPool) {
               if ((counts[alt] || 0) < dominanceLimit) {
                 addValue(alt);
                 found = true;
                 break;
               }
            }
            if (!found) addValue(candidate); 
          }
        }
      }

      const shuffledValues = [...values];
      for (let i = shuffledValues.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        [shuffledValues[i], shuffledValues[j]] = [shuffledValues[j], shuffledValues[i]];
      }

      let p1Idx = -1;
      let p2Idx = -1;
      for (let i = 0; i < shuffledValues.length; i++) {
        for (let j = i + 1; j < shuffledValues.length; j++) {
            if (shuffledValues[i] * shuffledValues[j] === target) {
              p1Idx = i;
              p2Idx = j;
              break;
            }
        }
        if (p1Idx !== -1) break;
      }

      if (p1Idx !== -1 && p2Idx !== -1) {
          const v1 = shuffledValues[p1Idx];
          const v2 = shuffledValues[p2Idx];
          shuffledValues.splice(p2Idx, 1);
          shuffledValues.splice(p1Idx, 1);
          shuffledValues.unshift(v2);
          shuffledValues.unshift(v1);
      }

      const board: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
      let vIdx = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          board[r][c] = shuffledValues[vIdx++];
        }
      }

      const initialReport = auditSpawnOutput(board.flat(), target, targetProfile, "initial");
      if (CG_DEBUG) console.log("[SPAWN_AUDIT] initial", initialReport);
      
      try {
        enforceSpawnQuality(initialReport, targetProfile, 0.25);
      } catch (e) {
        if (CG_DEBUG) console.warn("[SPAWN_AUDIT] Initial board audit failure:", e);
        if (globalAttempts < 100) {
           currentSeed++;
           continue; 
        } else {
           console.warn("[RECOVERY] Max retries reached for spawn audit. Yielding sub-optimal board.");
        }
      }

      if (hasSolution(board, target, mode, [], []) || globalAttempts > 50) {
        const flatBoard = board.flat();
        const N = rows * cols;
        const dominanceLimitValue = Math.floor(N * 0.25);
        
        const onesCount = flatBoard.filter(v => v === 1).length;
        const zerosCount = flatBoard.filter(v => v === ZERO_TILE_VALUE).length;

        const v1 = board[0][0];
        const v2 = board[0][1];
        const isG1Valid = (v1 * v2 === target);

        const presentValues = new Set(flatBoard);
        const coreFactors = [...targetProfile.coreFactors];
        const missingFactors = coreFactors.filter(f => !presentValues.has(f));
        const factorTypeCount = coreFactors.length;
        const totalFactorTiles = flatBoard.filter(v => coreFactors.includes(v)).length;
        const minFactorCount = Math.max(4, factorTypeCount * 2);

        const countsByValue: {[key: number]: number} = {};
        flatBoard.forEach(v => countsByValue[v] = (countsByValue[v] || 0) + 1);
        const dominantValues = Object.entries(countsByValue).filter(([v, count]) => count > dominanceLimitValue && Number(v) > 0);

        const distractorTiles = flatBoard.filter(v => targetProfile.distractors.includes(v));
        const distinctDistractorValues = new Set(distractorTiles);
        const maxDistractorCount = Math.max(0, ...Object.entries(countsByValue)
            .filter(([v]) => targetProfile.distractors.includes(Number(v)))
            .map(([, c]) => c as number));
        
        let validPairCount = 0;
        const pairTilePositions: GridPos[] = [];
        for (let r1 = 0; r1 < rows; r1++) {
          for (let c1 = 0; c1 < cols; c1++) {
            for (let r2 = 0; r2 < rows; r2++) {
              for (let c2 = 0; c2 < cols; c2++) {
                if (r1 === r2 && c1 === c2) continue;
                if (board[r1][c1] * board[r2][c2] === target) {
                  validPairCount++;
                  pairTilePositions.push({ row: r1, col: c1 });
                  pairTilePositions.push({ row: r2, col: c2 });
                }
              }
            }
          }
        }
        const uniquePairPositions = Array.from(new Set(pairTilePositions.map(p => `${p.row},${p.col}`)))
            .map(s => { const [r, c] = s.split(',').map(Number); return { row: r, col: c }; });

        const midR = rows / 2;
        const midC = cols / 2;
        const quadrantCounts = [0,0,0,0];
        uniquePairPositions.forEach(p => {
            const qi = (p.row < midR ? 0 : 2) + (p.col < midC ? 0 : 1);
            quadrantCounts[qi]++;
        });
        const distinctQuadrantsWithPairs = quadrantCounts.filter(c => c > 0).length;

        const isG7Valid = targetProfile.coreFactors.every(f => f <= effectiveProfile.tileMax);

        if (CG_DEBUG) {
          console.log("BOARD_INIT_VALIDATION_STRICT", {
            target,
            factorTypes: factorTypeCount,
            totalFactors: totalFactorTiles,
            distractorDiversity: distinctDistractorValues.size,
            maxDistractorCount,
            oneCount: onesCount,
            zeroCount: zerosCount,
            validPairCount: validPairCount / 2, 
            pairQuadrants: distinctQuadrantsWithPairs
          });
        }

        const errors: string[] = [];
        if (!isG1Valid) errors.push(`G1: r1c1(${v1}) and r1c2(${v2}) do not multiply to target ${target}`);
        if (missingFactors.length > 0) errors.push(`G2: Missing required factors: ${missingFactors.join(', ')}`);
        if (totalFactorTiles < minFactorCount) errors.push(`G2: Factor sufficiency failed: ${totalFactorTiles} < ${minFactorCount}`);
        if (dominantValues.length > 0) errors.push(`G9: Visual dominance detected: ${dominantValues.map(([v, c]) => `${v}:${c}`).join(', ')}`);
        if (distinctDistractorValues.size < 4) errors.push(`G4: Distractor diversity too low: ${distinctDistractorValues.size} < 4`);
        if (maxDistractorCount > dominanceLimitValue) errors.push(`G4: Distractor dominance: ${maxDistractorCount} > ${dominanceLimitValue}`);
        if (onesCount < 2 || onesCount > 3) errors.push(`G5: Ones count ${onesCount} not in range 2-3`);
        if (zerosCount < 2 || zerosCount > 3) errors.push(`G5: Zeros count ${zerosCount} not in range 2-3`);
        if (validPairCount / 2 < 3) errors.push(`G6: Less than 3 valid pairs: ${validPairCount / 2}`);
        if (distinctQuadrantsWithPairs < 3) errors.push(`G6: Spatial distribution failed: only ${distinctQuadrantsWithPairs}/4 quadrants have pairs`);
        if (!isG7Valid) errors.push(`G7: Target ${target} incompatible with tileMax ${effectiveProfile.tileMax}`);
        
      if (errors.length > 0) {
          const msg = `[GRID CONTRACT VIOLATION]\n${errors.join('\n')}`;
          if (process.env.NODE_ENV !== 'production') {
              if (CG_DEBUG) console.error(msg);
              currentSeed++;
              if (globalAttempts < 100) continue;
              else {
                  console.warn("[RECOVERY] Max retries reached for board generation. Yielding sub-optimal board to prevent crash.");
              }
          }
        }

        const bonusMask = board.map(r => r.map(() => prng() < effectiveProfile.bonusTileProbability));
        const trophyMask = board.map(r => r.map(() => false));
        const frozenMask = board.map(r => r.map(() => false));

        if (!trophyMask || !frozenMask || trophyMask.length !== rows || frozenMask.length !== rows) {
          throw new Error("[INIT FAILURE] Masks not initialized or dimension mismatch");
        }
        for (let i = 0; i < rows; i++) {
          if (trophyMask[i].length !== cols || frozenMask[i].length !== cols) {
            throw new Error(`[INIT FAILURE] Mask row ${i} dimension mismatch`);
          }
        }

        const factors: number[] = [];
        for (let v = 2; v <= 9; v++) {
          if (target % v === 0) factors.push(v);
        }
        let initialEq: { id: string, values: number[], target: number } | null = null;
        if (factors.length >= 1) {
          const f1 = factors[0];
          const f2 = target / f1;
          if (f2 >= 1 && f2 <= 9) {
            initialEq = { id: 'init-' + currentSeed, values: [f1, f2], target };
          } else {
            initialEq = { id: 'init-' + currentSeed, values: [target], target };
          }
        } else {
          initialEq = { id: 'init-' + currentSeed, values: [target], target };
        }

        return {
          phase: 'PLAY', mode, rows, cols, board,
          bonusMask,
          trophyMask,
          frozenMask,
          trophyCount: 0, seed: currentSeed, dragSource: null, ignitedBombPos: null, selection: [],
          target, targetProfile, selectionVal: 0, score: 0, roundScore: 0, roundsCompleted: 0, roundScores: [],
          timeLeft: ROUND_DURATION_SECS, clearingPositions: [], respawnPositions: [], zeroRespawnPositions: [],
          pendingBombSpawn: false, gameMode, practiceGroups, recipeTargets, recipeIndex: recipeIndex,
          factorBag: stateBags.factors, distractorBag: stateBags.distractors, oneBag: stateBags.ones, zeroBag: stateBags.zeros,
          categoryBag, counts: countsByValue, recentSpawns: shuffledValues.slice(-10), history: null, logEvents: [],
          countingIndex: 0, countedTrophies: [], lastEquation: initialEq, phaseTimer: 0, version: 1
        };
      }
      currentSeed++;
    }
    throw new Error("Failed to init board");
  },

  resolveInteraction(state: CGState, action: Action): CGState {
    if (CG_DEBUG && action.type !== 'TICK') {
       console.log("CombineGridRules.resolveInteraction:", action.type, action);
    }
    switch (action.type) {
      case 'TICK': {
        const delta = action.deltaMs ?? 0;
        let s = { ...state, phaseTimer: state.phaseTimer + delta };

        if (s.phase === 'PLAY') {
          const secondInMs = 1000;
          if (s.phaseTimer >= secondInMs) {
            const seconds = Math.floor(s.phaseTimer / secondInMs);
            s.timeLeft = Math.max(0, s.timeLeft - seconds);
            s.phaseTimer %= secondInMs;
          }
          return s;
        }

        if (s.phase === 'CLEARING') {
          return s;
        }

        return s;
      }
      case 'TAP_TILE': {
        if (action.version !== undefined && action.version !== state.version) {
          console.warn("REJECT_STALE_ACTION_TAP", { actionVersion: action.version, stateVersion: state.version });
          return state;
        }
        if (state.phase !== 'PLAY' || !this.isValidPos(action.pos, state)) return state;
        const newSel = toggleTile(state.selection, action.pos);
        const val = evaluateSelection(state.board, newSel, state.mode);
        if (val > state.target) return { ...state, selection: [], selectionVal: 0 };
        if (val === state.target && newSel.length >= 2) {
          assertValidPositions(newSel, 'TAP_TILE.newSel', state.board);
          const newCounts = { ...state.counts || {} };
          newSel.forEach(p => {
            const v = state.board[p.row][p.col];
            if (v > 0 && v !== BOMB_TILE_VALUE) decrementCount(newCounts, v);
          });
          const basePoints = newSel.reduce((a, p) => a + state.board[p.row][p.col], 0);
          const posSet = new Set(newSel.map((p) => `${p.row},${p.col}`));
          const newState: CGState = {
            ...state, phase: 'CLEARING', phaseTimer: 0,
            board: state.board.map((r, ri) => r.map((v, ci) => posSet.has(`${ri},${ci}`) ? 0 : v)),
            bonusMask: state.bonusMask.map((r, ri) => r.map((v, ci) => posSet.has(`${ri},${ci}`) ? false : v)),
            selection: [], selectionVal: 0, clearingPositions: [...newSel],
            respawnPositions: [], zeroRespawnPositions: [],
            score: state.score + basePoints, roundScore: state.roundScore + basePoints, counts: newCounts,
            lastEquation: {
              id: `tap-${Date.now()}`,
              values: newSel.map(p => state.board[p.row][p.col]),
              target: val
            },
            version: state.version + 1
          };
          this.verifyIntegrity(state, newState, 'TAP_TILE', newSel);
          return newState;
        }
        return { ...state, selection: newSel, selectionVal: val };
      }
      case 'DRAG_START': {
        if (state.phase !== 'PLAY' || !this.isValidPos(action.pos, state)) return state;
        if (state.board[action.pos.row][action.pos.col] === 0) return state;
        // Prevent drag start on ignited bomb
        if (state.ignitedBombPos && action.pos.row === state.ignitedBombPos.row && action.pos.col === state.ignitedBombPos.col) return state;
        return { ...state, dragSource: action.pos, selection: [], selectionVal: 0 };
      }
      case 'DRAG_CANCEL': return { ...state, dragSource: null };
      case 'DRAG_DROP': {
        if (state.phase !== 'PLAY') return state;
        const { src, dst } = action;
        if (action.version !== undefined && action.version !== state.version) {
          console.warn("STALE_ACTION: DRAG_DROP rejected due to version mismatch", { actionVersion: action.version, currentVersion: state.version });
          return { ...state, dragSource: null };
        }
        if (!this.isValidPos(src, state) || !this.isValidPos(dst, state)) return { ...state, dragSource: null };
        const srcVal = state.board[src.row][src.col];
        const dstVal = state.board[dst.row][dst.col];
        if (srcVal === 0 || dstVal === 0) return { ...state, dragSource: null };
        if (Math.max(Math.abs(src.row - dst.row), Math.abs(src.col - dst.col)) !== 1) return { ...state, dragSource: null };
        if (state.trophyMask[src.row][src.col] || state.trophyMask[dst.row][dst.col]) return applySwap(state, src, dst);
        if (state.frozenMask[src.row][src.col] || state.frozenMask[dst.row][dst.col]) return { ...state, dragSource: null };
        if (srcVal === BOMB_TILE_VALUE || dstVal === BOMB_TILE_VALUE) return applySwap(state, src, dst);
        if (srcVal === ZERO_TILE_VALUE || dstVal === ZERO_TILE_VALUE) {
          let b = state.board, tm = state.trophyMask, fm = state.frozenMask, bm = state.bonusMask, nc = { ...state.counts };
          for (const p of [src, dst]) { decrementCount(nc, b[p.row][p.col]); const cl = clearPos(b, tm, fm, bm, p); b = cl.board; tm = cl.trophyMask; fm = cl.frozenMask; bm = cl.bonusMask; }
          return { ...state, board: b, trophyMask: tm, frozenMask: fm, bonusMask: bm, dragSource: null, selection: [], selectionVal: 0, phase: 'CLEARING', phaseTimer: 0, clearingPositions: [src, dst], respawnPositions: [], zeroRespawnPositions: [src, dst], counts: nc, version: state.version + 1 };
        }
        const result = srcVal * dstVal;
        
        if (state.target !== 1 && ((srcVal === 1 && dstVal === state.target) || (dstVal === 1 && srcVal === state.target))) {
          return { ...applyTrophyCreation(state, src, dst, state.target), version: state.version + 1 };
        }

        if (result === state.target) {
          return { ...applyTrophyCreation(state, src, dst, result), version: state.version + 1 };
        }
        if (srcVal === 1 || dstVal === 1) {
          const val = srcVal === 1 ? dstVal : srcVal; let nc = { ...state.counts }; decrementCount(nc, state.board[src.row][src.col]); decrementCount(nc, state.board[dst.row][dst.col]); nc[val] = (nc[val] || 0) + 1;
          const cl = clearPos(state.board, state.trophyMask, state.frozenMask, state.bonusMask, src);
          let nb = cl.board.map((r, ri) => r.map((v, ci) => (ri === dst.row && ci === dst.col ? val : v)));
          let ntm = cl.trophyMask, nfm = cl.frozenMask, nbm = cl.bonusMask;
          if (srcVal !== 1) { 
            ntm = ntm.map((r, ri) => r.map((v, ci) => (ri === dst.row && ci === dst.col ? state.trophyMask[src.row][src.col] : v)));
            nfm = nfm.map((r, ri) => r.map((v, ci) => (ri === dst.row && ci === dst.col ? state.frozenMask[src.row][src.col] : v)));
            nbm = nbm.map((r, ri) => r.map((v, ci) => (ri === dst.row && ci === dst.col ? state.bonusMask[src.row][src.col] : v)));
          }
          const ns: CGState = { 
            ...state, 
            board: nb, 
            trophyMask: ntm, 
            frozenMask: nfm, 
            bonusMask: nbm, 
            dragSource: null, 
            selection: [], 
            selectionVal: 0, 
            phase: 'CLEARING', 
            phaseTimer: 0,
            clearingPositions: [src], 
            respawnPositions: [], 
            zeroRespawnPositions: [],
            lastEquation: {
              id: `merge-identity-${Date.now()}`,
              values: [srcVal, dstVal],
              target: val
            },
            version: state.version + 1
          };
          this.verifyIntegrity(state, ns, 'DRAG_DROP (IDENTITY)', [src, dst]); return ns;
        }
        if (result > state.target) {
          const cl = clearPos(state.board, state.trophyMask, state.frozenMask, state.bonusMask, src);
          const nb = cl.board.map((r, ri) => r.map((v, ci) => (ri === dst.row && ci === dst.col ? result : v)));
          const nfm = cl.frozenMask.map((r, ri) => r.map((v, ci) => (ri === dst.row && ci === dst.col ? true : v)));
          const ns: CGState = { 
            ...state, 
            board: nb, 
            trophyMask: cl.trophyMask, 
            frozenMask: nfm, 
            bonusMask: cl.bonusMask.map((r, ri) => r.map((v, ci) => (ri === dst.row && ci === dst.col ? false : v))), 
            dragSource: null, 
            selection: [], 
            selectionVal: 0, 
            phase: 'CLEARING', 
            phaseTimer: 0,
            clearingPositions: [src], 
            respawnPositions: [], 
            zeroRespawnPositions: [],
            lastEquation: {
               id: `merge-frozen-${Date.now()}`,
               values: [srcVal, dstVal],
               target: result
            },
            version: state.version + 1
          };
          this.verifyIntegrity(state, ns, 'DRAG_DROP (FROZEN)', [src, dst]); return ns;
        }
        let nc = { ...state.counts || {} }; decrementCount(nc, state.board[src.row][src.col]); decrementCount(nc, state.board[dst.row][dst.col]); if (result > 1) nc[result] = (nc[result] || 0) + 1;
        const cl = clearPos(state.board, state.trophyMask, state.frozenMask, state.bonusMask, src);
        return { 
          ...state, 
          board: cl.board.map((r, ri) => r.map((v, ci) => (ri === dst.row && ci === dst.col ? result : v))), 
          trophyMask: cl.trophyMask, 
          frozenMask: cl.frozenMask, 
          bonusMask: cl.bonusMask, 
          dragSource: null, 
          selection: [], 
          selectionVal: 0, 
          phase: 'CLEARING', 
          phaseTimer: 0,
          clearingPositions: [src], 
          respawnPositions: [], 
          zeroRespawnPositions: [], 
          counts: nc,
          lastEquation: {
            id: `merge-normal-${Date.now()}`,
            values: [srcVal, dstVal],
            target: result
          },
          version: state.version + 1
        };
      }
      case 'BOMB_EXPLODE': {
        const { center } = action; 
        if (action.version !== undefined && action.version !== state.version) {
          console.warn("STALE_ACTION: BOMB_EXPLODE rejected due to version mismatch", { actionVersion: action.version, currentVersion: state.version });
          return { ...state, ignitedBombPos: null };
        }
        if (!this.isValidPos(center, state)) return { ...state, ignitedBombPos: null };
        if (state.board[center.row][center.col] !== BOMB_TILE_VALUE) {
          const warnMsg = `BOMB_EXPLODE skipped: board value is not BOMB_TILE_VALUE (${state.board[center.row][center.col]}) at ${center.row},${center.col}`;
          console.warn(warnMsg, { center, action });
          return { ...state, ignitedBombPos: null, logEvents: [...state.logEvents, warnMsg].slice(-50) };
        }
        const dest: GridPos[] = [];
        const trace: any = {
          center,
          boardBefore: JSON.stringify(state.board),
          candidates: [] as any[]
        };
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const r = center.row + dr, c = center.col + dc;
            const inBounds = r >= 0 && r < state.rows && c >= 0 && c < state.cols;
            const cand = {
              row: r, col: c, inBounds, valueBefore: inBounds ? state.board[r][c] : null,
              trophyMask: inBounds ? state.trophyMask[r][c] : null,
              frozenMask: inBounds ? state.frozenMask[r][c] : null,
              action: 'OUT_OF_BOUNDS', valueAfter: null
            };
            if (inBounds) {
              // RISK/REWARD: Everything in the 3x3 radius is destroyed
              dest.push({ row: r, col: c });
              cand.action = 'CLEARED';
              cand.valueAfter = 0;
            }
            trace.candidates.push(cand);
          }
        }

        // Apply mutations safely without using iterative clearPos which can create garbage/refs
        const nextBoard = state.board.map(r => [...r]);
        const nextTrophy = state.trophyMask.map(r => [...r]);
        const nextFrozen = state.frozenMask.map(r => [...r]);
        const nextBonus = state.bonusMask.map(r => [...r]);
        const nextCounts = { ...(state.counts || {}) };

        for (const p of dest) {
          const v = nextBoard[p.row][p.col];
          decrementCount(nextCounts, v);
          nextBoard[p.row][p.col] = 0;
          nextTrophy[p.row][p.col] = false;
          nextFrozen[p.row][p.col] = false;
          nextBonus[p.row][p.col] = false;
        }

        trace.boardAfter = JSON.stringify(nextBoard);
        const traceStr = JSON.stringify(trace);
        console.log("BOMB_EXPLODE TRACE:", traceStr);

        const ns: CGState = { 
          ...state, 
          board: nextBoard, 
          trophyMask: nextTrophy, 
          frozenMask: nextFrozen, 
          bonusMask: nextBonus, 
          counts: nextCounts,
          dragSource: null, 
          ignitedBombPos: null,
          selection: [], 
          selectionVal: 0, 
          phase: 'CLEARING', 
          phaseTimer: 0, 
          clearingPositions: dest, 
          respawnPositions: [], 
          zeroRespawnPositions: [], 
          logEvents: [...state.logEvents, `BOMB_EXPLODE: ${traceStr}`].slice(-50),
          version: state.version + 1
        };
        this.verifyIntegrity(state, ns, 'BOMB_EXPLODE', dest); 
        return ns;
      }
      case 'IGNITE_BOMB': {
        if (action.version !== undefined && action.version !== state.version) {
          console.warn("REJECT_STALE_ACTION_IGNITE", { actionVersion: action.version, stateVersion: state.version });
          return state;
        }
        if (state.phase !== 'PLAY' || state.ignitedBombPos || !this.isValidPos(action.pos, state)) return state;
        if (state.board[action.pos.row][action.pos.col] !== BOMB_TILE_VALUE) return state;
        return { ...state, ignitedBombPos: action.pos, selection: [], selectionVal: 0, version: state.version + 1 };
      }
      case 'CLEAR_COMPLETE': {
        if (action.version !== undefined && action.version !== state.version) {
          console.warn("STALE_ACTION: CLEAR_COMPLETE rejected due to version mismatch", { actionVersion: action.version, currentVersion: state.version });
          return state;
        }
        const prng = makePrng(action.seed);
        const source = state.clearingPositions.length >= 4 ? "BOMB" : "MERGE";
        const res = drawSpawnBatch(state.clearingPositions.length, state, prng, state.zeroRespawnPositions.length > 0, source);
        
        let b = state.board.map(r => [...r]), bm = state.bonusMask.map(r => [...r]);
        let nextCounts = { ...state.counts };
        let nextRecent = [...state.recentSpawns];

        let bIdx = 0;
        state.clearingPositions.filter(p => p && typeof p.row === 'number').forEach(p => { 
          const val = res.values[bIdx++];
          b[p.row][p.col] = val; 
          bm[p.row][p.col] = prng() < action.profile.bonusTileProbability; 
          nextCounts[val] = (nextCounts[val] || 0) + 1;
          nextRecent.push(val);
        });
        
        const ns: CGState = { 
          ...state, 
          phase: 'PLAY', 
          board: b, 
          bonusMask: bm, 
          factorBag: res.bags[TargetCategory.FACTOR], 
          distractorBag: res.bags[TargetCategory.DISTRACTOR], 
          oneBag: res.bags[TargetCategory.ONE], 
          zeroBag: res.bags[TargetCategory.ZERO], 
          categoryBag: res.categoryBag, 
          counts: nextCounts, 
          recentSpawns: nextRecent.slice(-10), 
          clearingPositions: [], 
          respawnPositions: [], 
          zeroRespawnPositions: [], 
          selection: [], 
          selectionVal: 0, 
          logEvents: [...state.logEvents, res.log].slice(-100), 
          seed: action.seed,
          version: state.version + 1
        };
        this.verifyIntegrity(state, ns, 'CLEAR_COMPLETE', state.clearingPositions.filter(p => p && typeof p.row === 'number')); return ns;
      }
      case 'COUNT_NEXT_TROPHY': {
        if (state.phase !== 'COUNTING') return state;
        // Internal counting actions may have stale versions if dispatched from a long-running effect;
        // since phase already guards this, we can be more lenient.
        if (state.countingIndex >= state.countedTrophies.length) return { ...state, phase: 'SUMMARY', roundScores: [...state.roundScores, state.roundScore], roundsCompleted: state.roundsCompleted + 1, version: state.version + 1 };
        return { ...state, score: state.score + 10, roundScore: state.roundScore + 10, countingIndex: state.countingIndex + 1, version: state.version + 1 };
      }
      case 'SPAWN_BOMB': {
        const p = action.pos; if (!p) return { ...state, pendingBombSpawn: false };
        return { ...state, board: state.board.map((r, ri) => r.map((v, ci) => (ri === p.row && ci === p.col ? BOMB_TILE_VALUE : v))), bonusMask: state.bonusMask.map((r, ri) => r.map((v, ci) => (ri === p.row && ci === p.col ? false : v))), frozenMask: state.frozenMask.map((r, ri) => r.map((v, ci) => (ri === p.row && ci === p.col ? false : v))), pendingBombSpawn: false, version: state.version + 1 };
      }
      case 'FINISH_COUNTING': {
        if (state.phase !== 'COUNTING') return state;
        return { ...state, phase: 'SUMMARY', roundScores: [...state.roundScores, state.roundScore], roundsCompleted: state.roundsCompleted + 1, version: state.version + 1 };
      }
      case 'RESOLVE_STALEMATE': return { ...state, phase: 'PLAY', respawnPositions: [], zeroRespawnPositions: [], version: state.version + 1 };
      
      case 'NEXT_TARGET': {
        const nextSeed = (state.seed * 16807) % 2147483647;
        const nextRecipeIdx = (state.gameMode === 'recipe') ? (state.recipeIndex + 1) : state.recipeIndex;
        return {
          ...this.generateInitialState({
            ...state, seed: nextSeed, prng: action.prng, profile: action.profile, recipeIndex: nextRecipeIdx
          }),
          version: 1
        };
      }
      case 'PREV_TARGET': {
        const prevSeed = (state.seed * 31) % 2147483647;
        const prevRecipeIdx = (state.gameMode === 'recipe') ? (state.recipeIndex - 1) : state.recipeIndex;
        return {
          ...this.generateInitialState({
            ...state, seed: prevSeed, prng: action.prng, profile: action.profile, recipeIndex: prevRecipeIdx
          }),
          version: 1
        };
      }
      case 'PLAY_AGAIN':
      case 'RESET_SESSION':
      case 'ADVANCE_ROUND':
        if ('newState' in action && action.newState) return { ...action.newState, version: 1 };
        {
          const profileToUse = ('profile' in action) ? action.profile : state.targetProfile as any;
          const seedToUse = ('seed' in action) ? (action as any).seed : state.seed;
          const prngToUse = ('prng' in action) ? (action as any).prng : makePrng(seedToUse);
          const nextRecipeIdx = (action.type === 'ADVANCE_ROUND' && state.gameMode === 'recipe') ? (state.recipeIndex + 1) : state.recipeIndex;
          
          return {
            ...this.generateInitialState({
               profile: profileToUse,
               prng: prngToUse,
               seed: seedToUse,
               mode: state.mode,
               rows: state.rows,
               cols: state.cols,
               gameMode: state.gameMode,
               practiceGroups: state.practiceGroups,
               recipeTargets: state.recipeTargets,
               recipeIndex: nextRecipeIdx
            }),
            version: 1
          };
        }

      default: return state;
    }
  },

  checkEndCondition(state: CGState): boolean {
    return isRoundComplete(state.board, state.target, state.mode, state.trophyMask, state.frozenMask);
  },

  verifyIntegrity(oldState: CGState, newState: CGState, action: string, expectedPositions: GridPos[]): void {
    assertPositions(expectedPositions, oldState.board, 'verifyIntegrity.expectedPositions');
    const changedCells: { row: number, col: number, from: number, to: number }[] = [];
    const expectedSet = new Set(expectedPositions.map(p => `${p.row},${p.col}`));
    for (let r = 0; r < oldState.rows; r++) for (let c = 0; c < oldState.cols; c++) {
      if (oldState.board[r][c] !== newState.board[r][c]) {
        if (!expectedSet.has(`${r},${c}`)) changedCells.push({ row: r, col: c, from: oldState.board[r][c], to: newState.board[r][c] });
      }
    }
    if (changedCells.length > 0) console.warn("UNEXPECTED_CHANGE", { action, expected: expectedPositions, changedCells });

    if (action === 'CLEAR_COMPLETE') {
      const changedValues = expectedPositions.map(p => newState.board[p.row][p.col]);
      const auditPath = expectedPositions.length >= 4 ? "bomb-refill" : "merge-refill";
      const report = auditSpawnOutput(changedValues, newState.target, newState.targetProfile, auditPath);
      enforceSpawnQuality(report, newState.targetProfile, 0.40);
    }
  }
};