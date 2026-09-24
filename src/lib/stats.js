import { weekday, addDays, today as todayStr, last7Days } from './date';

export function routinesForDate(routines, dateStr) {
  const wd = weekday(dateStr);
  return routines.filter((r) => r.days.includes(wd));
}

export function dayItems(state, dateStr) {
  const routines = routinesForDate(state.routines, dateStr).map((r) => {
    const amountDone = state.completions[r.id]?.[dateStr];
    return {
      kind: 'routine',
      id: r.id,
      title: r.title,
      category: r.category,
      unit: r.unit,
      target: r.amount,
      minTarget: r.minAmount,
      done: amountDone != null,
      amountDone: amountDone || 0,
    };
  });
  const custom = state.customTasks
    .filter((t) => t.date === dateStr)
    .map((t) => ({
      kind: 'custom',
      id: t.id,
      title: t.title,
      category: t.category || 'etc',
      done: t.done,
      carriedFrom: t.carriedFrom,
    }));
  return [...routines, ...custom];
}

export function dayStatus(state, dateStr) {
  const items = dayItems(state, dateStr);
  const doneCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const rate = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);
  return { items, doneCount, totalCount, rate };
}

export function computeStreak(state, fromDate = todayStr()) {
  let streak = 0;
  let cursor = fromDate;
  // if today not complete yet (in progress), don't break streak for today, just start checking from yesterday
  const todayStatus = dayStatus(state, fromDate);
  if (todayStatus.totalCount > 0 && todayStatus.rate === 100) {
    streak += 1;
  }
  cursor = addDays(fromDate, -1);
  for (let i = 0; i < 365; i++) {
    const st = dayStatus(state, cursor);
    if (st.totalCount > 0 && st.rate === 100) {
      streak += 1;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

export function weeklyReport(state, endDate = todayStr()) {
  const days = last7Days(endDate);
  const daily = days.map((d) => {
    const st = dayStatus(state, d);
    return { date: d, rate: st.rate, doneCount: st.doneCount, totalCount: st.totalCount };
  });

  let studyMinutes = 0; // japanese + dev (unit === '분')
  let exerciseCount = 0;
  const byCategory = {};

  for (const d of days) {
    const routines = routinesForDate(state.routines, d);
    for (const r of routines) {
      const amt = state.completions[r.id]?.[d];
      if (amt == null) continue;
      if (r.unit === '분' && (r.category === 'japanese' || r.category === 'dev' || r.category === 'study')) {
        studyMinutes += amt;
      }
      if (r.category === 'exercise') {
        exerciseCount += amt;
      }
      byCategory[r.category] = (byCategory[r.category] || 0) + amt;
    }
  }

  return { daily, studyMinutes, exerciseCount, byCategory };
}
