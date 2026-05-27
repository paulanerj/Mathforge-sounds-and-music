# NEW GAME MODE ISOLATION CONTRACT

This contract dictates the architectural requirements for introducing any additional game mode to the MathGrid ecosystem. 

## 1. Directory Containment
* A new game mode MUST reside entirely within its own folder under `src/games/` (e.g., `src/games/new-mode/`).

## 2. Protected Internal State
* A new game mode MUST possess its own unique Rules definition module and Reducer module.
* State structures must not depend on or inherit exclusively from the specific, localized state definitions of existing modes unless extracted into a truly shared format first.

## 3. Dedicated Entry Point
* A new game mode MUST expose its own independent root component entry point.

## 4. Forbidden Mutations
* A new game mode MUST NOT modify SpeedGrid domain files (`src/games/speed-grid/*`).
* A new game mode MUST NOT modify CombineGrid domain files (`src/games/combine-grid/*`).
* Reuse of game-specific logic by copy-paste mutation (where existing game logic is copy-pasted and then randomly tweaked in-place leading to global pollution) is expressly FORBIDDEN.

## 5. Shared Systems Protocol
* New game modes MUST use shared utilities (`SoundService`, `HapticService`, `prng`, etc.) via their established, stable public interfaces.
* A new game mode MUST NOT modify shared systems to fit its specific use case unless explicitly approved by the prompt.

## 6. Shared System Change Procedure
If a shared system change is explicitly authorized and mandated, the developer MUST:
1. List all games affected by the change.
2. Run manual/automated SpeedGrid regression checks.
3. Run manual/automated CombineGrid regression checks.
4. Document the architectural reasoning for why the shared system modification was unavoidable over creating a localized implementation.

## 7. Mandatory Inclusion
* Any newly added game mode MUST include its own dedicated regression checklist appended to or mimicking `MATHGRID_PRE_NEW_MODE_REGRESSION_CHECKLIST.md`.