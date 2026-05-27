# SPEEDGRID REGRESSION CHECKLIST

Perform this audit after ANY change to the Reducer, Input Layer, or Tile Components.

## 1. INPUT INTEGRITY
- [ ] **Multi-Touch Sandbox**: Multiple fingers can drag independent paths simultaneously.
- [ ] **Combined Path Resolution**: Crossing paths correctly deduplicates tiles for the final sum.
- [ ] **Interpolation Check**: Moving the finger rapidly selects all tiles in the line. No "skipping".
- [ ] **Pointer Termination**: Lifting a finger immediately clears the `ACTIVE` path but preserves a `SUCCESS/FAIL` visual for the defined hold duration.

## 2. GRAVITY STABILITY
- [ ] **Vertical Lock**: No tile moves horizontally during a collapse or refill.
- [ ] **Refill Continuity**: New tiles appear to fall from above row 0 (no teleporting into slots).
- [ ] **Stable IDs**: Tiles do not "flicker" or remount during gravity (visualized by checking for consistent rendering of numbers).

## 3. SETTINGS & MODALITY
- [ ] **Apply workflow**: Changing a setting in the Teacher Console does NOT affect the board until "APPLY" is pressed.
- [ ] **Cancel workflow**: Closing the modal or pressing "CANCEL" discards all pending changes.
- [ ] **Dev Mode Isolation**: With `devMode: false`, the Performance Overlay is hidden and no forensic traces are captured.

## 4. NUMERICAL INTEGRITY
- [ ] **Equation Verification**: Sums in the HUD match the board's selected tile values.
- [ ] **Target Cycling**: Targets follow the `TargetProfile` sequence (Sequential or Weighted).
- [ ] **Time Tile Exclusion**: `Time Tiles` are not added to equation sums.

## 5. PERFORMANCE & RENDERING
- [ ] **Smooth FPS**: No dropped frames during large gravity collapses or particle bursts.
- [ ] **Scale Feedback**: Tiles slightly compress (`0.97`) on touch and spring back on release.
- [ ] **Liquid Trail**: Canvas trail is smooth, uses curves, and follows the finger with minimal jitter.