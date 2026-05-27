# CombineGrid Stabilization Baseline (2026-05-11)

This document serves as the authoritative baseline for CombineGrid. Any deviations from these rules or architectural patterns must be explicitly approved.

---

## 1. CURRENT STABLE SYSTEMS

| System | Status | Architectural Implementation |
| :--- | :--- | :--- |
| **Grid Representation** | STABLE | `number[][]` with sidecar masks (`trophyMask`, `frozenMask`). |
| **Board Generation** | STABLE | Bag-based engine with `hasSolution` retries to ensure playability. |
| **Target Generation** | STABLE | Leverages `PracticeProfile` mathematical recipes. |
| **Merge Logic** | STABLE | Handled in `CombineGridRules.ts`: Product, Identity, Frozen, Trophy. |
| **Undo System** | STABLE | Snapshot-based (5 steps capped) in `cgReducer.ts`. |
| **Interaction** | STABLE | Multi-modal: Drag & Drop (primary) and Tap (secondary). |
| **Scoring** | STABLE | Animated sequential tallying at round end. |

---

## 2. CURRENT GAMEPLAY RULES

### 2.1 Merge Types
- **Standard Merge**: A * B < Target. Resulting tile value is `A * B`.
- **Identity Merge**: 1 * N or N * 1. Resulting tile value is `N`.
- **Trophy Creation**: A * B == Target. Resulting tile is locked in `trophyMask`.
- **Frozen Creation**: A * B > Target. Resulting tile is locked in `frozenMask`.

### 2.2 Zero Rules
- **Sentinel**: Represented by `ZERO_TILE_VALUE` (100).
- **Behavior**: Merging a Zero with ANY tile results in both cells being cleared (empty/0).
- **Combinability**: Zeros ARE considered combinable tiles for the endgame count.

### 2.3 Board Locking & Trophies
- Trophies cannot be merged.
- Trophies CAN be swapped with normal tiles or bombs during drag interaction.
- Frozen tiles cannot be moved or merged.

---

## 3. CURRENT UI / LAYOUT RULES

### 3.1 Mobile-First Optimization
- **Fullscreen Utilization**: Grid uses `1.0` of viewport width.
- **Dynamic Sizing**: Tile size = `min(availableWidth/cols, availableHeight/rows)`.
- **Vertical Stack**: HUD and Board are top-aligned to maximize vertical space.

### 3.2 HUD Design
- **Compact Header**: Rectangular equation pill, minimal spacing.
- **Counters**: Simple emoji-toggles (🏆 N) for progress tracking.
- **Z-Layers**: Base game remains below UI overlays.

---

## 4. CURRENT BOMB CONTRACT (LOCKED)

The bomb is a destructive, high-risk strategic tool used to prune difficult board states.

- **Design Philosophy**: Risk/Reward. Destroys ALL progress in the blast radius.
- **Blast Area**: 3x3 square centered on the bomb.
- **Destruction Policy**: Normal tiles, Zeros, Trophies, and Frozen tiles are ALL destroyed (value becomes 0).
- **Sequence**: Ignition (2s fuse) -> Explosion (Board modification) -> Clearing (Void state) -> Respawn (New tiles).
- **Swapping**: Bombs can be swapped with normal tiles/trophies.

---

## 5. CURRENT ENDGAME CONTRACT (LOCKED)

The round transition logic is simplified to a pure count of possible actions.

### 5.1 Trigger Condition
- **Rule**: `combinableTileCount <= 1`
- **Combinable Definition**: A tile is combinable if it is a **normal number tile** OR a **playable zero tile**.
- **Exclusions**: Trophies, Frozen tiles, and Empty (0) cells do NOT count.
- **Bomb Behavior**: Bombs are NOT combinable, but the round ends even if a bomb exists if `combinableCount <= 1` (as no merges are possible).

### 5.2 Ignored Criteria (DO NOT ADD)
- **NO Adjacency Check**: Adjacency does not matter for the trigger.
- **NO Target Check**: Solving for the target is not required to end.
- **NO Factor Pair Check**: Lack of a pair does not end the round (use bombs or wait for timer).

---

## 6. CURRENT UNDO CONTRACT

- **Snapshot Storage**: Full state saves (including masks) are captured before every destructive or merging action.
- **Depth Limit**: Capped at 5 steps to prevent memory leaks.
- **Restoration**: Restores Board, Trophy Mask, Frozen Mask, Bonus Mask, and Score.

---

## 7. CURRENT KNOWN RISKS
- **Solvability Gaps**: Short-range solver ensures a solution exists, but doesn't guarantee a "Full Clear" path.
- **Refill Style**: In-place pop-in (lack of gravity) may feel static; adding gravity is high-risk.
- **History Growth**: Large boards may still incur memory costs if depth isn't strictly controlled.

---

## 8. FUTURE POLISH-SAFE AREAS
- Particle effects (explosions, merge glows).
- Audio cues (success pings, bomb fuse sizzling).
- Subtle tile animations (jiggle on invalid move).
- HUD styling (borders, gradients, backgrounds).

---

## 9. FORBIDDEN CHANGES (DO NOT TOUCH)
- **NO Changes to SpeedGrid**: Do not touch shared engine code that affects SpeedGrid.
- **NO Gravity Refactor**: Do not attempt to move from `number[][]` to `TileObject[]` without architectural review.
- **NO Complex Solvers**: Do not re-introduce adjacency-based endgame detection.
- **NO Mask Refactor**: `trophyMask` and `frozenMask` must remain separate from the core `board` array for UNDO stability.

---
*Status: STABILIZED (2026-05-11)*