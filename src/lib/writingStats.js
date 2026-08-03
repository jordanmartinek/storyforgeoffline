/**
 * Writing statistics helpers: dates, streaks, projections, milestones.
 */

/** Today as YYYY-MM-DD */
export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** Add days to a date string */
export function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Difference in days between two date strings */
export function dayDiff(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

/** Last N days as an array of YYYY-MM-DD strings */
export function lastNDays(n) {
  const today = todayStr();
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(addDays(today, -i));
  }
  return days;
}

/**
 * Compute writing streaks from sessions array.
 * @param {Array} sessions - [{date, words_written}]
 * @returns {{ current: number, longest: number }}
 */
export function computeStreaks(sessions) {
  if (!sessions || sessions.length === 0) return { current: 0, longest: 0 };

  const writtenDays = new Set(
    sessions.filter(s => s.words_written > 0).map(s => s.date)
  );

  let current = 0;
  let longest = 0;
  let streak = 0;
  const today = todayStr();

  // Check backwards from today
  for (let i = 0; i < 365; i++) {
    const day = addDays(today, -i);
    if (writtenDays.has(day)) {
      streak++;
      if (i === 0 || streak > 0) current = Math.max(current, streak);
    } else {
      if (i === 0) {
        // Today hasn't been written yet, check from yesterday
        continue;
      }
      longest = Math.max(longest, streak);
      if (current === 0) current = 0;
      streak = 0;
      if (current > 0) break; // only need current streak
    }
  }
  longest = Math.max(longest, streak);
  if (current === 0) current = streak;

  // Simpler approach
  let cur = 0;
  for (let i = 0; i <= 365; i++) {
    const day = addDays(today, -i);
    if (writtenDays.has(day)) {
      cur++;
    } else if (i > 0) {
      break;
    }
  }

  let lon = 0;
  let run = 0;
  const sortedDays = [...writtenDays].sort();
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0 || dayDiff(sortedDays[i - 1], sortedDays[i]) === 1) {
      run++;
    } else {
      run = 1;
    }
    lon = Math.max(lon, run);
  }

  return { current: cur, longest: lon };
}

/** Days in current month */
export function daysThisMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

/** Sum words_written in a date range (inclusive) */
export function sumWordsInRange(sessions, startDate, endDate) {
  return sessions
    .filter(s => s.date >= startDate && s.date <= endDate)
    .reduce((sum, s) => sum + (s.words_written || 0), 0);
}

/** Daily average over sessions */
export function dailyAvg(sessions) {
  if (!sessions || sessions.length === 0) return 0;
  const total = sessions.reduce((sum, s) => sum + (s.words_written || 0), 0);
  return Math.round(total / sessions.length);
}

/**
 * Project projection based on deadline and current progress.
 * @returns {{ wordsPerDay: number, estCompletion: string, status: 'ahead'|'behind'|'on_track' }}
 */
export function projectProjection(project, sessions) {
  const remaining = Math.max(0, (project.target_word_count || 80000) - (project.word_count || 0));
  const avg = dailyAvg(sessions);

  let estCompletion = null;
  if (avg > 0) {
    const daysNeeded = Math.ceil(remaining / avg);
    estCompletion = addDays(todayStr(), daysNeeded);
  }

  let wordsPerDay = 0;
  let status = 'on_track';

  if (project.deadline) {
    const daysLeft = dayDiff(todayStr(), project.deadline);
    if (daysLeft > 0) {
      wordsPerDay = Math.ceil(remaining / daysLeft);
      if (avg >= wordsPerDay) status = 'ahead';
      else if (avg < wordsPerDay * 0.7) status = 'behind';
    } else {
      status = remaining > 0 ? 'behind' : 'ahead';
    }
  }

  return { wordsPerDay, estCompletion, status };
}

/** Next milestone */
export function nextMilestone(wordCount) {
  const milestones = [1000, 5000, 10000, 25000, 50000, 75000, 100000, 150000];
  return milestones.find(m => m > wordCount) || wordCount + 10000;
}

/** Motivational message based on streak and progress */
export function motivationalMessage(streak, progress) {
  if (streak >= 30) return "Incredible dedication! You're on fire!";
  if (streak >= 14) return "Two weeks strong! Keep the momentum!";
  if (streak >= 7) return "A full week! You're building a habit!";
  if (streak >= 3) return "Great streak! Don't break the chain!";
  if (progress >= 90) return "Almost there! The finish line is in sight!";
  if (progress >= 50) return "Halfway done! You've got this!";
  if (progress >= 25) return "Quarter of the way! Keep going!";
  return "Every word counts. Start writing!";
}
