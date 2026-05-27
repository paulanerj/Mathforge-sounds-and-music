────────────────────────────────────────────────────────────────────────────────
export const ROWS = 7;
export const COLS = 5;
export const ROUNDS_PER_SESSION = 5;
export const STALEMATE_VALID_THRESHOLD = 1;

export const ROUND_DURATION_SECS = 90;
export const CLEAR_MS = 320;
export const ROUND_OVER_AUTOADVANCE_MS = 2000;

export const TILE_VAL_MIN = 1;
export const TILE_VAL_MAX = 9;

export const ZERO_TILE_VALUE = 100;
export const BOMB_TILE_VALUE = 99;

export const BOMB_FUSE_MS = 2000;          
export const BOMB_TROPHIES_PER_SPAWN = 10; 
export const BOMB_STAGGER_MS = 100;        

// Performance Guard Constants
export const CG_MAX_BOMB_PARTICLES = 36;
export const CG_PARTICLES_PER_TILE = 3;
export const CG_PARTICLE_DURATION_MS = 450;
export const CG_RESULT_PARTICLES_ENABLED = true;
export const CG_RESULT_COUNT_MODE: string = "simple"; // "instant" or "simple"

// WILDCARD_ANIM_CONTRACT
export const WILDCARD_ANIM = {
  DURATION_MS: 1000,
  TICK_MS: 50,
  SHAKE_FREQ_BASE: 15,
  SHAKE_FREQ_MULT: 400,
  AMP_BREAKPOINT: 0.8,
  AMP_START_BASE: 0.5,
  AMP_START_MULT: 1.5,
  AMP_END_BASE: 2,
  AMP_END_MULT: 5,
  ROW_OFFSET_MULT: 13,
  COL_OFFSET_MULT: 17,
  Y_PHASE_OFFSET: 1.1,
  GROW_BASE: 1,
  GROW_MULT: 0.15,
};
────────────────────────────────────────────────────────────────────────────────
