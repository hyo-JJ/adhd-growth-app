import { weekday, addDays, today as todayStr } from './date';

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
      steps: r.steps || null,
      time: r.time || '',
      required: true,
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
      time: t.time || '',
      required: t.required ?? true,
      done: t.done,
      carriedFrom: t.carriedFrom,
    }));
  // 반드시 할 일 → 가능하면 할 일, 같은 그룹 안에서는 이른 시간 순(시간 없는 건 뒤로)
  return [...routines, ...custom].sort(
    (a, b) => Number(b.required) - Number(a.required) || (a.time || '99:99').localeCompare(b.time || '99:99')
  );
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

export function weekDates(fromDate = todayStr()) {
  const wd = weekday(fromDate);
  const mondayOffset = wd === 0 ? -6 : 1 - wd;
  const monday = addDays(fromDate, mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function dailyFocusMinutes(state, dates) {
  return dates.map((d) => {
    const routines = routinesForDate(state.routines, d);
    let minutes = 0;
    for (const r of routines) {
      if (r.unit !== '분') continue;
      const amt = state.completions[r.id]?.[d];
      if (amt != null) minutes += amt;
    }
    return { date: d, minutes };
  });
}

export function weeklyCategorySummary(state, dates) {
  const byCategory = {};
  for (const d of dates) {
    const routines = routinesForDate(state.routines, d);
    for (const r of routines) {
      const amt = state.completions[r.id]?.[d];
      if (amt == null) continue;
      const bucket = byCategory[r.category] || { minutes: 0, otherTotal: 0, unit: r.unit, days: new Set() };
      if (r.unit === '분') bucket.minutes += amt;
      else bucket.otherTotal += amt;
      bucket.unit = r.unit;
      bucket.days.add(d);
      byCategory[r.category] = bucket;
    }
  }
  return byCategory;
}

export function goalWeeklyProgress(state, goalId, dates = weekDates()) {
  let done = 0;
  let total = 0;
  for (const d of dates) {
    if (d > todayStr()) continue;
    const routines = routinesForDate(state.routines, d).filter((r) => r.goalId === goalId);
    for (const r of routines) {
      total += 1;
      if (state.completions[r.id]?.[d] != null) done += 1;
    }
  }
  return { done, total };
}

// 기간(날짜 배열) 동안의 완료율. 오늘 이후 날짜와 할 일이 없는 날은 빼고 센다.
export function rangeRate(state, dates) {
  const t = todayStr();
  let done = 0;
  let total = 0;
  for (const d of dates) {
    if (d > t) continue;
    const st = dayStatus(state, d);
    done += st.doneCount;
    total += st.totalCount;
  }
  return { done, total, rate: total === 0 ? null : Math.round((done / total) * 100) };
}

export function categoryRates(state, dates) {
  const t = todayStr();
  const byCat = {};
  for (const d of dates) {
    if (d > t) continue;
    for (const item of dayItems(state, d)) {
      const b = byCat[item.category] || { done: 0, total: 0 };
      b.total += 1;
      if (item.done) b.done += 1;
      byCat[item.category] = b;
    }
  }
  return byCat;
}
