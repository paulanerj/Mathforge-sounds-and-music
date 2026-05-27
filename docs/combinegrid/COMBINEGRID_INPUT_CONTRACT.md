────────────────────────────────────────────────────────────────────────────────
# CombineGrid Input Contract

This document defines the authoritative behavior for user interaction in CombineGrid. No implementation pass may alter these rules without explicit regression testing and updated documentation.

## 1. Interaction Modes

### 1.1 Tap vs Drag Distinction
- **Tap Selection:** A quick pointer down/up on a standard tile toggles it in the `selection` array.
- **Drag Interaction:** If a pointer moves beyond a small threshold after down, it initiates a drag.
- **Visuals:** The `dragSource` tile becomes translucent on the board and a `ghost` tile follows the pointer.

### 1.2 Bomb Interaction Rule
- **Bomb Tap:** A single tap (pointer down/up without movement) on an unarmed bomb starts the fuse (`ignitedBombPos`).
- **Bomb Drag:** An unarmed bomb can be swapped with normal tiles or trophies. Dragging a bomb **must not** start the fuse.
- **Armed Bomb:** Once the fuse is started, the bomb is locked. It cannot be moved, swapped, or retriggered until it explodes.

## 2. Assisted Resolution

### 2.1 Directional Overswipe Assist
- If a user drags a tile past an adjacent tile and releases it further away, the system calculates the direction of the drag.
- It automatically resolves the move as if the user targeted the **immediate adjacent tile** in that primary direction.
- This prevents "slippery" input failures on dense mobile grids.

### 2.2 Invalid Drag Cancel
- If a drag is released over an invalid target (non-adjacent, empty cell, or same cell as source), the interaction is canceled.
- The `dragSource` is nulled, the ghost is removed, and no board mutation occurs.

### 2.3 Out-of-Bounds Drag
- If the pointer is released outside the board boundaries, the drag is canceled cleanly.

## 3. Input Authority & Safety

### 3.1 Pointer Capture
- `setPointerCapture` and `releasePointerCapture` must be used to ensure the game surface retains control of the interaction even if the finger moves off-element.

### 3.2 Input Lock Conditions
- Input must be **fully locked** (`computeInputLocked`) during the following states:
    - **Wildcard Animation:** The accelerating vibration period (approx. 1000ms).
    - **Bomb Fuse/Ripple:** From the moment of center explosion through the orthogonal/corner ripple (approx. 450ms).
    - **Endgame Phases:** During `COUNTING` and `SUMMARY`.
    - **Phase Barriers:** Any phase that isn't `PLAY` or `CLEARING` (except specific debug tools).

### 3.3 No Silent Input Lock
- If input is locked, there must be a visible or audible indicator (animation running, timer paused, etc.). 
- Avoid "stuck" states where the game appears interactable but ignores input without explanation.

## 4. Undo Availability
- Undo is allowed only during the `PLAY` phase.
- Undo is disabled during active animations (Wildcard vibrate, Bomb ripple) to prevent state corruption.

## 5. Multi-Touch Policy (2026-05-15)

CombineGrid is a single-active-pointer game. 

- **Single Pointer Authority:** Only one pointer ID may be "active" at a time for board interaction. 
- **Pointer Lockdown:** When a pointer begins an interaction (drag or tap), its `pointerId` is captured and locked as the `activePointerId`.
- **Secondary Pointer Rejection:** All other pointers must be ignored while an `activePointerId` exists. They cannot start drags, toggle selections, or ignite bombs.
- **Source Integrity:** All components of an interaction (down, move, up) must originate from the same pointer ID.
- **Relinquishment:** The `activePointerId` is only cleared upon a valid `pointerup` or `pointercancel`.
- **Ghost Merge Prevention:** Under no circumstances should two simultaneous pointers contribute to a single merge (e.g. pointer A down on cell 1, pointer B down on cell 2).

## 6. Tap Selection Adjacency

If the user uses tap-tap selection instead of dragging:
- **First Tap:** Selects the source tile.
- **Second Tap:** Resolves the interaction **ONLY** if the second tile is directly adjacent to the first.
- **Non-Adjacent Tap:** If the second tap is not adjacent, it should either change the selection to the new tile or cancel the selection. It must NEVER trigger a merge or board mutation.

## 7. Interaction Versioning & Stale Callback Guard

To prevent race conditions and "ghost merges" from delayed timers:

- **State Versioning:** Every board-mutating action in the reducer must increment the `state.version`.
- **Token Capture:** Any operation involving a delay (Wildcard animation, Bomb fuse, Result counting) must capture the current `version` as an interaction token.
- **Verification:** Before dispatching a mutation after a delay (e.g. `DRAG_DROP` after wildcard vibrate), the action must include the captured version.
- **Reducer Rejection:** The reducer must verify that the incoming action version exactly matches the current state version. If it mismatches, the action is rejected as "stale," preventing it from mutating a board that has already changed or advanced.
- **Timer Purge:** All timers must be actively tracked inside `activeTimers` set and cleared upon component unmount or when their respective interaction is explicitly cancelled.
────────────────────────────────────────────────────────────────────────────────
