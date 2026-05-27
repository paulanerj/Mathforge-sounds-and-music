# SpeedGrid Multi-Touch Contract

## CORE RULE
**Each pointer is completely sandboxed.**

## POINTER OWNERSHIP
Each pointer strictly owns its:
- Path
- Interpolation data
- Selection history
- Status (Active, Success, Fail)
- Direction State

**No pointer may directly mutate another pointer's state/path.**

## COMBINED MODE CONTRACT
When operating in Combined Mode (default multi-touch):
- The logic specifically uses the unique union of all active paths.
- Deduplicates overlapping tiles (no single tile may be double-counted, no matter how many pointers touch it).
- Calculates exactly **one shared total** sum or product across all active pointers.
- Resolves as **one shared successful selection**.

If `tile.value == x`, and Pointer A and Pointer B both touch it, `x` is added to the shared total exactly once.