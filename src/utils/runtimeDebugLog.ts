export type RuntimeDebugEvent = {
  time: number;
  label: string;
  source: string;
  data?: Record<string, unknown>;
};

let eventLog: RuntimeDebugEvent[] = [];
const MAX_EVENTS = 250;

export function logRuntimeEvent(label: string, source: string, data?: Record<string, unknown>): void {
  const event: RuntimeDebugEvent = {
    time: Date.now(),
    label,
    source,
    ...(data && { data }),
  };
  eventLog.unshift(event);
  if (eventLog.length > MAX_EVENTS) {
    eventLog.pop();
  }
}

export function getRuntimeDebugLog(): RuntimeDebugEvent[] {
  return [...eventLog];
}

export function clearRuntimeDebugLog(): void {
  eventLog = [];
}

export async function copyRuntimeDebugLogToClipboard(): Promise<void> {
  const logStr = JSON.stringify(getRuntimeDebugLog(), null, 2);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(logStr);
      console.log('[DEBUG] Log copied to clipboard');
    } else {
      console.warn('[DEBUG] Clipboard API not available, dumping to console', logStr);
    }
  } catch (err) {
    console.error('[DEBUG] Failed to copy log', err);
    console.warn('[DEBUG] Log dump: ', logStr);
  }
}

// Expose globally for dev/QA debugging
declare global {
  interface Window {
    __MATHFORGE_DEBUG_LOG__?: {
      get: typeof getRuntimeDebugLog;
      clear: typeof clearRuntimeDebugLog;
      copy: typeof copyRuntimeDebugLogToClipboard;
    };
  }
}

if (typeof window !== 'undefined') {
  window.__MATHFORGE_DEBUG_LOG__ = {
    get: getRuntimeDebugLog,
    clear: clearRuntimeDebugLog,
    copy: copyRuntimeDebugLogToClipboard,
  };
}
