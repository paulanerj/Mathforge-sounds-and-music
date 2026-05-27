import React from 'react';
import { Tile } from './Tile';
import { GridPos } from '../types';
import { TILE_GAP, BOARD_PADDING } from '../layoutTokens';
import { isSelected } from '../services/SelectionService';

interface BoardProps {
  grid: number[][];
  tileSize: number;
  target: number;
  showFactorDots: boolean;
  showDistractorDots: boolean;
  selection: GridPos[];
  clearingPositions: GridPos[];
  trophyMask: boolean[][];
  frozenMask: boolean[][];
  ignitedBombPos: GridPos | null;
  bombFuseProgress: number;
  dragSource: GridPos | null;
  dropTarget: GridPos | null;
  poppingPos: GridPos | null;
  spawnedPositions: GridPos[];
  countingIndex: number;
  countedTrophies: GridPos[];
  mergeHighlight: 'invalid' | 'valid' | 'trophy' | null;
  isShaking: boolean;
  wildcardAnimPos?: GridPos[];
  wildcardAnimProgress?: number;
  blockedAnimPos?: GridPos[];
  explodingPositions?: GridPos[];
  boardRef: React.RefObject<HTMLDivElement | null>;
}

function tileCx(index: number, tileSize: number): number {
  return BOARD_PADDING + index * (tileSize + TILE_GAP) + tileSize / 2;
}

function assertValidPositions(arr: any[], label: string) {
  if (!Array.isArray(arr)) {
    throw new Error(`${label} is not array`);
  }

  for (let i = 0; i < arr.length; i++) {
    const p = arr[i];
    if (!p || p.row === undefined || p.col === undefined) {
      console.error("INVALID POSITION IN UI", label, i, p, arr);
      throw new Error(`${label} invalid at index ${i}. Type: ${typeof p}`);
    }
  }
}

const Board = React.memo(function Board({
  grid,
  tileSize,
  target,
  showFactorDots,
  showDistractorDots,
  selection,
  clearingPositions,
  trophyMask,
  frozenMask,
  ignitedBombPos,
  bombFuseProgress,
  dragSource,
  dropTarget,
  poppingPos,
  spawnedPositions,
  countingIndex,
  countedTrophies,
  mergeHighlight,
  isShaking,
  wildcardAnimPos = [],
  wildcardAnimProgress = 0,
  blockedAnimPos = [],
  explodingPositions = [],
  boardRef,
}: BoardProps) {
  assertValidPositions(selection, "selection");
  assertValidPositions(clearingPositions, "clearingPositions");
  assertValidPositions(spawnedPositions, "spawnedPositions");
  assertValidPositions(countedTrophies, "countedTrophies");

  const rows = grid.length;
  const cols = grid[0]?.length ?? 5;

  const isWildcardBond = wildcardAnimPos.length === 2;
  const linePos = (dragSource && dropTarget) ? { s: dragSource, t: dropTarget } 
                : isWildcardBond ? { s: wildcardAnimPos[0], t: wildcardAnimPos[1] } 
                : null;

  const svgLine =
    linePos !== null
      ? {
          x1: tileCx(linePos.s.col, tileSize),
          y1: tileCx(linePos.s.row, tileSize),
          x2: tileCx(linePos.t.col, tileSize),
          y2: tileCx(linePos.t.row, tileSize),
        }
      : null;

  const boardW = BOARD_PADDING * 2 + cols * tileSize + (cols - 1) * TILE_GAP;
  const boardH = BOARD_PADDING * 2 + rows * tileSize + (rows - 1) * TILE_GAP;

  return (
    <div
      ref={boardRef}
      style={{
        position: 'relative',
        background: 'linear-gradient(160deg, #EADCC5 0%, #D8CDBC 45%, #C4B8A8 100%)',
        borderRadius: 8,
        padding: BOARD_PADDING,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        animation: isShaking ? 'cgBoardShake 0.12s ease-out' : undefined,
        border: '1px solid rgba(0,0,0,0.05)',
        width: boardW,
        height: boardH,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${tileSize}px)`,
          gap: TILE_GAP,
        }}
      >
        {grid.map((row, r) =>
          row.map((val, c) => {
            const pos: GridPos = { row: r, col: c };
            const isDropTgt =
              dropTarget !== null && dropTarget.row === r && dropTarget.col === c;
            const isBombLit =
              ignitedBombPos !== null &&
              ignitedBombPos.row === r &&
              ignitedBombPos.col === c;
            const isCounting = countingIndex !== -1 && 
              countedTrophies[countingIndex] &&
              countedTrophies[countingIndex].row === r && 
              countedTrophies[countingIndex].col === c;
            const isCounted = countedTrophies.some(p => p && p.row === r && p.col === c);
            const isWildcardAnimated = wildcardAnimPos.some(p => p && p.row === r && p.col === c);
            const isBlockedAnimated = blockedAnimPos.some(p => p && p.row === r && p.col === c);
            const isExploding = explodingPositions.some(p => p && p.row === r && p.col === c);
            const isTrophy = trophyMask[r]?.[c] ?? false;
            const isFrozen = frozenMask[r]?.[c] ?? false;

            const isFactorIndicator = 
              showFactorDots && 
              val > 0 && 
              val < 99 && 
              target > 0 && 
              target % val === 0 && 
              !isTrophy && 
              !isFrozen &&
              !isBombLit;
              
            const isDistractorIndicator = 
              showDistractorDots && 
              val > 0 && 
              val < 99 && 
              target > 0 && 
              target % val !== 0 && 
              !isTrophy && 
              !isFrozen &&
              !isBombLit;
 
            return (
              <Tile
                key={`${r},${c}`}
                val={val}
                size={tileSize}
                row={r}
                col={c}
                selected={isSelected(selection, pos)}
                clearing={clearingPositions.some((p) => p && p.row === r && p.col === c)}
                isTrophy={isTrophy}
                isFrozen={isFrozen}
                isFactorIndicator={isFactorIndicator}
                isDistractorIndicator={isDistractorIndicator}
                isBombLit={isBombLit}
                isDragSource={dragSource !== null && dragSource.row === r && dragSource.col === c}
                isDropTarget={isDropTgt}
                isPopping={poppingPos !== null && poppingPos.row === r && poppingPos.col === c}
                isSpawning={spawnedPositions.some((p) => p && p.row === r && p.col === c)}
                isCounting={isCounting}
                isCounted={isCounted}
                isWildcardAnimated={isWildcardAnimated}
                wildcardAnimProgress={isWildcardAnimated ? wildcardAnimProgress : 0}
                isBlockedAnimated={isBlockedAnimated}
                isExploding={isExploding}
                mergeHighlight={isDropTgt ? (mergeHighlight ?? undefined) : undefined}
              />
            );
          }),
        )}
      </div>

      {svgLine && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: boardW,
            height: boardH,
            pointerEvents: 'none',
            zIndex: 5,
          }}
          width={boardW}
          height={boardH}
        >
          {isWildcardBond && (
            <line
              x1={svgLine.x1}
              y1={svgLine.y1}
              x2={svgLine.x2}
              y2={svgLine.y2}
              stroke="rgba(255, 215, 0, 0.4)"
              strokeWidth={tileSize * 0.4}
              strokeLinecap="round"
              style={{ filter: 'blur(8px)', opacity: 0.3 + wildcardAnimProgress * 0.4 }}
            />
          )}

          <line
            x1={svgLine.x1}
            y1={svgLine.y1}
            x2={svgLine.x2}
            y2={svgLine.y2}
            stroke={isWildcardBond ? `rgba(255, 255, 255, ${0.4 + wildcardAnimProgress * 0.6})` : "white"}
            strokeWidth={isWildcardBond ? 3 + wildcardAnimProgress * 5 : 3}
            strokeOpacity={isWildcardBond ? 1 : 0.20}
            strokeLinecap="round"
            strokeDasharray={isWildcardBond ? "none" : "8,4"}
          />
        </svg>
      )}
    </div>
  );
});

export default Board;