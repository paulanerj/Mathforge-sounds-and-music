import { useRef, useState, type PointerEvent } from 'react';
import { UI_CONSTANTS } from '../constants';

interface UseSwipeProps {
  onSwipe: (delta: { r: number; c: number }) => void;
  onClick: () => void;
  disabled?: boolean;
}

export const useSwipe = ({ onSwipe, onClick, disabled = false }: UseSwipeProps) => {
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const activePointerId = useRef<number | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    activePointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { x: event.clientX, y: event.clientY };
    isDragging.current = false;
    setIsPressed(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || activePointerId.current !== event.pointerId || !dragStart.current) return;

    const dx = event.clientX - dragStart.current.x;
    const dy = event.clientY - dragStart.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > UI_CONSTANTS.LONG_PRESS_THRESHOLD) {
      isDragging.current = true;
    }
  };

  const finishPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || activePointerId.current !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsPressed(false);

    if (!dragStart.current) {
      activePointerId.current = null;
      return;
    }

    const dx = event.clientX - dragStart.current.x;
    const dy = event.clientY - dragStart.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > UI_CONSTANTS.SWIPE_THRESHOLD) {
      const deltaC = absX > absY ? (dx > 0 ? 1 : -1) : 0;
      const deltaR = absX <= absY ? (dy > 0 ? 1 : -1) : 0;
      onSwipe({ r: deltaR, c: deltaC });
    } else if (!isDragging.current) {
      onClick();
    }

    dragStart.current = null;
    isDragging.current = false;
    activePointerId.current = null;
  };

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp: finishPointer,
    handlePointerCancel: finishPointer,
    isPressed
  };
};
