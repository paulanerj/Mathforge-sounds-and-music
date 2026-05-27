────────────────────────────────────────────────────────────────────────────────
# SPEEDGRID SYSTEM BOUNDARIES

## 1. THE REDUCER BOUNDARY
The Reducer is the **State Authority**.
- **Input**: `SpeedGridAction` + `SpeedGridState`.
- **Output**: A new, immutable `SpeedGridState`.
- **Allowed**: Math logic, board reordering, target generation, setting updates.
- **Forbidden**: `setTimeout`, DOM access, `performance.now()` (use `Date.now()` or action timestamp), `Math.random()` (must be seeded or handled outside if deterministic replay is required).

## 2. THE RENDER BOUNDARY
The Render Layer is the **Visual Projector**.
- **Authority**: Animating transitions, rendering trails, displaying HUD.
- **Constraints**: 
    - Must NOT modify board state.
    - Must NOT calculate sums (use `pathSums` from state).
    - Must NOT determine if a path is a "Success" (use `pathStatus` from state).
    - Must only use `instanceId` for keying tiles, never `index` or `value`.

## 3. THE INPUT BOUNDARY
The Input Layer is the **Event Filter**.
- **Function**: Capture `PointerEvents`, normalize to `(ux, uy)` coordinates, and dispatch to Reducer.
- **Constraints**:
    - Normalized coordinates must be used to ensure resolution independence.
    - Pointer isolation must be maintained until the Reducer merges paths.

## 4. THE SETTINGS BOUNDARY
The Settings System is **Dual-Staged**.
1. **Draft Stage**: User interacts with `draftSettings`. High-frequency UI updates. No gameplay impact.
2. **Commit Stage**: `APPLY_SETTINGS` action. Commits `draftSettings` to `activeSettings`.
3. **Runtime consumption**: Systems observe `activeSettings` ONLY. Silent live-mutations to active settings are strictly forbidden.
────────────────────────────────────────────────────────────────────────────────
