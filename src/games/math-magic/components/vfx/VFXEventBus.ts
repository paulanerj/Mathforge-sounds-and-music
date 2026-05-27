────────────────────────────────────────────────────────────────────────────────
export type VFXEventType = 'TILE_SOLVED' | 'GAME_VICTORY';

export const emitVFXEvent = (eventType: VFXEventType, payload?: any) => {
  const event = new CustomEvent(`MATH_MAGIC_${eventType}`, { detail: payload });
  window.dispatchEvent(event);
};

export const subscribeToVFXEvent = (eventType: VFXEventType, callback: (payload: any) => void) => {
  const handler = (e: Event) => {
    callback((e as CustomEvent).detail);
  };
  window.addEventListener(`MATH_MAGIC_${eventType}`, handler);
  return () => window.removeEventListener(`MATH_MAGIC_${eventType}`, handler);
};
────────────────────────────────────────────────────────────────────────────────
