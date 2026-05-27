────────────────────────────────────────────────────────────────────────────────
export type TimerDirection = 'countdown' | 'countup';

export interface TimerState {
  readonly direction: TimerDirection;
  readonly totalSeconds: number;
  remainingSeconds: number;
  elapsedSeconds: number;
  isRunning: boolean;
}

export function createTimer(
  totalSeconds: number,
  direction: TimerDirection = 'countdown',
): TimerState {
  return {
    direction,
    totalSeconds,
    remainingSeconds: direction === 'countdown' ? totalSeconds : 0,
    elapsedSeconds: 0,
    isRunning: false,
  };
}

export function startTimer(state: TimerState): TimerState {
  return state.isRunning ? state : { ...state, isRunning: true };
}

export function pauseTimer(state: TimerState): TimerState {
  return !state.isRunning ? state : { ...state, isRunning: false };
}

export function tick(state: TimerState, tickSecs = 1): TimerState {
  if (!state.isRunning) return state;

  const elapsed = state.elapsedSeconds + tickSecs;

  if (state.direction === 'countdown') {
    const remaining = Math.max(0, state.remainingSeconds - tickSecs);
    return { ...state, remainingSeconds: remaining, elapsedSeconds: elapsed };
  } else {
    return {
      ...state,
      remainingSeconds: elapsed,
      elapsedSeconds: elapsed,
    };
  }
}

export function addTime(state: TimerState, seconds: number): TimerState {
  if (state.direction !== 'countdown') return state;
  return {
    ...state,
    remainingSeconds: Math.max(0, state.remainingSeconds + seconds),
  };
}

export function resetTimer(state: TimerState): TimerState {
  return createTimer(state.totalSeconds, state.direction);
}

export function isExpired(state: TimerState): boolean {
  return state.direction === 'countdown' && state.remainingSeconds <= 0;
}

export function isInWarningZone(state: TimerState, warningSeconds = 10): boolean {
  return (
    state.direction === 'countdown' &&
    state.remainingSeconds > 0 &&
    state.remainingSeconds <= warningSeconds
  );
}

export function countdownProgress(state: TimerState): number {
  if (state.totalSeconds === 0) return 0;
  return Math.max(0, Math.min(1, state.remainingSeconds / state.totalSeconds));
}
────────────────────────────────────────────────────────────────────────────────
