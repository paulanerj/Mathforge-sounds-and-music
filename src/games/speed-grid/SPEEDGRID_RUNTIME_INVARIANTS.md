────────────────────────────────────────────────────────────────────────────────
# SPEEDGRID RUNTIME INVARIANTS

These conditions must ALWAYS be true during the `PLAY` phase.

## 1. DATA INTEGRITY
- **Tile Uniqueness**: Every tile on the board Must have a unique `instanceId`. No two tiles may share an ID.
- **Stable ID**: An `instanceId` must never change during its lifetime (from spawn to removal).
- **Coordinate Integrity**: For any tile at `board[r][c]`, its internal `row` and `col` properties (if present) must match `r` and `c`.

## 2. GRAVITY INVARIANTS
- **Column Isolation**: A tile in column `C` will only ever occupy slots in column `C`. It cannot shift to `C-1` or `C+1`.
- **Top-Down Priority**: Refill tiles always populate from `row -1`, `row -2`, etc., ensuring they fall into the board from above.

## 3. INPUT INVARIANTS
- **Path Membership**: A tile in a pointer's `activePath` must exist on the board. If a tile is removed, it must be purged from all active paths.
- **Selection Union**: `selectionIds` must represent the unique union of all tiles in all `activePaths`.
- **Interpolation Continuity**: Paths must be "liquid" and continuous. No jumping over tiles without selection (handled by interpolation logic).

## 4. SETTINGS INVARIANTS
- **Apply Lock**: Active gameplay settings remain constant except during an `APPLY_SETTINGS` or `RESTART` action.
- **Dev Mode Isolation**: Diagnostic tracers (e.g., `lastGravityTrace`) must be null/empty when `devMode` or `diagnosticMode` is disabled.
────────────────────────────────────────────────────────────────────────────────
