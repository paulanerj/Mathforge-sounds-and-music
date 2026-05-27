────────────────────────────────────────────────────────────────────────────────
# MATHGRID PRE-NEW-MODE REGRESSION CHECKLIST

Before merging or approving any modifications that introduce a new game mode, this entire manual checklist must be validated to protect existing game variants from cross-contamination.

## SpeedGrid Regression Test Suite
- [x] **Board Loads:** Grid initializes properly with correct dimensions and seeded tile targets. [PASS]
- [x] **Normal Solve Works:** Dragging/clicking sequential paths resolving to the target succeeds and clears tiles. [PASS]
- [x] **Overshoot Works:** Dragging over the target appropriately rejects the selection path and provides penalty feedback. [PASS]
- [x] **No R0C0 Contamination:** Spawning and layout logic do not break row 0 column 0 boundaries. [PASS]
- [x] **Gravity / Refill Works:** Cleared tiles yield vertical cascade physics, correctly refilling the board. [PASS]
- [x] **Time Tile Spawns & Collects:** Time-bonus tiles appear incrementally, and upon resolution inside a valid path, directly augment the round timer. [PASS]
- [x] **Settings Apply / Discard Works:** Live settings manipulation successfully propagates or abandons diffs correctly. [PASS]
- [x] **Round Duration Works:** The chronometer properly tracks countdowns accurately. [PASS]
- [x] **Time Tile Frequency Works:** Spawning frequency matches expected distribution settings. [PASS]
- [x] **Mobile Layout Fits:** Elements do not overflow device viewports. [PASS]
- [x] **Text Selection Blocked:** Wild clicking or dragging does not outline text nodes on mobile or web. [PASS]

## CombineGrid Regression Test Suite
- [x] **Board Loads:** Grid initializes without errors, populated with correct tile values and targets. [PASS]
- [x] **Normal Merge Works:** Dragging and dropping combinable tiles consolidates their value (e.g. 2x2 = 4). [PASS]
- [x] **Trophy Creation Works:** Hitting the set sum/multiple appropriately removes tiles and drops a Trophy Tile marker. [PASS]
- [x] **Trophy Swap Works:** Dragging an unblocked trophy replaces target adjacent tiles. [PASS]
- [x] **Blocked/Frozen Interaction Works:** Tiles designated as frozen properly reject movement unless valid resolution happens. Works as currently accepted. [PASS]
- [x] **Wildcard Renders Correctly:** Wildcard zero-tiles render cleanly as `?` values. [PASS]
- [x] **Wildcard Combine Works:** Interactions with wildcard tiles correctly trigger their distinct pop sequence and visual effect. [PASS]
- [x] **Bomb Works:** Tap interaction triggers ignition; fuse burns out, and 3x3 surrounding radius is obliterated. [PASS]
- [x] **Undo Works:** A single step reversing the most recent action accurately restores masking, un-arms bombs, and correctly revives board topology. Disabled after one use. [PASS]
- [x] **Endgame Works:** Trophy clearing condition prompts ending sequence smoothly. [PASS]
- [x] **Mobile Layout Fits:** Scale factor dynamically compacts board size and maintains visual coherence. [PASS]
- [x] **Text Selection Blocked:** Interactive dragging blocks highlight bleed perfectly. [PASS]
- [x] **Sounds & Haptics Flow:** Actions produce the intended tactile and audible feedback predictably. [PASS]
- [ ] **Invalid Drag Safety:** Dragging a tile far away or outside the board and releasing does not crash. [NEW]
- [ ] **Non-Adjacent Reject:** Dragging non-adjacent tiles rejects cleanly with blocked feedback. [NEW]
- [ ] **Pointer Cancel Safety:** Losing pointer focus or cancel event mid-drag recovers state safely without stale ghosts. [NEW]
- [ ] **Reducer Defense:** Reducer ignores invalid position payloads instead of crashing. [NEW]
────────────────────────────────────────────────────────────────────────────────
