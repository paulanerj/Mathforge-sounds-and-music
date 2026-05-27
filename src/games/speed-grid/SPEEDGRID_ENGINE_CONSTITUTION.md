────────────────────────────────────────────────────────────────────────────────
# SPEEDGRID ENGINE CONSTITUTION

**Version:** 1.0 (Freeze Phase)
**Date:** May 6, 2026

## 1. PREAMBLE
This Constitution establishes the supreme laws governing the SpeedGrid game engine. It defines the ownership, authority, and boundaries of all core systems. All future modifications must adhere strictly to these principles to ensure system stability, performance, and predictability.

## 2. THE THREE LAWS OF SPEEDGRID
1. **The Law of State Sovereignty**: The Reducer (State) is the sole source of truth. No system may infer gameplay state from the UI or external side effects.
2. **The Law of Vertical Gravity**: Tiles exist within independent vertical columns. No horizontal drift, diagonal collapse, or lateral movement is permitted.
3. **The Law of Input Sandbox**: Every pointer is an isolated agent. Multi-touch must be handled via union logic, never by shared mutation of pointer-specific paths.

## 3. SYSTEM OWNERSHIP & AUTHORITY
- **State (The Rules)**: Owns the logical board, scores, timers, and active paths. It is the only system permitted to mutate gameplay data.
- **Render (The Game View)**: Owns the projection of state into pixels. It has NO authority to change logical positions or values.
- **Input (The Event Layer)**: Owns the translation of hardware events into abstract game coordinate actions.
- **Settings (The Config Layer)**: Owns the transition from draft configuration to active gameplay parameters.

## 4. FORBIDDEN MUTATIONS
- **Layout-Driven Gameplay**: The browser's CSS Grid or Flexbox systems must NOT determine tile adjacency or logical positioning.
- **Async Board Changes**: All board mutations (Removal, Gravity, Refill) must occur within synchronous reducer steps or as a series of atomic, state-driven transitions.
- **Direct Refill Injection**: Tiles must only enter the board through the established Gravity/Refill pipeline.

## 5. REVISION PROCESS
This constitution is in **FREEZE MODE**. Any attempt to redesign core systems must be preceded by a formal amendment to this document and a full system impact audit.
────────────────────────────────────────────────────────────────────────────────
