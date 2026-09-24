const pad = (n) => String(n).padStart(2, '0');

export function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today() {
  return toDateStr(new Date());
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

export function weekday(dateStr) {
  return new Date(dateStr + 'T00:00:00').getDay(); // 0=Sun
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
export function weekdayLabel(n) {
  return WEEKDAY_LABELS[n];
}

export function formatKorean(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${weekdayLabel(d.getDay())}요일`;
}

export function last7Days(endDateStr = today()) {
  const days = [];
  for (let i = 6; i >= 0; i--) days.push(addDays(endDateStr, -i));
  return days;
}

export function getMonthMatrix(year, month) {
  // month: 0-11. returns array of weeks, each week array of {dateStr, inMonth}
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const start = new Date(year, month, 1 - startOffset);
  const weeks = [];
  let cursor = new Date(start);
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push({
        dateStr: toDateStr(cursor),
        inMonth: cursor.getMonth() === month,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (cursor.getMonth() !== month && w >= 3) break;
  }
  return weeks;
}
