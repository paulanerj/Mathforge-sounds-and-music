# SPEEDGRID SETTINGS RUNTIME MAP

## 1. SETTINGS AUTHORITY MODEL
Settings follow a **Controlled Commitment Lifecycle**:
1. **Mutation**: User edits `draftSettings` via the UI.
2. **Apply**: User clicks "APPLY", dispatching `APPLY_SETTINGS`.
3. **Synchronization**: Reducer commits `draftSettings` to `settings` and determines if a board regeneration is needed.

## 2. SETTING REACTION MAP

| Setting Key | Reaction Level | Impact Path |
| :--- | :--- | :--- |
| `targetSource` | **BOARD REGEN** | Target Generator -> Board Filler |
| `multiplesConfig`| **BOARD REGEN** | Multiples Logic -> Targets |
| `numberPool` | **BOARD REGEN** | Random Solver -> Tile Weights |
| `rangeConfig` | **BOARD REGEN** | Range Logic -> Targets |
| `specificConfig` | **BOARD REGEN** | Static List -> Targets |
| `operationMode` | **BOARD REGEN** | Sum calculation logic |
| `gridSize` | **RESTART** | `generateInitialState` (Dimensions) |
| `activeProfileId`| **RESTART** | Full Profile load |
| `timeLimit` | **RESTART** | Initial `timeLeft` |
| `multiTouchMode` | **LIVE** | Input logic branching |
| `devMode` | **LIVE** | UI Overlays & HUD visibility |
| `diagnosticMode`| **LIVE** | Trace capture frequency |
| `showGravityVisuals`| **LIVE** | Tile ring rendering |

## 3. REGENERATION RULES
If a setting requiring **BOARD REGEN** is committed, the Reducer must:
1. Re-run `generateInitialState`.
2. Compute new `activeProfile` derived from the new `settings`.
3. Preserve established metrics (Score, Progress) if applicable, or reset if logically necessary.

## 4. FORBIDDEN ACTIONS
- **Silent Mutation**: No setting may be changed without an explicit user action (APPLY/RESTART).
- **Inconsistent Regen**: Any setting change affecting the number distribution (e.g., `numberPool`) MUST trigger a fresh board fill to maintain mathematical integrity.