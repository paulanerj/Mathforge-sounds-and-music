# SpeedGrid Input Authority Contract

## CORE RULE
**No move event may exist without an active pointer, active touch, and active gesture session.**

## RESTRICTIONS
- **No Ghost Drawing:** Tiles cannot be selected without physical interaction.
- **No Hover Painting:** Mouse movement without a button press or pointer-down event must not alter path state.
- **No Move-After-Release:** The pointer-up or pointer-cancel event immediately terminates logic for that pointer.

All moves require absolute point verification and bounding box matching. If a pointer leaks or acts without an active touch registration, it's a critical violation.