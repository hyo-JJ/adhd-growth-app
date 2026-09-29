import { normalizeCategory } from './categories';

function clamp(n, min, max, fallback) {
  const num = Number(n);
  if (n === '' || n == null || Number.isNaN(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function dateOrEmpty(v) {
  const s = str(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

function timeOrEmpty(v) {
  const m = str(v).match(/^(\d{1,2}):(\d{2})$/);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return '';
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}

export function parseAiPlan(rawText) {
  const empty = { goals: [], routines: [], tasks: [], settings: {} };
  let jsonText = rawText.trim();
  const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) jsonText = fenceMatch[1].trim();
  else {
    const first = jsonText.indexOf('{');
    const last = jsonText.lastIndexOf('}');
    if (first !== -1 && last !== -1) jsonText = jsonText.slice(first, last + 1);
  }

  let data;
  try {
    data = JSON.parse(jsonText);
  } catch {
    return { ...empty, errors: ['JSON으로 읽을 수 없어요. AI가 준 답변에서 코드블록 부분만 복사했는지 확인해주세요.'] };
  }

  const goals = Array.isArray(data.goals)
    ? data.goals
        .filter((g) => g && str(g.title))
        .map((g) => ({
          title: str(g.title),
          category: normalizeCategory(g.category),
          deadline: dateOrEmpty(g.deadline),
          subGoals: Array.isArray(g.subGoals)
            ? g.subGoals
                .filter((sg) => sg && str(sg.title))
                .map((sg) => ({ title: str(sg.title), progress: clamp(sg.progress, 0, 100, 0) }))
            : [],
        }))
    : [];

  const routines = Array.isArray(data.routines)
    ? data.routines
        .filter((r) => r && str(r.title))
        .map((r) => {
          const days = Array.isArray(r.days) ? r.days.map(Number).filter((d) => d >= 0 && d <= 6) : [];
          return {
            title: str(r.title),
            category: normalizeCategory(r.category),
            days: days.length ? [...new Set(days)].sort() : [0, 1, 2, 3, 4, 5, 6],
            amount: clamp(r.amount, 0, 100000, 0),
            minAmount: clamp(r.minAmount, 0, 100000, null),
            unit: str(r.unit) || '회',
            time: timeOrEmpty(r.time),
            goalTitle: str(r.goal),
          };
        })
    : [];

  const tasks = Array.isArray(data.tasks)
    ? data.tasks
        .filter((t) => t && str(t.title) && dateOrEmpty(t.date))
        .map((t) => ({
          title: str(t.title),
          category: normalizeCategory(t.category),
          date: dateOrEmpty(t.date),
          time: timeOrEmpty(t.time),
          required: t.required !== false,
          estMinutes: clamp(t.estMinutes, 0, 10000, null),
        }))
    : [];

  const maxTasks = clamp(data.settings?.dailyMaxTasks, 1, 50, null);
  const settings = maxTasks == null ? {} : { dailyMaxTasks: Math.round(maxTasks) };

  const errors = [];
  if (goals.length === 0 && routines.length === 0 && tasks.length === 0) {
    errors.push('목표, 루틴, 할 일을 하나도 찾지 못했어요. AI 답변 형식을 확인해주세요.');
  }

  return { goals, routines, tasks, settings, errors };
}
