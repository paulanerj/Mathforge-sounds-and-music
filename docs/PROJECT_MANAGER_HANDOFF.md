────────────────────────────────────────────────────────────────────────────────
# MathGrid Project Manager Handoff & State Capture

Welcome. This document is a comprehensive state capture of the MathGrid application to smoothly transition you into your role as Project Manager. The previous PM has reached their context limit. This document synthesizes the codebase layout, architectural boundaries, recent stabilization efforts, and future trajectory.

---

## 1. Executive Summary

**MathGrid** is a suite of mathematical puzzle games featuring mobile-first, tactile design. It currently houses two distinct game modes:
1. **SpeedGrid**: A rapid, reactive, path-finding math game with gravity-based refills.
2. **CombineGrid**: A strategic, board-state-focused puzzle game involving math recipe targets, wildcards, bombs, and tactical merges.

**Current Status**: Both SpeedGrid and CombineGrid are fully stabilized and locked in terms of core gameplay mechanics. The most recent phase focused heavily on CombineGrid's visual polish, pedagogical factor guidance, sound design, and mobile layout. The application is ready for the next layer of game expansion, user progress tracking, or an entirely new game mode.

---

## 2. Architectural Boundaries & Safe Operation

We observe a **Strict Isolation & No-Drift Policy** between the games. They are part of the same suite but share zero overlapping gameplay logic.

### File Ownership Rules
* **SpeedGrid Only (`src/games/speed-grid/*`)**: Modifying these files must not impact CombineGrid. They manage multi-touch paths, speed gravity, and fast feedback.
* **CombineGrid Only (`src/games/combine-grid/*`)**: Modifying these files must not impact SpeedGrid. They contain the history snapshot (Undo), `CombineGridGame.tsx` orchestrator, board representation (`number[][]`), and factor guidance overlays.
* **Shared Engine (`src/engine/*`)**: Contains math profile generating logic, spawn engines, and solver primitives. **Extreme caution**; regressions here break the entire suite.
* **Shared Systems (`src/systems/SoundService.ts`, `HapticService.ts`)**: Code here is highly volatile. We recently integrated sophisticated Web Audio synthesized effects safely without impacting SpeedGrid.

**Golden Rule of Coding on this Project**: Any modification to a shared file must include an explicit verification note that both SpeedGrid and CombineGrid smoke tests continue to pass.

---

## 3. SpeedGrid State (Feature Frozen)

SpeedGrid is complete and feature-frozen for its mechanics.
* **Grid Refill**: Pure vertical gravity, handled in-place.
* **Input**: Multi-touch support with pointer isolation (safe from cross-touch data leaks).
* **Time Tiles**: Extend gameplay time, correctly bypass standard math selection paths.
* **Stability**: Corruptions involving row/col mismatches and "R0C0 contamination" were successfully squashed early in development.

---

## 4. CombineGrid State (Polished Baseline)

CombineGrid is mathematically rich and strategically slow. Players drag and drop to combine tiles that act as factors of a target number.

### Core Mechanics
* **Trophies**: Created when tiles exactly multiply/add to the target. They are immobile blocks but can be swapped with normal tiles.
* **Wildcards (Zero/100 value)**: Displayed as `?`. A wildcard combined with anything resolves an action with a spinning/vibrating animation and a "bonk-pop", serving as an auto-clear/target aid.
* **Bombs (99 value)**: Tapping a bomb ignites a 2-second fuse (`playCombineGridBombFuse`). It explodes in a 3x3 radius, destroying everything (Normal, Trophy, Frozen, Wildcard).
* **Endgame Decision**: Automatically triggers when `combinableTileCount <= 1`. Does not calculate adjacency mathematically to avoid false stalemates.
* **Undo System**: Maintains a limited history stack (max depth 5). The state snapshot saves board layouts and scores. We recently fortified this to **explicitly zero-out** transient UI states (like active drag sources or ignited bombs) during undo to prevent "ghost blank tiles" and looping audio.

### Factor Guidance (Pedagogical Scaffolding)
* **Visual Factor Dots**: Small green dots on tiles indicating they divide cleanly into the current target.
* **Factor Recipe Pills**: A responsive list (e.g. `4×9`, `6×6`) near the HUD. **Recent constraint added**: Must always clamp down (2-3 on small phones) to fit on a single line (`flex-nowrap`). It strictly avoids grid shift or multi-line wrap.
* **Factor Help**: An on-demand help button provides a brief 3.5-second reveal if the player has dots turned off but needs a hint.

### Sound & Effects Design 
* **Recent Milestone**: We explicitly integrated isolated Web Audio APIs for CombineGrid from a dedicated Sound Design Handoff.
* **Features Include**: High-quality marimba/wood percussion, triangle pops for wildcards, square-wave thuds for invalid moves, and a sophisticated bomb fuse oscillator track.
* **Safety Restraints Applied**: We significantly lowered explosion gain volumes (down to 0.35/0.2) to prevent mobile speaker damage. The bomb fuse loop ensures it disconnects cleanly upon explosion, undo, or component unmount. `Math.random()` is allowed to generate audio texture/noise but explicitly forbidden from modifying game state.
* **Ambient Music**: Available via settings toggle but currently set to a basic placeholder scaffold (background continuous loop).

---

## 5. Performance Constraints & Forensics

Mobile performance on constraints heavily shapes our development:
1. **History Memory Leak**: CombineGrid's undo buffer previously allowed infinite history states, crashing devices around trophy 12. Fixed via the 'Depth=5' limit.
2. **Animation Budget**: `backdrop-filter: blur` was removed from result overlays; we avoid CSS `transition: all` everywhere. Tiles use strict `transform` or `opacity`.
3. **Audio Node Limits**: Capped to prevent audio-context lockups on iOS. Explicit `interaction-unlock` occurs on all `pointerdown` events.
4. **Debug Watchdog**: In dev mode, a small "DEBUG" button lives in the bottom left. Use it to check internal states, history depth, or action loops if the logic hangs.

---

## 6. What You Should Focus On Next

The project is now extremely stable. All regressions have been closed out. Your instructions as PM will dictate the next frontier. Potential avenues logically follow:

1. **Target Progression Polish**: CombineGrid currently moves to a semantic "Next Level", but the system for deciding the "next target" sequence could be made more structured or persistent.
2. **Meta-Progression / Saving**: Implement local-storage or backend saving of user statistics, best times, trophy records, or unlocked themes.
3. **Full Sound Polish Phase 2**: Expand the ambient background music that was explicitly paused in the recent task, or bring SpeedGrid's placeholder sounds up to the same premium Monument Valley-style standard.
4. **New Game Mode**: Introduce a third mathematical grid game following the isolated-directory architecture established.

Welcome to MathGrid! Lead the coding agent to maintain this high-quality baseline.
────────────────────────────────────────────────────────────────────────────────
