────────────────────────────────────────────────────────────────────────────────
# SPEEDGRID STABILIZATION BASELINE

## 1. Current Stable Systems
- **Core Input Pipeline**: Multi-touch gesture handling via `GESTURE_START`, `GESTURE_MOVE`, and `GESTURE_END`.
- **Target Solving**: Path summation according to `operationMode` (ADD, SUB, MULT, etc.).
- **Gravity & Refill**: Vertical tile shifting and new tile generation after successful path resolution.
- **Time Tiles**: Specialized tiles that add time to the game clock upon collection.
- **Multi-Touch**: Independent path tracking for multiple pointer IDs.
- **Settings & UI**: Game configuration via `SpeedGridSettings` and `PracticeProfile`.

## 2. Overshoot Contract
- **Silent Reset**: If a path exceeds the target, it is immediately cleared from `activePaths`.
- **No Status Contamination**: Tiles involved in an overshoot NEVER receive a `FAIL` status. `pathStatus` is not set to `FAIL`.
- **Isolated Feedback**: Overshoot visuals are handled exclusively by the `OvershootFeedbackLayer`.
- **Atomic Reset**: `activePaths`, `pathSums`, `pathStatus`, `lastTileByPointer`, and `interpolationCache` for the offending pointer are cleared in a single state transition.
- **Snapshot Capture**: `createOvershootSnapshot` creates a visual-only marker (`overshootFeedback`) containing path data for the HUD/Overlay.
- **Auto-Expiration**: `overshootFeedback` is cleared via `EXPIRE_OVERSHOOT` after a short duration (350ms).

## 3. Files Involved
- `src/games/speed-grid/SpeedGridRules.ts`: Engine logic, validation, overshoot snapshots.
- `src/games/speed-grid/SpeedGridGame.tsx`: Main UI portal, `OvershootFeedbackLayer`, `Tile` isolation.
- `src/games/speed-grid/SpeedGridReducer.ts`: State transition management.
- `src/games/speed-grid/TargetProfile.ts`: Difficulty and target generation profiles.

## 4. Protected Zones (Do Not Touch Casually)
- `SpeedGridRules.resolveInteraction`: Specifically the `GESTURE_MOVE` logic and its overshoot detection branch.
- `SpeedGridRules.resolveInteraction` -> `RESOLVE_SUCCESSFUL_PATH`: Gravity and refill sequence.
- `Tile` component styling: Must remain isolated from `overshoot` state.

## 5. Safe Future Extension Path
- New overshoot visuals (lines, glows) should be added to `OvershootFeedbackLayer` or a similar dedicated overlay, NOT the `Tile` component.
- Sound effects can be triggered in the `SpeedGridGame` component when `overshootFeedback` transitions from `null` to `defined`.

## 7. FEEDBACK V2.1 (OVERSHOOT / SUCCESS / HAPTICS)
- **Unified Path Feedback**: Both correct solutions (green) and overshoots (red) use isolated layer snapshots safely avoiding gravity drift.
- **Success Visual & Haptic**: A rewarding green line (#10b981) with a brief hold (~320ms) and glow effect. Subtle positive haptic (`navigator.vibrate(20)`).
- **Overshoot Visual & Haptic**: A sharp red line flash (#ef4444) that communicates "too much" immediately. Warning haptic (`navigator.vibrate([25, 35, 25])`).
- **No Popup in Play Mode**: The intrusive text popup is hidden during play and only available in `devMode`.
- **Time Tile Haptic**: Reward haptic pattern (`navigator.vibrate([15, 20, 35])`) on collection; core behavior untouched.
- **Contract Integrity**: No `FAIL` status, no tile color contamination, no board shake.
- **Haptic Settings**: Regulated by `settings.hapticsEnabled` (safely checked against unsupported devices).

## 8. UI GEOMETRY CONTRACT

Rules:
- **Tile Geometry**: Tile radius stays small and squarish (`TILE_RADIUS = 4`). Gaps remain tight (`GAP = 4`).
- **Maximization**: The board uses maximum safe mobile width (`sideMargin = 2`).
- **Consistency**: Tiles must remain square (width == height). Time tiles and selection rings inherit the same geometry.
- **Coordinate Sync**: Touch mapping calculations, SVG feedback paths, board rendering, and tile placement MUST share the same `GAP` and `BOARD_PADDING` constants.

## 9. SPEEDGRID LIGHT GLASS POLISH BASELINE (2026-05-14)
This baseline defines the visual polish applied to standard SpeedGrid UI.
- **HUD Glassification**: Top status units use floating glass pills (`bg-white/70 backdrop-blur-md`).
- **Equation Pill**: Elevated glass pill with high-contrast centered text.
- **Control Dock**: Bottom buttons are grouped in a cohesive glass bar for a premium feel.
- **Result Panel**: End-of-round summary uses a frosted glass modal with staggered spring entrances.
- **Tile Surface**: All tiles received a subtle inner-shine overlay (`bg-gradient-to-br from-white/20 to-transparent`) for depth without affecting performance.
- **Performance Constraint**: `backdrop-filter` is explicitly avoided on individual tiles to maintain 60fps on mobile.
- **Isolation**: Visual polish does not mutate board state, refill logic, or feedback contracts.

## 10. GRID-FIRST MOBILE LAYOUT PHILOSOPHY
- **Maximize Grid:** The board should use near-full safe width and height on mobile devices; avoid horizontal dead space.
- **Dedicated Bottom Utility Row:** The bottom control dock exists in a dedicated minimal string-0 `flex` row below the board. It must never overlap the playable tile matrix. The settings button is centered and only permitted to slightly kiss/overlap the decorative bottom board padding (-5px upward shift).
- **Controls Accommodation:** Controls may use compact/expandable/overlay designs. The collapsed state must always preserve clean board access and safe hit areas for bottom-row tiles.
- **SPEEDGRID LAYOUT ACCEPTED BASELINE:** Current HUD placement, equation pill placement, grid size, and bottom settings/control placement are accepted and locked. Future layout edits require explicit reason and screenshot-based validation.
- **Future-Proofing:** Support future grid sizes (like 5x5, 5x7, 7x5) by keeping controls accessible via the collapsible bottom dock.
- **Interaction Constraints:** Settings and modals can scroll, but the gameplay board MUST NOT. Native browser gestures (print window, context menu, dragstart, text selection pull-out) are strictly blocked during board interactions using aggressive CSS and event suppression (`select-none`, `touch-none`, `onContextMenu: preventDefault`, `onDragStart: preventDefault`).

## 11. GAME STATE & LAYOUT DEFAULTS
- **Equation Pill:** It floats OVER the grid on its z-layer (e.g. `z-20`) using an exact layout rule (`top: calc(100% - 15px)`) to provide consistent minimal overlapping without pushing the grid down. The pill uses a refined charcoal navy glass (`bg-slate-800/75`), and dynamically reduces opacity (`opacity-30`) while the user drags/selects tiles to minimize visual obstruction.
- **Dock Dimming:** The settings button gracefully dims (`opacity-30`) but remains usable when the user is actively selecting a path, reducing bottom-edge distraction.
- **Default Number Pool:** Standard SpeedGrid mode (Classic) utilizes a `1-9` number pool by default.
- **Default Target Set:** Expanded targets natively include a broad set of basic multiplication-friendly numbers: `[10, 12, 15, 18, 20, 21, 24, 25, 27, 28, 30, 32, 35, 36, 40, 42, 45, 48, 54, 56, 63, 64, 72]`.

## 12. SPEEDGRID TARGET SEQUENCE CONTRACT
- **One Source of Truth:** `state.target` and `state.targetHistory` are the sole sources of truth for target selection.
- **Board Consistency:** `generateInitialState` strictly accepts a `target` parameter to ensure the board's solvable paths match the HUD display.
- **Deterministic Navigation:** `NEXT_TARGET` and `PREV_TARGET` use `targetHistory` and `currentTargetIndex`. Random generation only occurs to extend history from the final index.
- **Round End UI:** The result splash only displays a numerical "Next Target" if the target was advanced via a successful clearance (`lastActionName === "RESOLVE_SUCCESS"`). Otherwise, it displays "RETRY ROUND".
- **State Preservation:** Transitions like `START_NEXT_ROUND` (Continue) preserve the existing `state.target` and use it to initialize the next board correctly.
- **Debug Trace:** A dev-mode 'COPY TARGET DEBUG' trace provides full visibility into the target state sequence.
────────────────────────────────────────────────────────────────────────────────
