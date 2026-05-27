────────────────────────────────────────────────────────────────────────────────
# MATHGRID TIMER AND STALE CALLBACK CONTRACT

## Contract Scope
This document outlines safely tracking, executing, and purging timers within the MathGrid application environment, particularly in systems handling stateful physics or feedback loops where late-running callbacks introduce destructive regressions.

## 1. Traceability
- All utilized interval strings and timer references MUST be labeled definitively if tracked manually in objects or arrays. Anonymous hanging timeout closures are prohibited.
- Where possible, consolidate interval logic to existing custom engine hooks (`safeSetTimeout`, `safeSetInterval`).

## 2. Cleanup Compliance
- Timers MUST clean up and detach explicitly upon their designated completion routine. 
- Timers MUST unilaterally clear upon React component unmount boundaries (cleanups returned via `useEffect`).

## 3. Stale State & Callback Mutation Restraints
- Stale callbacks from previous actions MUST NOT inherently mutate authoritative board reducers. 
- Any delayed action explicitly requested (e.g. executing a wildcard shuffle animation post-resolution) MUST forcefully verify the current phase, interaction token, or version ID prior to firing its payload against the global state context.

## 4. Exceptional Scope: Result Counting
- Internal counting maneuvers, specifically end-stage summary computations (e.g., `COUNT_NEXT_TROPHY`, `FINISH_COUNTING` mechanisms) operate as authorized exceptions in the version-state continuum.
- These occurrences bypass standardized Reducer strict version enforcement to prevent locking rendering timelines during purely visual score aggregation operations, which themselves increment versions over multiple dispatches rapidly. This exception operates in a fiercely bounded constraint.

## 5. Bounds Verification
- Under no circumstances shall timer volume or count grow unbounded during an operational game cycle. Fast taps or dragged inputs should throttle or clear their predecessors instead of generating stacking asynchronous calls.

## 6. Debug Accountability
- The current debugging layout trace (`JSON` debug outputs) must transparently surface the count of active timers where accessible, aiding directly in memory-leak evaluations.
────────────────────────────────────────────────────────────────────────────────
