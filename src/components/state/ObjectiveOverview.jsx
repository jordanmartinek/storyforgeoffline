import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { OBJECTIVE_TYPES, OBJECTIVE_STATUS } from '@/lib/gameMeta';

export default function ObjectiveOverview({ objectives, players }) {
  const active = objectives.filter(o => o.status === 'active');

  if (active.length === 0) {
    return <p className="text-sm text-muted-foreground">No active objectives.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {active.map(obj => {
        const owner = players.find(p => p.id === obj.player_id);
        return (
          <Card key={obj.id}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h5 className="text-xs font-medium">{obj.title}</h5>
                <Badge className={`text-[8px] shrink-0 ${OBJECTIVE_TYPES[obj.type]?.color || ''}`}>
                  {OBJECTIVE_TYPES[obj.type]?.label || obj.type}
                </Badge>
              </div>
              {owner && (
                <p className="text-[10px] text-muted-foreground mb-1">Owner: {owner.name}</p>
              )}
              <Progress value={obj.progress || 0} className="h-1.5" />
              <span className="text-[10px] text-muted-foreground">{obj.progress || 0}%</span>
              {obj.stakes && (
                <p className="text-[10px] text-muted-foreground mt-1 italic">Stakes: {obj.stakes}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
