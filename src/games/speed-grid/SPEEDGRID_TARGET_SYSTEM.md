# SPEEDGRID TARGET SYSTEM

## 1. TARGET GENERATION MODES

SpeedGrid supports multiple target generation strategies to cater to different gameplay styles and difficulty levels.

| Mode | Description | Configuration |
| :--- | :--- | :--- |
| **PRESET** | Uses a hardcoded list of balanced targets. | `classic` profile defaults. |
| **CUSTOM LIST** | User-defined set of targets. | Comma-separated integers (e.g., `21, 35, 42`). |
| **RANDOM RANGE** | Engine selects targets within a specified range. | `minTarget` and `maxTarget`. |
| **SEQUENTIAL** | Cycles through configured targets in a fixed order. | Order of definition in Custom/Preset. |
| **SINGLE LOCK** | Forces the same target for the entire session. | `singleValue`. |

## 2. VALIDATION ENGINE

All targets must pass the **Logic Gate** before being injected into the gameplay loop:
1. **Type Safety**: Must be a positive integer.
2. **Bounds Check**: `0 < target <= 999` (UI enforced, but engine validated).
3. **Solvability Proof**: Target must be achievable using the current `numberPool`.
   - *Example*: If pool is `[2, 4, 6]`, target `7` is rejected in ADD mode.

## 3. SOLVABILITY GUARANTEE (ENGINE LAW)

The SpeedGrid engine maintains a **Dead Board Prevention** contract:
- **Initialization**: At least 3 independent solutions are injected into the starting board.
- **Refill**: Every time tiles are cleared, the engine runs `findExistingSolution()`. If no path exists for the current target, `injectSafeSolution()` is triggered before the frame is returned.
- **Regen**: Changing settings triggers a board solve.

## 4. RUNTIME FLOW & REGEN

Target configuration changes are classified as **REGEN** settings.
1. **Apply**: When settings are applied, the engine invalidates the current target pool.
2. **Rebuild**: A new target and board are generated according to the new constraints.
3. **Preserve**: Current score and timer are maintained unless a full **RESTART** is triggered.

## 5. TARGET HISTORY & NAVIGATION

The system maintains a `targetHistory[]` buffer:
- **Navigation**: The bottom HUD navigation allows "Backtracking" through the session's targets.
- **Integrity**: Navigating history does NOT regenerate the board, allowing players to revisit unsolved boards with different targets.
- **Buffer**: History is limited to the last 20 targets.