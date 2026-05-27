────────────────────────────────────────────────────────────────────────────────
export type ProfileId = 'easy' | 'medium' | 'hard';

export interface PracticeProfile {
  readonly id: ProfileId;
  readonly tileMin: number;
  readonly tileMax: number;
  readonly targetSumMin: number;
  readonly targetSumMax: number;
  readonly targetProductMin: number;
  readonly targetProductMax: number;
  readonly timeLimitSeconds: number;
  readonly bonusTileProbability: number;
}

export const PRACTICE_PROFILES: Record<ProfileId, PracticeProfile> = {
  easy: {
    id: 'easy',
    tileMin: 1,
    tileMax: 5,
    targetSumMin: 14,
    targetSumMax: 21,
    targetProductMin: 4,
    targetProductMax: 25,
    timeLimitSeconds: 75,
    bonusTileProbability: 0.30,
  },
  medium: {
    id: 'medium',
    tileMin: 1,
    tileMax: 9,
    targetSumMin: 21,
    targetSumMax: 28,
    targetProductMin: 4,
    targetProductMax: 81,
    timeLimitSeconds: 60,
    bonusTileProbability: 0.25,
  },
  hard: {
    id: 'hard',
    tileMin: 2,
    tileMax: 12,
    targetSumMin: 28,
    targetSumMax: 35,
    targetProductMin: 20,
    targetProductMax: 150,
    timeLimitSeconds: 45,
    bonusTileProbability: 0.15,
  },
};

export function getProfile(id: ProfileId): PracticeProfile {
  const profile = PRACTICE_PROFILES[id];
  if (!profile) {
    throw new Error(`[PracticeProfile] Unknown profile id: "${id}"`);
  }
  return profile;
}

export const DEFAULT_PROFILE_ID: ProfileId = 'easy';
────────────────────────────────────────────────────────────────────────────────
