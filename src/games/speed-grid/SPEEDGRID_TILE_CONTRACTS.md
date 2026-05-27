────────────────────────────────────────────────────────────────────────────────
# SPEEDGRID TILE CONTRACTS

This document defines the properties and behaviors of the two primary tile entities.

## 1. NORMAL TILE
The standard interactive unit of the board.
- **Values**: Integers determined by `numberPool`.
- **Gameplay Role**: Used in path selection to fulfill target equations (sums/multiples/etc).
- **Gravity Behavior**: Standard vertical fall.
- **Removal**: Dissolves upon successful path resolution.
- **Forbidden**: Must never be used as a "Time Tile" unless explicit `specialType` is set.

## 2. TIME TILE
A specialized utility tile that adds life to the game.
- **Identification**: `specialType: 'time'`.
- **Gameplay Role**: 
    - **Selection**: NOT selectable in paths.
    - **Interaction**: Collected by a unique "Tap" or simple "Touch" event (determined by `resolveInteraction`).
    - **Equations**: MUST NOT be included in sum calculations.
- **Gravity Behavior**: Standard vertical fall, same as normal tiles.
- **Removal**: Bursts into particles and adds `timeBonus` to `timeLeft` upon collection.
- **Forbidden**: Must never be used as an operand in gameplay equations.
- **Lifecycle**: Spawns randomly based on `TargetProfile` weighting.
────────────────────────────────────────────────────────────────────────────────
