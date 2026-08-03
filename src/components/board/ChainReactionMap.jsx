import React, { useState, useMemo } from 'react';
import { SIDE_META, MOVE_OUTCOMES } from '@/lib/gameMeta';

/**
 * SVG bipartite graph: Moves (left) → Objectives (right).
 */
export default function ChainReactionMap({ moves, objectives, players }) {
  const [highlightedMove, setHighlightedMove] = useState(null);

  const { moveNodes, objectiveNodes, links } = useMemo(() => {
    const sortedMoves = [...moves].sort((a, b) => (a.order || 0) - (b.order || 0));
    const width = 800;
    const leftX = 100;
    const rightX = 700;

    // Position moves on left
    const mNodes = sortedMoves.map((m, i) => ({
      ...m,
      x: leftX,
      y: 40 + i * 50,
      playerSide: players.find(p => p.id === m.player_id)?.side || 'neutral',
    }));

    // Group objectives by player, position on right
    const oNodes = objectives.map((o, i) => ({
      ...o,
      x: rightX,
      y: 40 + i * 60,
      playerSide: players.find(p => p.id === o.player_id)?.side || 'neutral',
    }));

    // Build links
    const edgeList = [];
    sortedMoves.forEach(move => {
      if (move.objective_id) {
        const obj = oNodes.find(o => o.id === move.objective_id);
        if (obj) {
          const moverSide = players.find(p => p.id === move.player_id)?.side;
          const ownerSide = players.find(p => p.id === obj.player_id)?.side;
          const isOpposing = moverSide && ownerSide && moverSide !== ownerSide && moverSide !== 'neutral' && ownerSide !== 'neutral';
          const success = ['success', 'partial'].includes(move.outcome);
          const impact = isOpposing ? (success ? 'setback' : 'advance') : (success ? 'advance' : 'setback');
          edgeList.push({
            moveId: move.id,
            objectiveId: obj.id,
            impact,
            explicit: true,
          });
        }
      }
    });

    return { moveNodes: mNodes, objectiveNodes: oNodes, links: edgeList };
  }, [moves, objectives, players]);

  const svgHeight = Math.max(400, Math.max(moveNodes.length * 50, objectiveNodes.length * 60) + 80);

  if (moves.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Record moves to see the chain reaction map.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <svg viewBox={`0 0 800 ${svgHeight}`} className="w-full min-h-full">
        {/* Links */}
        {links.map((link, i) => {
          const src = moveNodes.find(m => m.id === link.moveId);
          const tgt = objectiveNodes.find(o => o.id === link.objectiveId);
          if (!src || !tgt) return null;
          const dimmed = highlightedMove && highlightedMove !== link.moveId;
          const color = link.impact === 'advance' ? '#22c55e' : link.impact === 'setback' ? '#ef4444' : '#94a3b8';
          return (
            <line
              key={i}
              x1={src.x + 60} y1={src.y}
              x2={tgt.x - 60} y2={tgt.y}
              stroke={color}
              strokeWidth={2}
              strokeDasharray={link.explicit ? undefined : '4 4'}
              opacity={dimmed ? 0.15 : 0.7}
            />
          );
        })}

        {/* Move nodes (left) */}
        {moveNodes.map(m => {
          const color = MOVE_OUTCOMES[m.outcome]?.color?.includes('green') ? '#22c55e' :
                       MOVE_OUTCOMES[m.outcome]?.color?.includes('red') ? '#ef4444' :
                       MOVE_OUTCOMES[m.outcome]?.color?.includes('yellow') ? '#eab308' : '#94a3b8';
          return (
            <g key={m.id}
              onMouseEnter={() => setHighlightedMove(m.id)}
              onMouseLeave={() => setHighlightedMove(null)}
              className="cursor-pointer"
            >
              <rect
                x={m.x - 55} y={m.y - 14}
                width={110} height={28}
                rx={4} fill="hsl(var(--card))"
                stroke={color} strokeWidth={1.5}
              />
              <text x={m.x} y={m.y + 3} textAnchor="middle" className="text-[9px] fill-foreground font-medium">
                {m.title?.slice(0, 16) || 'Move'}
              </text>
            </g>
          );
        })}

        {/* Objective nodes (right) */}
        {objectiveNodes.map(o => (
          <g key={o.id}>
            <rect
              x={o.x - 55} y={o.y - 14}
              width={110} height={28}
              rx={4} fill="hsl(var(--card))"
              stroke="hsl(var(--primary))" strokeWidth={1.5}
            />
            <text x={o.x} y={o.y + 3} textAnchor="middle" className="text-[9px] fill-foreground font-medium">
              {o.title?.slice(0, 16) || 'Objective'}
            </text>
          </g>
        ))}

        {/* Labels */}
        <text x={100} y={20} textAnchor="middle" className="text-[10px] fill-muted-foreground font-semibold">MOVES</text>
        <text x={700} y={20} textAnchor="middle" className="text-[10px] fill-muted-foreground font-semibold">OBJECTIVES</text>
      </svg>
    </div>
  );
}
