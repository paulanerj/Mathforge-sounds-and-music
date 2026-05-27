export type TargetSource = 'multiples' | 'specific' | 'range' | 'primes' | 'factors' | 'classic';

export type TargetProfile = {
  id: string;
  label: string;
  mode: 'classic' | 'full' | 'multiples' | 'custom';
  targetSource: TargetSource;
  numberPool: number[];
  targets: number[];
  multiplesConfig?: {
    bases: number[];
    minMultiplier: number;
    maxMultiplier: number;
    maxTarget?: number;
  };
  rangeConfig?: {
    min: number;
    max: number;
  };
  specificConfig?: {
    raw: string;
    parsed: number[];
  };
  rules: {
    ensureSolvable: boolean;
    minPathLength: number;
    avoidTrivialPairs: boolean;
    operationMode: 'add' | 'multiply';
    presentationMode: 'random' | 'sequential' | 'weighted';
    cycleLength: number;
  };
};

export const CLASSIC_PROFILE: TargetProfile = {
  id: 'classic',
  label: 'Classic (1-9)',
  mode: 'classic',
  targetSource: 'classic',
  numberPool: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  targets: [10, 12, 15, 18, 20, 21, 24, 25, 27, 28, 30, 32, 35, 36, 40, 42, 45, 48, 54, 56, 63, 64, 72],
  rules: {
    ensureSolvable: true,
    minPathLength: 2,
    avoidTrivialPairs: true,
    operationMode: 'add',
    presentationMode: 'random',
    cycleLength: 3,
  },
};

export const TARGET_PROFILES: TargetProfile[] = [CLASSIC_PROFILE];