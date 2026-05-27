# MATHGRID REQUIRED REGRESSION CHECKLIST

This checklist MUST be executed manually or programmatically after any implementation pass.

## 1. SpeedGrid Required Checks
- [ ] App launches into SpeedGrid successfully.
- [ ] A valid target path solve works.
- [ ] Success path turns green (or visually aligns to feedback spec).
- [ ] Overshoot path turns red (or visually aligns to feedback spec).
- [ ] Gravity/refill triggers correctly upon successful path completion.
- [ ] Time tiles manifest and correctly credit the clock upon completion.
- [ ] The next/previous target sequence updates predictably without stalling.
- [ ] Result screen target displays accurately match the current game state or display neutral text.
- [ ] Settings (Draft/Apply) mechanics properly store and update internal refs.
- [ ] Native gestures (pull to refresh, rubber-banding) do not interrupt gameplay tracking on the board.
- [ ] Mobile/desktop responsive layout bounds adhere accurately.

## 2. CombineGrid Required Checks
- [ ] A normal adjacent merge triggers correctly and commits state.
- [ ] A non-adjacent merge attempt is safely rejected.
- [ ] A two-finger, far-separated dual touch produces a safe no-op.
- [ ] Rejected/Invalid drag events instantly revert without rendering ghost blanks.
- [ ] Wildcards (`?`) evaluate successfully, merge, and gracefully refill.
- [ ] Bombs (`B`) deploy securely upon tapping, detonate their 3x3 footprint, and refill properly.
- [ ] The `Undo` feature reinstates identical masks, grids, and arrays exactly prior to a wildcard, bomb, or merge event.
- [ ] The Endgame sequence uniquely triggers when `combinableTileCount <= 1`.
- [ ] The Result Splash Screen executes reliably following the trophy counting visual routine.
- [ ] Application settings or external logging pipelines do not compromise frame consistency or core playability.

## 3. Shared Required Checks
- [ ] Entire CI build passes seamlessly.
- [ ] SpeedGrid Smoke Test executes without failure (Required upon any generic/Shared system modification).
- [ ] CombineGrid Smoke Test executes without failure (Required upon any generic/Shared system modification).
- [ ] Absolutely NO instance of css `transition: all` added arbitrarily to rendering logic.
- [ ] NO blocking debug features utilizing `alert()` logic remains compiled.
- [ ] Console remains clean, demonstrating an absence of uncontrolled interval or cyclic debug spam.
- [ ] NO timer references or intervals exhibit unbounded memory augmentation across lifecycles.