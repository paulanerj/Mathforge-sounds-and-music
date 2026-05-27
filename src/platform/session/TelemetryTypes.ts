────────────────────────────────────────────────────────────────────────────────
export type TelemetryEvent =
  | { type: "session_start"; game: string; ts: number }
  | { type: "session_end"; game: string; ts: number; duration: number; moves: number; actions: number }
  | { type: "action"; game: string; ts: number; actionType: string }
  | { type: "move_success"; game: string; ts: number; moveType: string }
  | { type: "move_invalid"; game: string; ts: number; moveType: string }
  | { type: "trophy"; game: string; ts: number; value: number }
  | { type: "restart"; game: string; ts: number };
────────────────────────────────────────────────────────────────────────────────
