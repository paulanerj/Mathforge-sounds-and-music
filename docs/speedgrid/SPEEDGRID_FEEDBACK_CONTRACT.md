# SpeedGrid Feedback Contract

This document defines the authoritative behavior for gameplay feedback in SpeedGrid. All visual and tactile feedback must adhere to these isolation principles to prevent state drift and performance degradation.

## 1. Feedback Isolation

### 1.1 Overlay Principle
- Success and overshoot feedback must be handled exclusively by **overlay/snapshot layers** (e.g., `SuccessFeedbackLayer`, `OvershootFeedbackLayer`).
- These layers must receive a snapshot of the path at the time of resolution/failure and render it independently of the live board.

### 1.2 State Isolation
- Feedback systems **must not mutate** the core `board` or individual `Tile` states.
- **No FAIL Status:** Tiles must never receive a `FAIL` status in the reducer.
- **No Color Contamination:** Boards must not be "painted" red or green via tile properties.
- **R0C0 Isolation:** Feedback logic must respect the unique `instanceId` of tiles and never leak behavior based on static indices like (0,0).

## 2. Visual Contracts

### 2.1 Success Feedback
- **Color:** Emerald/Green (#10b981).
- **Behavior:** A glowing path line follows the resolved path centers.
- **Timing:** Approx. 320ms hold before expiration.
- **Integrity:** Line must fade or animate out cleanly; no lingering artifacts.

### 2.2 Overshoot Feedback
- **Color:** Red (#ef4444).
- **Behavior:** A sharp, rapid flash of the offending path.
- **Timing:** Approx. 350ms duration.
- **Constraint:** No board shake or persistent "fail" visuals unless explicitly authorized.

## 3. Performance & Safety
- **No Lingering Artifacts:** All feedback entities must have an explicit expiration and cleanup path in the reducer.
- **No Layout Transitions:** Feedback must not trigger CSS transitions on tile positions (`transform` or `top/left`) to avoid horizontal jitter during gravity.
- **Tile Polish Isolation:** Visual-only surface enhancements (e.g., shine overlays, subtle glass borders) must not mutate tile status or affect the coordinate mapping used by feedback layers.

## 4. Verification Requirements
- After any edit to feedback systems, the following must be verified:
    - Normal solve results in a green line.
    - Overshoot results in a red line.
    - Path lines do not "stick" or loop.
    - Tiles remain responsive to new pointer interaction immediately after feedback triggers.