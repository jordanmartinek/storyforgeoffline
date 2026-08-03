import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SIDE_META, PLAYER_STATUS } from '@/lib/gameMeta';

export default function PlayerStateCard({ player }) {
  const stats = [
    { label: 'Initiative', value: player.initiative || 0, color: 'bg-blue-500' },
    { label: 'Pressure', value: player.pressure || 0, color: 'bg-orange-500' },
    { label: 'Morale', value: player.morale || 0, color: 'bg-green-500' },
    { label: 'Threat', value: player.threat_level || 0, color: 'bg-red-500' },
    { label: 'Victory', value: player.victory_progress || 0, color: 'bg-purple-500' },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{player.name}</CardTitle>
          <div className="flex gap-1">
            <Badge className={`text-[9px] ${SIDE_META[player.side]?.color || ''}`}>
              {SIDE_META[player.side]?.label || player.side}
            </Badge>
            {player.status !== 'active' && (
              <Badge className={`text-[9px] ${PLAYER_STATUS[player.status]?.color || ''}`}>
                {PLAYER_STATUS[player.status]?.label}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {stats.map(stat => (
          <div key={stat.label} className="space-y-0.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">{stat.label}</span>
              <span>{stat.value}</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${stat.color}`} style={{ width: `${stat.value}%` }} />
            </div>
          </div>
        ))}
        {player.current_strategy && (
          <p className="text-[10px] text-muted-foreground mt-2 italic">
            Strategy: {player.current_strategy}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
