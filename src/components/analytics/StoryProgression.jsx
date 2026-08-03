import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';

/**
 * Manuscript progress vs target visualization.
 */
export default function StoryProgression({ project, scenes }) {
  const totalWords = scenes.reduce((sum, s) => sum + (s.word_count || 0), 0);
  const target = project?.target_word_count || 80000;
  const progress = Math.min(100, Math.round((totalWords / target) * 100));

  // Milestones
  const milestones = [
    { label: 'First Draft Start', pct: 0 },
    { label: '25%', pct: 25 },
    { label: 'Midpoint', pct: 50 },
    { label: '75%', pct: 75 },
    { label: 'Complete', pct: 100 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Story Progression
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span>{totalWords.toLocaleString()} words written</span>
            <span>{target.toLocaleString()} target</span>
          </div>
          <div className="relative">
            <Progress value={progress} className="h-4" />
            {/* Milestone markers */}
            <div className="absolute inset-0 flex">
              {milestones.slice(1, -1).map(m => (
                <div
                  key={m.pct}
                  className="absolute top-0 bottom-0 w-px bg-foreground/20"
                  style={{ left: `${m.pct}%` }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
            {milestones.map(m => (
              <span key={m.pct} className={progress >= m.pct ? 'text-primary font-medium' : ''}>
                {m.label}
              </span>
            ))}
          </div>
        </div>

        {/* Scene breakdown */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-muted rounded-md p-2">
            <p className="text-lg font-bold">{scenes.filter(s => s.status === 'draft').length}</p>
            <p className="text-[10px] text-muted-foreground">Drafts</p>
          </div>
          <div className="bg-muted rounded-md p-2">
            <p className="text-lg font-bold">{scenes.filter(s => s.status === 'revised').length}</p>
            <p className="text-[10px] text-muted-foreground">Revised</p>
          </div>
          <div className="bg-muted rounded-md p-2">
            <p className="text-lg font-bold">{scenes.filter(s => s.status === 'final').length}</p>
            <p className="text-[10px] text-muted-foreground">Final</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
