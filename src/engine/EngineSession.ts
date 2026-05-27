export interface EngineSession {
  score: number;
  bestScore: number;
  roundsCompleted: number;
  seed: number;
  startedAt: number;
  profileId: string;
}

export function createSession(
  seed: number,
  profileId: string,
  bestScore = 0,
): EngineSession {
  return {
    score: 0,
    bestScore,
    roundsCompleted: 0,
    seed,
    startedAt: Date.now(),
    profileId,
  };
}

export function addScore(session: EngineSession, delta: number): EngineSession {
  const score = Math.max(0, session.score + delta);
  const bestScore = Math.max(session.bestScore, score);
  return { ...session, score, bestScore };
}

export function incrementRound(session: EngineSession): EngineSession {
  return { ...session, roundsCompleted: session.roundsCompleted + 1 };
}

export function elapsedMs(session: EngineSession, now: number = Date.now()): number {
  return Math.max(0, now - session.startedAt);
}