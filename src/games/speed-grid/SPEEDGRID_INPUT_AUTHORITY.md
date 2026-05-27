# SPEEDGRID INPUT AUTHORITY

## 1. EVENT CHAIN
`PointerEvent` (Hardware) → `handlePointerMove` (Normalization) → `GESTURE_MOVE` (Action) → `Reducer` (Path Validation) → `State` (Authority) → `Canvas` (Visual Trail)

## 2. THE LOCK PRINCIPLE
No input action is valid unless tied to a specific, unique `pointerId` currently registered in the Reducer's `activePointerIds`.

## 3. LIFECYCLE
- **Start**: `PointerDown` registers the pointer and initializes a new path.
- **Move**: `PointerMove` calculates normalized `(ux, uy)`. Reducer checks cell boundaries and performs interpolation for high-speed multi-tile selection.
- **End**: `PointerUp` terminates selection.
    - If path is `ACTIVE`, clear it.
    - If path has reached terminal status (`SUCCESS` or `FAIL`), it enters the "Resolution Hold" before clearing.

## 4. MULTI-TOUCH ISOLATION
- **Independence**: Pointers do not share paths. Every pointer acts as if it is the only one.
- **Collision Handling**: Reducer handles tile-sharing via the "Combined Path" rule: a tile's value is added only once to the global sum even if touched by multiple pointers.
- **Interaction Conflict**: If a pointer attempts to claim a tile currently locked by a "Success" path of another pointer, the claim is rejected.

## 5. REJECTION CRITERIA
- **OOB**: Any move outside the defined `rows/cols` grid boundary is ignored.
- **Diagonal Skip**: Moves that jump over a tile diagonally without touching it are filled via interpolation.
- **Hover**: Pointer moves without an active `PointerDown` state (hovering) must produce no state change.