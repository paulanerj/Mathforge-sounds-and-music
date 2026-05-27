────────────────────────────────────────────────────────────────────────────────
import { SpeedGridState, SpeedGridAction, SpeedGridRules } from './SpeedGridRules';

export function speedGridReducer(state: SpeedGridState, action: SpeedGridAction): SpeedGridState {
  return SpeedGridRules.resolveInteraction(state, action);
}
────────────────────────────────────────────────────────────────────────────────
