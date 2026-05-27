# CombineGrid Bomb & Wildcard Contract

This document defines the mathematical and visual contracts for special tiles in CombineGrid.

## 1. The Bomb (Risk/Reward Destruction)

### 1.1 Destructive Contract
- **Policy:** Risk/Reward. A bomb explosion is a high-cost/high-gain reset tool.
- **Coverage:** The bomb center and ALL tiles in a 3x3 radius are destroyed.
- **Targets:** Destruction affects Normal tiles, Wildcards, Trophies, Frozen tiles, and other Bombs. No exceptions.
- **Resolution:** Destroyed cells become `0` (Empty) and are refilled during the next `CLEAR_COMPLETE` cycle.

### 1.2 Ignition Logic
- **Trigger:** Single tap ignites the fuse.
- **Drag Safety:** Dragging/swapping a bomb does **not** ignite it.
- **Lock:** An ignited bomb cannot be moved or swapped.

### 1.3 Explosion Ripple Baseline
- **Stage 1 (0ms):** Center tile explodes (Blast animation).
- **Stage 2 (~80ms):** Orthogonal neighbors explode.
- **Stage 3 (~160ms):** Corner tiles explode.
- **Duration:** The board logic processes the destruction *after* the visual ripple completes (approx. 450ms wait).

### 1.4 Sound & Effect Intent
- **Fuse:** High-frequency sizzle/spark texture.
- **Explosion:** Muted deep thud followed by ceramic/glass shatter.
- **Undo:** Reverts the entire blast radius and restores the bomb in its pre-ignited state.

## 2. The Wildcard ("?")

### 2.1 Identity
- **User-Facing:** Renders as `?`.
- **Internal Value:** `ZERO_TILE_VALUE` (100).
- **Empty Delineation:** Internal value `0` is for empty/destroyed cells; `100` is the playable wildcard tile.

### 2.2 Combine Behavior
- **Logic:** Merging a Wildcard with ANY combinable tile results in both cells being cleared (value `0`).
- **Exclusions:** Cannot merge with Trophies or Bombs.

### 2.3 Vibration & Pop Contract
- **Duration:** ~1000ms accelerating vibration.
- **Simultaneous Pop:** Both involved tiles must pop visually and emit particles at the exact same time at the end of the vibration.
- **Sound:** Accelerating tremolo/buzz followed by a playful "spring-pop."

### 2.4 Undo Restore Rule
- Undo after a wildcard combine must restore both the wildcard and the original companion tile to their exact prior positions and values.