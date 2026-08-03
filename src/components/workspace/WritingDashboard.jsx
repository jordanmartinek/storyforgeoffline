import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  todayStr, lastNDays, computeStreaks, sumWordsInRange,
  dailyAvg, projectProjection, motivationalMessage, addDays, daysThisMonth,
} from '@/lib/writingStats';
import { Flame, Target, TrendingUp, Clock, Calendar } from 'lucide-react';

export default function WritingDashboard({
  project,
  sessions,
  liveWords,
  liveSeconds,
}) {
  const today = todayStr();
  const todaySession = sessions.find(s => s.date === today);
  const wordsToday = (todaySession?.words_written || 0) + (liveWords || 0);
  const secondsToday = (todaySession?.duration_seconds || 0) + (liveSeconds || 0);
  const wpmToday = secondsToday > 60 ? Math.round(wordsToday / (secondsToday / 60)) : 0;

  const streaks = useMemo(() => computeStreaks(sessions), [sessions]);
  const projection = useMemo(() => projectProjection(project, sessions), [project, sessions]);

  // Goal progress
  const dailyGoal = project.daily_goal || 1000;
  const weeklyGoal = project.weekly_goal || 5000;
  const monthlyGoal = project.monthly_goal || 20000;

  const weekStart = addDays(today, -new Date().getDay());
  const monthStart = today.slice(0, 8) + '01';
  const wordsThisWeek = sumWordsInRange(sessions, weekStart, today) + (liveWords || 0);
  const wordsThisMonth = sumWordsInRange(sessions, monthStart, today) + (liveWords || 0);

  const manuscriptProgress = project.target_word_count
    ? Math.min(100, Math.round(((project.word_count || 0) / project.target_word_count) * 100))
    : 0;

  // Last 14 days for mini chart
  const last14 = lastNDays(14);
  const sessionMap = Object.fromEntries(sessions.map(s => [s.date, s.words_written || 0]));
  const maxWords = Math.max(1, ...last14.map(d => sessionMap[d] || 0));

  const message = motivationalMessage(streaks.current, manuscriptProgress);

  return (
    <div className="w-80 border-l bg-card overflow-y-auto scrollbar-thin p-4 space-y-4">
      {/* Motivational message */}
      <p className="text-sm text-muted-foreground italic text-center">{message}</p>

      {/* Live Session */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Today's Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-2xl font-bold">{wordsToday.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Words</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Math.floor(secondsToday / 60)}m
              </p>
              <p className="text-[10px] text-muted-foreground">Time</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{wpmToday}</p>
              <p className="text-[10px] text-muted-foreground">WPM</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <GoalBar label="Daily" current={wordsToday} target={dailyGoal} />
          <GoalBar label="Weekly" current={wordsThisWeek} target={weeklyGoal} />
          <GoalBar label="Monthly" current={wordsThisMonth} target={monthlyGoal} />
          <GoalBar label="Manuscript" current={project.word_count || 0} target={project.target_word_count || 80000} />
        </CardContent>
      </Card>

      {/* Projection */}
      {project.deadline && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Projection
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Needed/day</span>
              <span className="font-medium">{projection.wordsPerDay.toLocaleString()} words</span>
            </div>
            {projection.estCompletion && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. finish</span>
                <span className="font-medium">{projection.estCompletion}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={`font-medium capitalize ${
                projection.status === 'ahead' ? 'text-green-600' :
                projection.status === 'behind' ? 'text-red-600' : 'text-amber-600'
              }`}>
                {projection.status.replace('_', ' ')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Streaks */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" /> Streaks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-orange-500">{streaks.current}</p>
              <p className="text-[10px] text-muted-foreground">Current</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{streaks.longest}</p>
              <p className="text-[10px] text-muted-foreground">Longest</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 14-day mini bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Last 14 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-0.5 h-16">
            {last14.map(day => {
              const w = sessionMap[day] || 0;
              const h = Math.max(2, (w / maxWords) * 100);
              return (
                <div
                  key={day}
                  className="flex-1 bg-primary/60 rounded-t hover:bg-primary transition-colors"
                  style={{ height: `${h}%` }}
                  title={`${day}: ${w} words`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
            <span>{last14[0]?.slice(5)}</span>
            <span>Today</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GoalBar({ label, current, target }) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{current.toLocaleString()} / {target.toLocaleString()}</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}
