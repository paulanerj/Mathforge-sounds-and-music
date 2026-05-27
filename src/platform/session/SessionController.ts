import { TelemetryRecorder } from "./TelemetryRecorder";

export class SessionController {
  active: boolean;
  startTime: number;
  moves: number;
  actions: number;
  game: string;
  telemetry: TelemetryRecorder;

  constructor(game: string = "unknown") {
    this.active = false;
    this.startTime = 0;
    this.moves = 0;
    this.actions = 0;
    this.game = game;
    this.telemetry = new TelemetryRecorder();
  }

  start() {
    this.active = true;
    this.startTime = Date.now();
    this.moves = 0;
    this.actions = 0;
    this.telemetry.record({ type: "session_start", game: this.game, ts: this.startTime });
  }

  recordAction(type?: string) {
    if (!this.active) return;
    this.actions++;
    if (type) {
      this.telemetry.record({ type: "action", game: this.game, ts: Date.now(), actionType: type });
    }
  }

  recordMove(type: string = "unspecified") {
    if (!this.active) return;
    this.moves++;
    this.telemetry.record({ type: "move_success", game: this.game, ts: Date.now(), moveType: type });
  }

  recordMoveInvalid(type: string = "unspecified") {
    if (!this.active) return;
    this.telemetry.record({ type: "move_invalid", game: this.game, ts: Date.now(), moveType: type });
  }

  recordTrophy(value: number) {
    if (!this.active) return;
    this.telemetry.record({ type: "trophy", game: this.game, ts: Date.now(), value });
  }

  end() {
    if (!this.active) return null;

    const duration = Date.now() - this.startTime;
    const ts = Date.now();

    this.telemetry.record({
      type: "session_end",
      game: this.game,
      ts,
      duration,
      moves: this.moves,
      actions: this.actions
    });

    this.active = false;

    return {
      moves: this.moves,
      actions: this.actions,
      duration,
      game: this.game,
      events: this.telemetry.flush()
    };
  }

  reset() {
    this.active = false;
    this.startTime = 0;
    this.moves = 0;
    this.actions = 0;
    this.telemetry.record({ type: "restart", game: this.game, ts: Date.now() });
    console.log("[TELEMETRY RESTART]", this.telemetry.flush());
    this.telemetry.reset();
  }
}