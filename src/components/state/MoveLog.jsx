import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MOVE_OUTCOMES, MOVE_RISK } from '@/lib/gameMeta';

export default function MoveLog({ moves, players }) {
  const recentMoves = [...moves]
    .sort((a, b) => (b.order || 0) - (a.order || 0))
    .slice(0, 10);

  if (recentMoves.length === 0) {
    return <p className="text-sm text-muted-foreground">No moves recorded yet.</p>;
  }

  return (
    <div className="space-y-2">
      {recentMoves.map((move, i) => {
        const mover = players.find(p => p.id === move.player_id);
        return (
          <div key={move.id} className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/50">
            <span className="text-xs text-muted-foreground w-6">#{moves.length - i}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{move.title}</p>
              <span className="text-[10px] text-muted-foreground">{mover?.name || 'Unknown'}</span>
            </div>
            <Badge className={`text-[8px] ${MOVE_OUTCOMES[move.outcome]?.color || ''}`}>
              {MOVE_OUTCOMES[move.outcome]?.label || move.outcome}
            </Badge>
            <Badge className={`text-[8px] ${MOVE_RISK[move.risk]?.color || ''}`}>
              {MOVE_RISK[move.risk]?.label || move.risk}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
