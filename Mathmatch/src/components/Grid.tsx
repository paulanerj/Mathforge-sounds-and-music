import React, { useEffect, useRef, useState } from 'react';
import { TileData } from '../types';
import Tile from './Tile';

interface GridProps {
  grid: TileData[][];
  selectedIds: string[];
  clearingIds: string[];
  onTileClick: (id: string) => void;
  onTileSwap: (id: string, delta: { r: number; c: number }) => void;
  rows: number;
  cols: number;
}

const Grid: React.FC<GridProps> = ({ grid, selectedIds, clearingIds, onTileClick, onTileSwap, rows, cols }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const flatTiles = grid.flat();

  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const maxTileWidth = clientWidth / cols;
      const maxTileHeight = clientHeight / rows;
      const tileSize = Math.max(24, Math.floor(Math.min(maxTileWidth, maxTileHeight)));
      setDimensions({ width: tileSize * cols, height: tileSize * rows });
    };

    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) observer.observe(containerRef.current);
    updateDimensions();

    return () => observer.disconnect();
  }, [rows, cols]);

  return (
    <div ref={containerRef} className="grid-outer">
      <div
        className="game-grid"
        style={
          {
            width: dimensions.width,
            height: dimensions.height,
            '--tile-width': `${100 / cols}%`
          } as React.CSSProperties
        }
      >
        {flatTiles.map(tile => (
          <Tile
            key={tile.id}
            data={tile}
            totalRows={rows}
            isSelected={selectedIds.includes(tile.id)}
            isClearing={clearingIds.includes(tile.id)}
            onClick={onTileClick}
            onSwap={onTileSwap}
          />
        ))}
      </div>
    </div>
  );
};

export default Grid;
