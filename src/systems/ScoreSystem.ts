export interface ScoreState {
  score: number;
  comboCount: number;
  comboResetKey: number;
}

export function createScoreState(): ScoreState {
  return { score: 0, comboCount: 0, comboResetKey: 0 };
}

const COMBO_TIER_SIZE = 3;
const MULTIPLIER_STEP = 0.5;
const MAX_MULTIPLIER = 5.0;

export function comboMultiplier(comboCount: number): number {
  const raw = 1 + Math.floor(comboCount / COMBO_TIER_SIZE) * MULTIPLIER_STEP;
  return Math.min(raw, MAX_MULTIPLIER);
}

export function calculatePoints(
  basePoints: number,
  comboCount: number,
  multiplierFn: (combo: number) => number = comboMultiplier,
): number {
  return Math.max(1, Math.ceil(basePoints * multiplierFn(comboCount)));
}

export function recordMatch(state: ScoreState, points: number): ScoreState {
  return {
    ...state,
    score: state.score + Math.max(0, points),
    comboCount: state.comboCount + 1,
  };
}

export function resetCombo(state: ScoreState): ScoreState {
  return {
    ...state,
    comboCount: 0,
    comboResetKey: state.comboResetKey + 1,
  };
}

export function applyPenalty(state: ScoreState, penalty: number): ScoreState {
  return {
    ...state,
    score: Math.max(0, state.score - Math.max(0, penalty)),
  };
}

export function nextMultiplier(state: ScoreState): number {
  return comboMultiplier(state.comboCount);
}

export function isAtTierBoundary(state: ScoreState): boolean {
  return state.comboCount > 0 && state.comboCount % COMBO_TIER_SIZE === 0;
}