────────────────────────────────────────────────────────────────────────────────
import type { TelemetryEvent } from "./TelemetryTypes";

export class TelemetryRecorder {
  events: TelemetryEvent[] = [];

  record(event: TelemetryEvent) {
    this.events.push(event);
  }

  flush() {
    return [...this.events];
  }

  reset() {
    this.events = [];
  }
}
────────────────────────────────────────────────────────────────────────────────
