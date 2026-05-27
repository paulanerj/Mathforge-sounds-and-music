# SPEEDGRID: SETTINGS SYSTEM AUDIT

**Date:** May 6, 2026
**Status:** COMPLETE AUDIT (Observation Mode)

---

## 1. FULL SETTINGS INVENTORY

| UI Label | Internal Key | Type | Default | Runtime Consumer | Category |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Target Source Type** | `targetSource` | enum | `classic` | Reducer (Target Gen) | Board Generation |
| **Bases** | `multiplesConfig.bases` | array | `[2]` | Reducer (Multiples Gen) | Board Generation |
| **Number Pool** | `numberPool` | array | `[1..9]` | Reducer (Spawn Gen) | Board Content |
| N/A | `gridSize` | [r, c] | `[7, 5]` | `generateInitialState` | Layout |
| N/A | `timeLimit` | numeric | `60` | `generateInitialState` | Timing |
| N/A | `activeProfileId` | string | `CLASSIC` | `generateInitialState` | Profile |
| N/A | `multiTouchMode` | enum | `combined` | `RESOLVE_SUCCESSFUL_PATH` | Input |
| N/A | `diagnosticMode` | toggle | `false` | `ValidationHUD`, Trace | Debug |
| N/A | `stressTestMode` | toggle | `false` | Reducer (Metrics) | Debug |
| N/A | `devConsole` | toggle | `false` | N/A | Debug |
| N/A | `devMultiTouchForce`| toggle | `false` | Reducer (Input Lock) | Debug |
| N/A | `showInputZones` | toggle | `false` | N/A | Debug |
| N/A | `devMode` | toggle | `false` | `PerformanceOverlay` | Debug |
| N/A | `showGravityVisuals` | toggle | `false` | `GridBoard` (Tile Ring) | Visual |
| N/A | `operationMode` | enum | `add` | Sum Calculation | Gameplay |
| N/A | `presentationMode` | enum | `random` | Target sequence | Animation |
| N/A | `cycleLength` | numeric | `0` | Target sequence | Gameplay |
| N/A | `rangeConfig` | object | `{10, 50}` | Reducer (Range Gen) | Board Generation |
| N/A | `specificConfig` | object | `{"", []}` | Reducer (Specific Gen) | Board Generation |

---

## 2. CONNECTION AUDIT Matrix

| Key | Connected to Store? | UI Control Exists? | APPLY Required? | Consumed in Runtime? | Status |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `targetSource` | YES | YES | YES | YES | **CONNECTED** |
| `multiplesConfig` | YES | YES | YES | YES | **CONNECTED** |
| `numberPool` | YES | YES | YES | YES | **PARTIALLY CONNECTED** (Bug in regen) |
| `operationMode` | YES | NO | N/A | YES | **DISCONNECTED FROM UI** |
| `multiTouchMode` | YES | NO | N/A | YES | **DISCONNECTED FROM UI** |
| `devMode` | YES | NO | N/A | YES | **DISCONNECTED FROM UI** |
| `diagnosticMode` | YES | NO | N/A | YES | **DISCONNECTED FROM UI** |
| `timeLimit` | YES | NO | N/A | YES | **DISCONNECTED FROM UI** |
| `gridSize` | YES | NO | N/A | YES (init only) | **DISCONNECTED FROM UI** |

---

## 3. DATA FLOW TRACE

**Case: User changes Multiples Bases**
1.  **UI Component**: User clicks base `3` in `SettingsModal`.
2.  **Dispatch**: `SET_DRAFT_SETTING` with key `multiplesConfig`.
3.  **State**: `state.draftSettings.multiplesConfig` is updated. `state.settings` remains original.
4.  **UI Update**: Modal shows base `3` as selected (uses `draftSettings` fallback).
5.  **Apply Click**: User clicks "APPLY".
6.  **Dispatch**: `APPLY_SETTINGS`.
7.  **Reducer (Rules)**:
    - Compares `state.settings.multiplesConfig` vs `state.draftSettings.multiplesConfig`.
    - Detects change (in `triggerKeys`).
    - Calls `generateInitialState` with `nextSettings.multiplesConfig`.
8.  **Generator**: `generateInitialState` uses the passed `multiplesConfig` to rebuild `targets` and `board`.
9.  **State**: New state returned with `settings` overwritten by `nextSettings`, `draftSettings` nullified, `ui.settingsOpen` false.
10. **Result**: **SUCCESS**. Board regenerates with new multiples.

**Case: User changes Target Source to "Range"**
1.  ... (steps 1-6 same as above)
2.  **Reducer (Rules)**:
    - Compares `state.settings.targetSource` vs `state.draftSettings.targetSource`.
    - Detects change.
    - Calls `generateInitialState`. **BUG**: Passes `activeProfileId` and `multiplesConfig`, but **MISSES** `targetSource`.
3.  **Generator**: `generateInitialState` ignores user's "Range" request and uses `activeProfile.targetSource` (which is still "Multiples").
4.  **State**: `APPLY_SETTINGS` final return overwrites `state.settings.targetSource` to "Range", **but the Board and Targets are for "Multiples"**.
5.  **Result**: **SILENT FAILURE / INCONSISTENCY**. UI says Range, Game says Multiples.

---

## 4. APPLY / CANCEL LIFECYCLE

- **Cloning**: `OPEN_SETTINGS` performs a shallow copy: `draftSettings: { ...state.settings }`.
- **Isolation**: No live mutations to `state.settings` occur while modal is open.
- **Commit**: `APPLY_SETTINGS` is the only path to updating `state.settings`.
- **Rejection**: `CLOSE_SETTINGS` effectively cancels by nulling `draftSettings`.
- **Cleanup**: `draftSettings` do not survive modal close. Reopening always clones fresh from `settings`.

---

## 5. RESTART DEPENDENCY CHART

| Change Level | Triggers | Settings Involved |
| :--- | :--- | :--- |
| **Live Update** | Visual/Overlay toggle | `devMode`, `diagnosticMode`, `showGravityVisuals`, `showInputZones`. |
| **Regenerate Board** | Logic/Content change | `targetSource`, `multiplesConfig`, `numberPool`, `rangeConfig`, `specificConfig`, `operationMode`. |
| **Full App Restart** | Structural change | `gridSize`, `activeProfileId`. |

---

## 6. DEAD / HIDDEN SETTINGS

- **Dead Logic**: `devConsole`, `showInputZones` - Referenced in interface but no rendering code found in `SpeedGridGame`.
- **Hidden Controls**: `operationMode`, `presentationMode`, `cycleLength`, `gridSize` - Hardcoded in profiles, no UI controls provided.
- **Experimental**: `stressTestMode` - Tracked in metrics but no UI to enable.
- **Ambiguous**: `diagnosticMode` vs `devMode`. They overlap in purpose but act on different UI elements.

---

## 7. PERFORMANCE AUDIT

- **Excessive Rerenders**: `SettingsModal` uses `JSON.stringify` on every render to calculate `isDirty`. For small settings objects this is negligible, but for deep objects it's inefficient.
- **Loop Risks**: `APPLY_SETTINGS` terminates correctly. No infinite rebuild loops detected.
- **Draft Efficiency**: `SET_DRAFT_SETTING` is efficient (shallow object spread).

---

## 8. DEV MODE ISOLATION PROOF

- **Gravity Trace**: `diagnosticMode` controls whether `lastGravityTrace` is updated (Rules: 1043).
- **Console Logs**: Manual check shows `if (state.settings.devMode)` guards around most `console.log/error` in Rules.
- **Performance Overlay**: `SpeedGridGame.tsx:720` explicitly returns `null` if `!devMode`.
- **Forensic Modal**: Toggle in bottom nav is guarded by `state.settings.devMode`.

---

## 9. RECOMMENDED CLEANUP PLAN

1.  **Fix `generateInitialState` Interface**: Modify to accept a full `Partial<SpeedGridSettings>` rather than picking specific fields. This fixes the "Silent Failure" on `targetSource` and `numberPool`.
2.  **Consolidate Dev/Diagnostic**: Merge `devMode` and `diagnosticMode` into a single `developerMode` setting to reduce ambiguity.
3.  **Wired Missing Controls**: Add toggles for `showGravityVisuals`, `operationMode`, and `multiTouchMode` to the Teacher Console.
4.  **Optimization**: Replace `JSON.stringify` in `isDirty` with a memoized check or specific key comparison.