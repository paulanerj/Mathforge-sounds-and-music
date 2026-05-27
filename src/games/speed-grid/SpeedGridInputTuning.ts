────────────────────────────────────────────────────────────────────────────────
export const INPUT_TUNING = {
  // Corner and Diagonal Detection
  CORNER_THRESHOLD: 0.42,
  SOFT_CORNER_THRESHOLD: 0.55,
  DIAGONAL_BIAS: 0.22,
  
  // Snap Behavior
  SNAP_RELEASE_FACTOR: 0.6, // Multiplier for tileSize
  
  // Grid Navigation
  INTERPOLATION_STEP_LIMIT: 6,
  
  // Interaction Timings
  FAIL_RESET_DELAY_MS: 350,
  SUCCESS_HOLD_MS: 250,
};

export type InputTuningConfig = typeof INPUT_TUNING;

export const TUNING_PRESETS = {
  STRICT: {
    CORNER_THRESHOLD: 0.30,
    SOFT_CORNER_THRESHOLD: 0.40,
    DIAGONAL_BIAS: 0.20,
    SNAP_RELEASE_FACTOR: 0.4,
  },
  BALANCED: {
    CORNER_THRESHOLD: 0.42,
    SOFT_CORNER_THRESHOLD: 0.55,
    DIAGONAL_BIAS: 0.22,
    SNAP_RELEASE_FACTOR: 0.6,
  },
  FORGIVING: {
    CORNER_THRESHOLD: 0.50,
    SOFT_CORNER_THRESHOLD: 0.65,
    DIAGONAL_BIAS: 0.50,
    SNAP_RELEASE_FACTOR: 0.8,
  }
};
────────────────────────────────────────────────────────────────────────────────
