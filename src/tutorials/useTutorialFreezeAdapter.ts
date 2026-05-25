import { useState, useRef, useCallback } from 'react';
import { logRuntimeEvent } from '../utils/runtimeDebugLog';

export interface UseTutorialFreezeAdapterArgs {
  isGamePaused: boolean;
  togglePause: () => void;
}

export interface TutorialFreezeAdapter {
  isFrozenByOverlay: boolean;
  beginOverlayFreeze: () => void;
  endOverlayFreeze: (options?: { suppressResume?: boolean }) => void;
  wasGamePausedBeforeOverlay: boolean;
}

/**
 * A custom hook to safely manage freeze & resume operations for help and tutorial overlays.
 * Ensures the overlay records the pre-existing pause state of the game and restores it
 * accurately upon exit, preventing accidental double-toggles.
 */
export function useTutorialFreezeAdapter({
  isGamePaused,
  togglePause,
}: UseTutorialFreezeAdapterArgs): TutorialFreezeAdapter {
  const [isFrozenByOverlay, setIsFrozenByOverlay] = useState(false);
  const wasGamePausedBeforeOverlayRef = useRef(false);

  const beginOverlayFreeze = useCallback(() => {
    // Record previous pause state
    wasGamePausedBeforeOverlayRef.current = isGamePaused;
    logRuntimeEvent('beginOverlayFreeze', 'TutorialFreezeAdapter', { wasPaused: isGamePaused });
    
    // Freeze gameplay under overlay if not already paused
    if (!isGamePaused) {
      togglePause();
    }
    
    setIsFrozenByOverlay(true);
  }, [isGamePaused, togglePause]);

  const endOverlayFreeze = useCallback((options?: { suppressResume?: boolean }) => {
    setIsFrozenByOverlay(false);
    logRuntimeEvent('endOverlayFreeze', 'TutorialFreezeAdapter', { 
      suppressResume: options?.suppressResume, 
      wasGamePausedBeforeOverlay: wasGamePausedBeforeOverlayRef.current 
    });
    
    // Only resume if the game was NOT paused before we opened the overlay
    if (!options?.suppressResume && !wasGamePausedBeforeOverlayRef.current && isGamePaused) {
      togglePause();
    }
  }, [isGamePaused, togglePause]);

  return {
    isFrozenByOverlay,
    beginOverlayFreeze,
    endOverlayFreeze,
    wasGamePausedBeforeOverlay: wasGamePausedBeforeOverlayRef.current,
  };
}
