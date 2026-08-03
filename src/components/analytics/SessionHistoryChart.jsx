import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { lastNDays } from '@/lib/writingStats';
import { PenLine } from 'lucide-react';

/**
 * Simple bar chart of words written per day over the last 30 days.
 * In production this would use recharts BarChart.
 */
export default function SessionHistoryChart({ sessions }) {
  const days = lastNDays(30);
  const sessionMap = Object.fromEntries(sessions.map(s => [s.date, s.words_written || 0]));
  const data = days.map(d => ({ date: d, words: sessionMap[d] || 0 }));
  const maxWords = Math.max(1, ...data.map(d => d.words));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <PenLine className="h-4 w-4 text-primary" /> Session History (30 days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-0.5 h-40">
          {data.map(d => {
            const height = Math.max(1, (d.words / maxWords) * 100);
            return (
              <div
                key={d.date}
                className="flex-1 bg-primary/70 rounded-t hover:bg-primary transition-colors relative group"
                style={{ height: `${height}%` }}
              >
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover border rounded px-2 py-1 text-[9px] whitespace-nowrap z-10">
                  {d.date.slice(5)}: {d.words} words
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground mt-2">
          <span>{days[0]?.slice(5)}</span>
          <span>{days[14]?.slice(5)}</span>
          <span>Today</span>
        </div>
      </CardContent>
    </Card>
  );
}
