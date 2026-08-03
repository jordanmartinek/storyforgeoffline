import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SIDE_META, MOVE_OUTCOMES } from '@/lib/gameMeta';

/**
 * 8x8 SVG board. Players are pieces placed by side.
 */
export default function ChessboardView({ players, moves, onCreate }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [targetSquare, setTargetSquare] = useState(null);
  const [moveTitle, setMoveTitle] = useState('');
  const [moveOutcome, setMoveOutcome] = useState('pending');

  const CELL = 60;
  const BOARD = CELL * 8;

  // Calculate current positions from moves
  const positions = useMemo(() => {
    const pos = {};
    // Starting positions by side
    players.forEach((p, i) => {
      if (p.side === 'protagonist') {
        pos[p.id] = { x: i % 8, y: 7 };
      } else if (p.side === 'antagonist') {
        pos[p.id] = { x: i % 8, y: 0 };
      } else {
        pos[p.id] = { x: i % 8, y: 3 + (i % 2) };
      }
    });

    // Apply moves with coordinates
    const sortedMoves = [...moves].filter(m => m.to_x !== undefined && m.to_y !== undefined)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    sortedMoves.forEach(m => {
      if (pos[m.player_id]) {
        pos[m.player_id] = { x: m.to_x, y: m.to_y };
      }
    });
    return pos;
  }, [players, moves]);

  function handleSquareClick(x, y) {
    if (selectedPlayer) {
      setTargetSquare({ x, y });
    }
  }

  function handlePieceClick(player) {
    setSelectedPlayer(player);
    setTargetSquare(null);
  }

  function recordMove() {
    if (!selectedPlayer || !targetSquare || !moveTitle.trim()) return;
    onCreate({
      player_id: selectedPlayer.id,
      title: moveTitle.trim(),
      outcome: moveOutcome,
      to_x: targetSquare.x,
      to_y: targetSquare.y,
      risk: 'medium',
      order: moves.length,
      story_order: moves.length,
    });
    setSelectedPlayer(null);
    setTargetSquare(null);
    setMoveTitle('');
    setMoveOutcome('pending');
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
      <svg width={BOARD} height={BOARD} className="border border-border rounded">
        {/* Board squares */}
        {Array.from({ length: 8 }, (_, row) =>
          Array.from({ length: 8 }, (_, col) => {
            const isLight = (row + col) % 2 === 0;
            const isTarget = targetSquare?.x === col && targetSquare?.y === row;
            const isSelected = selectedPlayer && positions[selectedPlayer.id]?.x === col && positions[selectedPlayer.id]?.y === row;
            return (
              <rect
                key={`${row}-${col}`}
                x={col * CELL} y={row * CELL}
                width={CELL} height={CELL}
                fill={isTarget ? 'hsl(var(--primary) / 0.3)' : isSelected ? 'hsl(var(--accent))' : isLight ? 'hsl(var(--card))' : 'hsl(var(--muted))'}
                stroke="hsl(var(--border))"
                strokeWidth={0.5}
                onClick={() => handleSquareClick(col, row)}
                className="cursor-pointer"
              />
            );
          })
        )}

        {/* Player pieces */}
        {players.map(player => {
          const pos = positions[player.id];
          if (!pos) return null;
          const sideColor = player.side === 'protagonist' ? '#3b82f6' :
                           player.side === 'antagonist' ? '#ef4444' : '#94a3b8';
          const isActive = selectedPlayer?.id === player.id;
          return (
            <g key={player.id} onClick={() => handlePieceClick(player)} className="cursor-pointer">
              <circle
                cx={pos.x * CELL + CELL / 2}
                cy={pos.y * CELL + CELL / 2}
                r={isActive ? 22 : 18}
                fill={sideColor}
                stroke={isActive ? 'hsl(var(--primary))' : 'hsl(var(--background))'}
                strokeWidth={isActive ? 3 : 2}
              />
              <text
                x={pos.x * CELL + CELL / 2}
                y={pos.y * CELL + CELL / 2 + 4}
                textAnchor="middle"
                className="text-[9px] fill-white font-bold pointer-events-none"
              >
                {player.name.slice(0, 2).toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Move recording form */}
      {selectedPlayer && targetSquare && (
        <div className="flex items-center gap-2 bg-card border rounded-md p-3">
          <span className="text-xs font-medium">{selectedPlayer.name} → ({targetSquare.x},{targetSquare.y})</span>
          <Input
            value={moveTitle}
            onChange={e => setMoveTitle(e.target.value)}
            placeholder="Move title..."
            className="h-8 text-xs w-40"
          />
          <Select value={moveOutcome} onValueChange={setMoveOutcome}>
            <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(MOVE_OUTCOMES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 text-xs" onClick={recordMove}>Record</Button>
        </div>
      )}

      {!selectedPlayer && (
        <p className="text-xs text-muted-foreground">Click a piece, then click a square to record a move.</p>
      )}
    </div>
  );
}
