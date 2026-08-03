import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { lastNDays } from '@/lib/writingStats';
import { Flame } from 'lucide-react';

const ROWS = ['Words', 'Success', 'Partial', 'Failure', 'Catastrophic', 'Pending'];

/**
 * 30-day heatmap grid with color intensity per day + momentum verdict.
 */
export default function PacingHeatmap({ sessions, moves }) {
  const days = lastNDays(30);

  const data = useMemo(() => {
    const sessionMap = Object.fromEntries(sessions.map(s => [s.date, s]));
    const movesByDate = {};
    moves.forEach(m => {
      const date = m.created_date?.slice(0, 10);
      if (date) {
        if (!movesByDate[date]) movesByDate[date] = [];
        movesByDate[date].push(m);
      }
    });

    return days.map(day => {
      const session = sessionMap[day];
      const dayMoves = movesByDate[day] || [];
      return {
        date: day,
        words: session?.words_written || 0,
        success: dayMoves.filter(m => m.outcome === 'success').length,
        partial: dayMoves.filter(m => m.outcome === 'partial').length,
        failure: dayMoves.filter(m => m.outcome === 'failure').length,
        catastrophic: dayMoves.filter(m => m.outcome === 'catastrophic').length,
        pending: dayMoves.filter(m => m.outcome === 'pending').length,
      };
    });
  }, [sessions, moves, days]);

  // Max values for normalization
  const maxWords = Math.max(1, ...data.map(d => d.words));
  const maxMoves = Math.max(1, ...data.map(d => d.success + d.partial + d.failure + d.catastrophic + d.pending));

  function cellColor(row, val) {
    if (val === 0) return 'bg-muted';
    const intensity = Math.min(1, val / (row === 'Words' ? maxWords : maxMoves));
    if (row === 'Words') return intensity > 0.7 ? 'bg-primary' : intensity > 0.3 ? 'bg-primary/60' : 'bg-primary/30';
    if (row === 'Success') return intensity > 0.5 ? 'bg-green-500' : 'bg-green-500/40';
    if (row === 'Partial') return intensity > 0.5 ? 'bg-yellow-500' : 'bg-yellow-500/40';
    if (row === 'Failure') return intensity > 0.5 ? 'bg-red-500' : 'bg-red-500/40';
    if (row === 'Catastrophic') return intensity > 0.5 ? 'bg-rose-700' : 'bg-rose-700/40';
    return intensity > 0.5 ? 'bg-gray-400' : 'bg-gray-400/40';
  }

  // Momentum verdict
  const last7 = data.slice(-7);
  const recentWords = last7.reduce((s, d) => s + d.words, 0);
  const recentSuccess = last7.reduce((s, d) => s + d.success, 0);
  const recentFailure = last7.reduce((s, d) => s + d.failure + d.catastrophic, 0);

  let momentum = 'Steady';
  if (recentWords > maxWords * 3 && recentSuccess > recentFailure) momentum = 'Strong Momentum';
  else if (recentWords < maxWords && recentFailure > recentSuccess) momentum = 'Losing Ground';
  else if (recentWords === 0) momentum = 'Stalled';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Flame className="h-4 w-4 text-primary" /> Pacing Heatmap (30 days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {ROWS.map(row => {
            const rowKey = row.toLowerCase();
            return (
              <div key={row} className="flex items-center gap-1">
                <span className="text-[9px] text-muted-foreground w-16 text-right shrink-0">{row}</span>
                <div className="flex gap-px flex-1">
                  {data.map((d, i) => {
                    const val = rowKey === 'words' ? d.words : d[rowKey] || 0;
                    return (
                      <div
                        key={i}
                        className={`h-4 flex-1 rounded-sm ${cellColor(row, val)}`}
                        title={`${d.date.slice(5)}: ${val}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground mt-2 ml-[4.5rem]">
          <span>{days[0]?.slice(5)}</span>
          <span>Today</span>
        </div>

        {/* Momentum */}
        <div className="mt-4 text-center">
          <span className="text-xs font-medium">Momentum: </span>
          <span className={`text-xs font-bold ${
            momentum === 'Strong Momentum' ? 'text-green-600' :
            momentum === 'Losing Ground' ? 'text-red-600' :
            momentum === 'Stalled' ? 'text-muted-foreground' : 'text-amber-600'
          }`}>
            {momentum}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
