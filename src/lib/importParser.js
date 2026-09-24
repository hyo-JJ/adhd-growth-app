import { CATEGORY_IDS } from './aiPrompt';

function safeCategory(c) {
  return CATEGORY_IDS.includes(c) ? c : 'etc';
}

function clamp(n, min, max, fallback) {
  const num = Number(n);
  if (Number.isNaN(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

export function parseAiPlan(rawText) {
  const errors = [];
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
    return { goals: [], routines: [], errors: ['JSON으로 읽을 수 없어요. AI가 준 답변에서 코드블록 부분만 복사했는지 확인해주세요.'] };
  }

  const goals = Array.isArray(data.goals)
    ? data.goals
        .filter((g) => g && typeof g.title === 'string' && g.title.trim())
        .map((g) => ({
          title: g.title.trim(),
          category: safeCategory(g.category),
          deadline: typeof g.deadline === 'string' ? g.deadline : '',
          subGoals: Array.isArray(g.subGoals)
            ? g.subGoals
                .filter((sg) => sg && typeof sg.title === 'string' && sg.title.trim())
                .map((sg) => ({ title: sg.title.trim(), progress: clamp(sg.progress, 0, 100, 0) }))
            : [],
        }))
    : [];

  const routines = Array.isArray(data.routines)
    ? data.routines
        .filter((r) => r && typeof r.title === 'string' && r.title.trim())
        .map((r) => ({
          title: r.title.trim(),
          category: safeCategory(r.category),
          days: Array.isArray(r.days) ? r.days.map(Number).filter((d) => d >= 0 && d <= 6) : [0, 1, 2, 3, 4, 5, 6],
          amount: clamp(r.amount, 0, 100000, 0),
          minAmount: r.minAmount == null || r.minAmount === '' ? null : clamp(r.minAmount, 0, 100000, null),
          unit: typeof r.unit === 'string' && r.unit.trim() ? r.unit.trim() : '회',
        }))
    : [];

  if (goals.length === 0 && routines.length === 0) {
    errors.push('목표나 루틴을 하나도 찾지 못했어요. AI 답변 형식을 확인해주세요.');
  }

  return { goals, routines, errors };
}
