────────────────────────────────────────────────────────────────────────────────
MATH MAGIC: ARCHITECTURE & INTERACTION CONTRACT
CRITICAL: Do not modify the systems below without explicit, overriding permission from the Director.

1. Interaction Physics (LOCKED)
Hit Detection (MathMagicRules.ts): The drag-and-drop hit detection (resolveDrop) MUST use exact geometric split bounds: const snap = (tsz + gap) / 2.0;. No arbitrary multipliers.

Pointer Coordinates: Hit detection must strictly evaluate the raw physical pointer coordinates (e.clientX, e.clientY), never the visual offset of the ghost tile.

Ghost Tile: ghostOff must remain 0 (or purely 1:1 with the finger). The ghost text must remain scaled up (2x) to prevent finger occlusion.

Hover State: Drop targets must scale aggressively (e.g., scale-[1.35]) to burst out from behind the user's finger.

2. State Management (LOCKED)
Immutability (mmReducer.ts): All board state updates MUST be deep-copied. No mutating tiles in place.

Drop Validation: During DROP_RESOLVE or _swap, ONLY the actively dragged tile is evaluated and locked. The passive tile swapped into the empty space MUST NOT automatically validate or lock.

3. VFX Lifecycle (LOCKED)
Origin Points (MathMagicVFX.ts): Visual effects (sparks, equationToast) MUST spawn from the coordinates of the target drop-zone (destination), NEVER the origin coordinates of the dragged tile.

Timing: The equationToast animation must complete its entire lifecycle (spawn, fly, fade, destroy) in under 200ms to prevent collision with rapid-fire game modes.

4. Layout & Sizing (LOCKED)
Dynamic Sizing: The grid sizing hooks must continue to calculate maximum available space by subtracting only the Top HUD and Bottom Control Bar.

Banners: No static instructional banners are permitted above the grid. Instructions belong in the Info Modal.

5. Project Isolation (LOCKED)
SpeedGrid and CombineGrid source code are strictly off-limits.
────────────────────────────────────────────────────────────────────────────────
