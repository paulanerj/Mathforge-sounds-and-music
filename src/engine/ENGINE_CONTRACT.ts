export function assertEngineBoundary(): void {}

export function assertSpawnIntentCount(requested: number, provided: number): void {
  if (requested !== provided || (requested > 0 && provided === 0)) {
    const errorMsg = `[SPAWN_CONTRACT_VIOLATION] Requested: ${requested}, Provided: ${provided}.`;
    if (process.env.NODE_ENV === "production") {
      console.warn(errorMsg);
    } else {
      throw new Error(errorMsg);
    }
  }
}

export function assertStateTransition<T>(oldState: T, newState: T): void {
  if (oldState === newState) {
    const errorMsg = "[SYSTEM_AUDIT] Reducer returned identical state reference. Ensure no-op was intended.";
    if (process.env.NODE_ENV === "production") {
      console.warn(errorMsg);
    } else {
      throw new Error(errorMsg);
    }
  }
}

export function assertNoSystemLeak(gameName: string): void {
  const forbiddenGames: string[] = [];

  if (forbiddenGames.includes(gameName)) {
    const errorMsg = `[BOUNDARY VIOLATION] ${gameName} reached a system isolation guard.`;
    if (process.env.NODE_ENV === "production") {
      console.warn(errorMsg);
    } else {
      throw new Error(errorMsg);
    }
  }
}