# CombineGrid Performance Contract

This document defines the performance constraints for CombineGrid to ensure smooth execution on mobile devices (e.g., iPhone 12 baseline).

## 1. Rendering Constraints

### 1.1 No `transition: all`
- Individual Tiles must **never** use `transition: all`.
- Permitted transitions: `transform`, `box-shadow`, `opacity`.
- Reason: Layout recalculations and gradient repaints on `all` are too expensive for a 35-tile grid.

### 1.2 Gradient Best Practices
- **No Background Transitions:** Gradient background strings must not transition or animate their properties (colors, stops) in real-time.
- **Memoization:** Tile background strings must remain memoized (`backgroundCache`) to avoid thousands of string concatenations during animation frames.

### 1.3 UI Blocking
- **No `alert()`:** Synchronous `alert()` calls are strictly forbidden in production code as they hang the main JS thread and freeze animations.
- **Copy/Debug:** Use non-blocking toast notifications for clipboard feedback.

## 2. Audio Performance

### 2.1 Oscillator Budget
- **Fuse Sound:** The `playFuse` method must be capped at 8 simultaneous oscillators (`MAX_FUSE_OSCILLATORS`). 
- **Node Cleanup:** Ensure all oscillators are stopped and disconnected properly to avoid memory leaks.

### 2.2 Shared Compatibility
- `SoundService.ts` is shared with SpeedGrid. 
- Modifications must not rename or break legacy methods used by SpeedGrid.
- Cross-game smoke tests are required for any SoundService edit.

## 3. Future Architecture Targets

### 3.1 Particle System
- Current implementation uses React state components for particles.
- **Target:** Future versions should migrate to a shared `<canvas>` layer (matching the SpeedGrid pattern) to eliminate React re-render overhead for particle lists.

### 3.2 Wildcard Animation
- Current implementation uses `setInterval` (50ms).
- **Target:** Transition to `requestAnimationFrame` (RAF) driving a CSS variable on the board container for smoother, state-free vibration.

### 3.3 Input Handlers
- Current implementation is inlined in `CombineGridGame.tsx`.
- **Target:** Extract into a specialized `useCombineGridInput` hook to isolate input logic from render logic and reduce file complexity.

## 4. Verification Requirements
- Any performance-sensitive edit requires a build pass and a mobile layout smoke test.
- Check for "Console Spam": Noisy input/trace logs must be gated behind `process.env.NODE_ENV !== 'production'`.