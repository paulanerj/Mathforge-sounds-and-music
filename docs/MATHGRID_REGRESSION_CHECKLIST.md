────────────────────────────────────────────────────────────────────────────────
# MathGrid Regression Checklist

Use this checklist to verify the stability of SpeedGrid and CombineGrid after any change to shared systems or localized polish.

---

## 1. SPEEDGRID REGRESSION TESTS

### 1.1 Gameplay Mechanics
- [ ] **Normal Solve**: Valid path results in tile removal and score addition.
- [ ] **Overshoot**: Selecting a path > Target displays RED feedback but does NOT lock or fail tiles permanently.
- [ ] **Multi-Touch**: Two different paths can be selected simultaneously by two fingers.
- [ ] **Time Tiles**: Verify they spawn at the rate defined in Settings.
- [ ] **Time Collection**: Tapping/touching a Time Tile adds time and creates particles.
- [ ] **Gravity**: Tiles fall strictly vertically with no gaps or "sideways" jumps.
- [ ] **Refill**: Void spaces are filled correctly after every solve.

### 1.2 UI & Layout
- [ ] **Mobile Fit**: Grid spans 100% of the screen width on mobile viewport.
- [ ] **Equation Pill**: Correctly scales on narrow screens.
- [ ] **Haptics**: Toggling haptics in settings actually works (if hardware supports).
- [ ] **R0C0 Guard**: Verify the top-left tile (index 0,0) does not get stuck "highlighted" after a swipe.

### 1.3 Settings Lifecycle
- [ ] **Draft/Apply**: Settings only take effect after clicking "APPLY".
- [ ] **Discard**: Closing the settings without applying reverts all changes.

---

## 2. COMBINEGRID REGRESSION TESTS

### 2.1 Gameplay Mechanics
- [ ] **Standard Merge**: A * B < Target correctly updates destination tile value.
- [ ] **Trophy Creation**: A * B == Target locks tile in trophyMask (Gold/Trophy icon).
- [ ] **Identity Merge**: Merging '1' with 'N' preserves 'N'.
- [ ] **Zero Logic**: Merging Zero (100) with any tile clears both cells (becomes empty/0).
- [ ] **Bomb Activation**: Tapping a bomb starts the 2s fuse animation.
- [ ] **Bomb Explosion**: Bomb destroys a 3x3 area including Trophies and Frozen tiles.
- [ ] **Undo**: Clicking Undo after a Merge or Bomb Explosion perfectly restores the prior state (board + masks).

### 2.2 Endgame Logic
- [ ] **Endgame Stay**: Game continues if 2 or more combinable tiles exist (even if not adjacent).
- [ ] **Endgame Trigger**: Game transitions to Counting when exactly 1 combinable tile remains.
- [ ] **Empty Board**: Game transitions correctly if 0 tiles remain (after explosion).

### 2.3 UI & Layout
- [ ] **Compact HUD**: Equation pill is small and efficient.
- [ ] **Mobile Grid**: Tiles are maximal size for the screen.
- [ ] **Undo Button**: Visible and functional in 'PLAY' phase.

---

## 3. SHARED SYSTEM CHECKS

- [ ] **Game Switching**: Switching from SpeedGrid to CombineGrid and back does not crash the app.
- [ ] **Shared Fonts**: Verify Inter, JetBrains Mono, and Space Grotesk load correctly.
- [ ] **Shared Particles**: Particles from SpeedGrid solves and CombineGrid explosions look consistent.

---
*Last Updated: 2026-05-11*
────────────────────────────────────────────────────────────────────────────────
