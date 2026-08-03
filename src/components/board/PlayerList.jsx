import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SIDE_META, PLAYER_STATUS } from '@/lib/gameMeta';
import { cn } from '@/lib/utils';
import { Plus, User } from 'lucide-react';

export default function PlayerList({ players, selected, onSelect, onCreate }) {
  const sortedPlayers = [...players].sort((a, b) => {
    const order = { protagonist: 0, antagonist: 1, neutral: 2 };
    return (order[a.side] || 2) - (order[b.side] || 2);
  });

  return (
    <div className="w-56 border-r p-3 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold">Players</h4>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCreate}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin">
        {sortedPlayers.map(player => (
          <button
            key={player.id}
            onClick={() => onSelect(player)}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors',
              selected?.id === player.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
            )}
          >
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{player.name}</p>
              <div className="flex gap-1">
                <Badge className={`text-[8px] px-1 py-0 ${SIDE_META[player.side]?.color || ''}`}>
                  {SIDE_META[player.side]?.label || player.side}
                </Badge>
                {player.status !== 'active' && (
                  <Badge className={`text-[8px] px-1 py-0 ${PLAYER_STATUS[player.status]?.color || ''}`}>
                    {PLAYER_STATUS[player.status]?.label}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
