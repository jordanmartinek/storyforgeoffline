import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MOVE_OUTCOMES } from '@/lib/gameMeta';
import { Swords } from 'lucide-react';

/**
 * Frequency of each move outcome as a horizontal bar chart.
 */
export default function MoveOutcomeChart({ moves }) {
  const counts = {};
  Object.keys(MOVE_OUTCOMES).forEach(k => { counts[k] = 0; });
  moves.forEach(m => { counts[m.outcome] = (counts[m.outcome] || 0) + 1; });
  const maxCount = Math.max(1, ...Object.values(counts));

  if (moves.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Swords className="h-4 w-4 text-primary" /> Move Outcomes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No moves recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  const OUTCOME_COLORS = {
    pending: 'bg-gray-400',
    success: 'bg-green-500',
    partial: 'bg-yellow-500',
    failure: 'bg-red-500',
    catastrophic: 'bg-rose-700',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Swords className="h-4 w-4 text-primary" /> Move Outcomes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(MOVE_OUTCOMES).map(([key, meta]) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>{meta.label}</span>
              <span className="text-muted-foreground">{counts[key]}</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${OUTCOME_COLORS[key] || 'bg-primary'}`}
                style={{ width: `${(counts[key] / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}

        <div className="text-xs text-muted-foreground pt-2">
          Total moves: {moves.length}
        </div>
      </CardContent>
    </Card>
  );
}
