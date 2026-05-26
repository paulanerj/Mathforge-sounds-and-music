import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { TileData } from '../types';
import { getTileColor } from '../utils/gameLogic';
import { useSwipe } from '../hooks/useSwipe';

interface TileProps {
  data: TileData;
  totalRows: number;
  isSelected: boolean;
  isClearing: boolean;
  onClick: (id: string) => void;
  onSwap: (sourceId: string, delta: { r: number; c: number }) => void;
}

const Tile: React.FC<TileProps> = ({ data, totalRows, isSelected, isClearing, onClick, onSwap }) => {
  const [isLanding, setIsLanding] = useState(false);
  const previousRow = useRef(data.row);
  const isPlayable = !data.isEmpty && data.value !== null;

  const { handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel, isPressed } = useSwipe({
    disabled: !isPlayable || isClearing,
    onClick: () => onClick(data.id),
    onSwipe: delta => onSwap(data.id, delta)
  });

  useEffect(() => {
    if (data.row !== previousRow.current && !isClearing && isPlayable) {
      previousRow.current = data.row;
    }
  }, [data.row, isClearing, isPlayable]);

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName === 'top' && !isClearing && isPlayable) {
      setIsLanding(true);
    }
  };

  const handleAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
    if (event.animationName.includes('land-squash')) {
      setIsLanding(false);
    }
  };

  const transitionDelay = isClearing ? '0ms' : `${Math.max(0, totalRows - 1 - data.row) * 35}ms`;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onTransitionEnd={handleTransitionEnd}
      onAnimationEnd={handleAnimationEnd}
      className={clsx(
        'tile-shell',
        isClearing && 'tile-clearing',
        isLanding && 'tile-landing',
        data.isEmpty && 'tile-empty-shell'
      )}
      style={{
        top: `${(data.row * 100) / totalRows}%`,
        left: `calc(${data.col} * var(--tile-width))`,
        width: 'var(--tile-width)',
        height: `${100 / totalRows}%`,
        transitionDelay
      }}
    >
      <div
        className={clsx(
          'tile-face',
          data.isEmpty && 'tile-face-empty',
          data.isBomb && 'tile-face-bomb',
          isSelected && 'tile-selected',
          isPressed && !isSelected && 'tile-pressed'
        )}
        style={{
          backgroundColor: isPlayable && !data.isBomb ? getTileColor(data.value) : undefined
        }}
      >
        {data.isEmpty ? (
          <div className="empty-tile-marker" aria-label="empty cell" />
        ) : (
          <>
            {data.isBomb && <div className="bomb-pulse-layer" />}

            {!data.isBomb && <span className="tile-number">{data.value}</span>}

            {data.isBomb && (
              <>
                <span className="tile-number bomb-number-fade">{data.value}</span>
                <span className="bomb-icon bomb-icon-fade">💣</span>
              </>
            )}

            {isLanding && (
              <>
                <div className="land-particle particle-left" />
                <div className="land-particle particle-right" />
              </>
            )}

            {isSelected && <div className="selected-badge">✓</div>}
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(Tile);
