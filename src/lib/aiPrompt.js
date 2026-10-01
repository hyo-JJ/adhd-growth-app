import { CATEGORIES } from './categories';
import { today, addDays, weekday, weekdayLabel } from './date';
import { dayStatus } from './stats';

const COACH_PROMPT = `너는 ADHD 사용자를 위한 목표 관리 및 실행 계획 코치다.

사용자의 목표를 대신 결정하거나 사용자의 특성을 추측하지 않는다.
사용자와 대화하면서 필요한 정보를 수집하고,
현재 생활에서 실제로 실행할 수 있는 계획을 함께 만든다.

사용자는 ADHD가 있을 수도 있고 없을 수도 있으며,
ADHD 사용자라고 해서 집중력, 의지, 생활패턴 등을 동일하게 가정하지 않는다.

[1단계: 목표 수집]
사용자에게 현재 이루고 싶거나 신경 쓰이는 목표를
5~10개 정도 자유롭게 입력하도록 요청한다.

[2단계: 정보 확인]
입력된 목표를 분석한다.
이미 충분히 알고 있는 정보는 다시 묻지 않는다.
계획을 만드는 데 필요한 정보가 부족한 경우에만
한 번에 하나씩 짧은 질문을 한다.

[3단계: 목표 분석]
각 목표의 중요도, 현재 상태, 동기, 마감일,
필요 시간, 난이도, 다른 목표와의 충돌,
사용자가 실제로 실행할 수 있는 정도를 파악한다.

[4단계: 핵심 목표 선정]
모든 목표를 동시에 진행하도록 만들지 않는다.
현재 상황에서 현실적으로 집중할 수 있는 핵심 목표를
1~3개 정도 선정한다.

단, AI가 독단적으로 결정하지 않는다.
목표 간 충돌이나 부담이 예상되면 사용자에게 확인한다.

[5단계: 목표 세분화]
핵심 목표를 실행 가능한 세부 목표와 행동으로 나눈다.
필요한 경우 사용자에게 질문하면서 함께 세분화한다.

[6단계: 일정 분석]
사용자의 실제 생활시간, 고정 일정, 선호 시간,
집중이 잘 되는 시간, 사용할 수 있는 시간을 확인한다.
확인된 정보를 바탕으로 가장 현실적인 시간대에 배치한다.

[7단계: ADHD 친화적 계획]
한 번에 처리해야 하는 일이 지나치게 많아지지 않도록 한다.
오늘 반드시 해야 하는 일과 가능하면 하는 일을 구분한다.
사용자가 선호하는 하루 최대 할 일 수가 있다면 이를 따른다.

[8단계: 목표량 설정]
각 반복 루틴에 정상 목표량과 최소 목표량을 설정한다.
사용자가 최소 목표를 인정하지 않는다고 말하면 minAmount는 null로 한다.
AI가 사용자의 목표량을 임의로 낮추지 않는다.

[9단계: 마감일 역산]
마감일이 있는 목표는 마감일에서 역산하여
중간 목표, 주간 목표, 오늘 할 일로 나눈다.
현실적으로 불가능한 계획이 나오면 사용자에게 추가 질문한다.

[10단계: 반복 루틴과 일회성 할 일]
반복되는 행동은 routines에 저장한다.
특정 날짜에만 해야 하는 일은 tasks에 저장한다.

[11단계: 계획 피드백]
이전 실행 기록이 제공된 경우 실제 완료량과 계획량을 비교한다.
반복적으로 실행되지 않는 경우 원인을 추측하지 말고
필요한 질문을 통해 계획을 조정한다.

[12단계: JSON 출력]
모든 질문이 끝나고 사용자의 계획이 확정되면
앱에서 사용할 수 있는 JSON만 출력한다.`;

function categoryGuide() {
  return CATEGORIES.map((c) => `- ${c.id}: ${c.label} (${c.hint})`).join('\n');
}

function formatSpec(todayStr) {
  return `[JSON 출력 형식]
오늘 날짜는 ${todayStr} (${weekdayLabel(weekday(todayStr))}요일)이다. 날짜 계산은 이 날짜를 기준으로 한다.
JSON은 \`\`\`json 코드블록 하나로만 출력하고, 코드블록 앞뒤에 다른 설명을 붙이지 않는다.

필드 규칙:
- category는 반드시 아래 id 중 하나를 쓴다. 애매하면 etc.
${categoryGuide()}
- goals: 핵심 목표(1~3개)만 넣는다. deadline은 "YYYY-MM-DD" 또는 "". 마감일 역산으로 나온 중간 목표는 subGoals에 넣는다.
- routines: 반복 행동. days는 0=일요일 ~ 6=토요일 숫자 배열(매일이면 [0,1,2,3,4,5,6]).
  amount/minAmount는 숫자만, 단위는 unit에. 최소 목표를 인정하지 않으면 minAmount는 null.
  time은 배치한 시간대 "HH:MM"(정하지 않았으면 ""). goal은 연결된 goals의 title과 똑같이 적거나 "".
- tasks: 특정 날짜에만 하는 일회성 할 일. date는 "YYYY-MM-DD", time은 "HH:MM" 또는 "".
  required는 그날 반드시 해야 하면 true, 가능하면 하는 일이면 false. estMinutes는 예상 소요 분(모르면 null).
- settings.dailyMaxTasks: 사용자가 말한 하루 최대 할 일 수(말하지 않았으면 null).

\`\`\`json
{
  "settings": { "dailyMaxTasks": 4 },
  "goals": [
    {
      "title": "예: 자격증 시험 합격",
      "category": "study",
      "deadline": "${addDays(todayStr, 60)}",
      "subGoals": [
        { "title": "기본 강의 완강", "progress": 0 },
        { "title": "기출문제 3회독", "progress": 0 }
      ]
    }
  ],
  "routines": [
    { "title": "강의 듣기", "category": "study", "days": [1,2,3,4,5], "amount": 40, "minAmount": 10, "unit": "분", "time": "20:00", "goal": "예: 자격증 시험 합격" },
    { "title": "산책", "category": "health", "days": [0,6], "amount": 20, "minAmount": null, "unit": "분", "time": "", "goal": "" }
  ],
  "tasks": [
    { "title": "시험 접수하기", "category": "admin", "date": "${addDays(todayStr, 1)}", "time": "", "required": true, "estMinutes": 15 }
  ]
}
\`\`\``;
}

// 최근 실행 기록(계획량 vs 실제 완료량)을 11단계 피드백용 텍스트로 만든다.
export function buildHistorySummary(state, days = 14, endDate = today()) {
  const lines = [];
  for (const r of state.routines) {
    let planned = 0;
    let done = 0;
    let doneAmount = 0;
    for (let i = 0; i < days; i++) {
      const d = addDays(endDate, -i);
      if (!r.days.includes(weekday(d))) continue;
      planned += 1;
      const amt = state.completions[r.id]?.[d];
      if (amt != null) {
        done += 1;
        doneAmount += amt;
      }
    }
    if (planned === 0) continue;
    const avg = done ? Math.round((doneAmount / done) * 10) / 10 : 0;
    const min = r.minAmount != null ? `, 최소 ${r.minAmount}${r.unit}` : '';
    lines.push(`- [루틴] ${r.title}: 계획 ${planned}회 중 ${done}회 실행 (목표 ${r.amount}${r.unit}${min}, 실행한 날 평균 ${avg}${r.unit})`);
  }
  const start = addDays(endDate, -(days - 1));
  const tasks = state.customTasks.filter((t) => t.date >= start && t.date <= endDate);
  if (tasks.length) {
    const doneTasks = tasks.filter((t) => t.done).length;
    lines.push(`- [일회성 할 일] ${tasks.length}개 중 ${doneTasks}개 완료`);
    for (const t of tasks.filter((t) => !t.done)) lines.push(`  · 미완료: ${t.title} (${t.date})`);
  }
  const goals = state.goals.map(
    (g) => `- [목표] ${g.title}${g.deadline ? ` (마감 ${g.deadline})` : ''}: ${g.subGoals.map((sg) => `${sg.title} ${sg.progress}%`).join(', ') || '세부 목표 없음'}`
  );
  return { start, end: endDate, routineLines: lines, goalLines: goals };
}

export function buildPlanPrompt({ state = null } = {}) {
  const t = today();
  const parts = [COACH_PROMPT, formatSpec(t)];
  if (state && (state.routines.length || state.goals.length)) {
    const h = buildHistorySummary(state, 14, t);
    parts.push(`[이전 실행 기록: ${h.start} ~ ${h.end}]
현재 계획과 실제 실행 기록이다. 11단계에 따라 비교하고, 계획을 조정할 때 필요한 것만 질문한다.
${h.goalLines.join('\n')}
${h.routineLines.join('\n') || '- 기록된 루틴 없음'}`);
    parts.push('먼저 위 기록을 짧게 요약해서 보여주고, 계획을 어떻게 바꾸고 싶은지 한 가지만 질문하면서 시작해줘.');
  } else {
    parts.push('이제 1단계부터 시작해줘.');
  }
  return parts.join('\n\n');
}

const REVIEW_PROMPT = `너는 ADHD 사용자를 위한 실행 점검 코치다.
아래는 사용자가 성장관리 앱에 쌓은 실제 실행 기록이다.
이 기록을 보고 사용자가 잘하고 있는 점과 바꾸면 좋을 점을 점검해준다.

[점검 원칙]
- 기록에 있는 사실만 근거로 말한다. 사용자의 성격, 의지, 생활을 추측하지 않는다.
- 못 한 것을 탓하지 않는다. 잘 되고 있는 것부터 구체적인 숫자와 함께 짚어준다.
- 계획량과 실제 실행량의 차이, 자주 빠지는 요일이나 루틴, 하루 할 일 양이 적절한지를 본다.
- 원인이 기록만으로 분명하지 않으면 단정하지 말고 짧게 질문한다.
- 바꿀 점은 지금 바로 해볼 수 있는 것으로 최대 3개까지만 제안한다.
- 목표량을 임의로 낮추라고 하지 않는다. 낮추는 것이 좋아 보이면 이유와 함께 선택지로 제시한다.

[답변 형식]
1. 한 줄 총평
2. 잘하고 있는 점 (2~3개)
3. 바꿔보면 좋을 점 (최대 3개, 각각 "왜"와 "이렇게 해보기"를 함께)
4. 확인하고 싶은 질문 (필요할 때만, 최대 2개)

JSON이나 코드블록은 출력하지 않는다. 짧고 다정하게, 한국어로 답한다.`;

// 실행 기록을 AI에게 보여주고 "잘하고 있는지 / 뭘 바꿀지" 점검받는 프롬프트
export function buildReviewPrompt(state, { days = 14, includeJournal = true, concern = '' } = {}) {
  const t = today();
  const h = buildHistorySummary(state, days, t);

  const dayLines = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(t, -i);
    const s = dayStatus(state, d);
    if (s.totalCount === 0) continue;
    const busy = state.minimalMode?.[d] ? ' [바쁜 날: 최소 행동 모드]' : '';
    dayLines.push(`- ${d} (${weekdayLabel(weekday(d))}): ${s.totalCount}개 중 ${s.doneCount}개 완료${busy}`);
    for (const item of s.items) {
      const amount = item.kind === 'routine' ? ` ${item.done ? item.amountDone : 0}/${item.target}${item.unit}` : '';
      const optional = item.required ? '' : ' (가능하면)';
      dayLines.push(`  ${item.done ? '✓ 함' : '✗ 못 함'}: ${item.title}${amount}${optional}`);
    }
  }

  const parts = [
    REVIEW_PROMPT,
    `[기간] ${h.start} ~ ${h.end} (오늘 ${t}, ${weekdayLabel(weekday(t))}요일)`,
    `[설정] 하루 최대 할 일 수: ${state.dailyMaxTasks ?? '정하지 않음'}`,
    `[목표]\n${h.goalLines.join('\n') || '- 등록된 목표 없음'}`,
    `[루틴과 할 일 실행 기록]\n${h.routineLines.join('\n') || '- 기록 없음'}`,
    `[날짜별로 한 것과 못 한 것]\n${dayLines.join('\n') || '- 기록 없음'}`,
  ];

  if (includeJournal) {
    const journal = Object.entries(state.journals)
      .filter(([d]) => d >= h.start && d <= h.end)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([d, text]) => `- ${d}: ${text}`);
    if (journal.length) parts.push(`[한 줄 일기]\n${journal.join('\n')}`);
  }

  if (concern.trim()) parts.push(`[사용자가 특히 궁금한 점]\n${concern.trim()}`);
  parts.push('위 기록을 바탕으로 답변 형식에 맞춰 점검해줘.');
  return parts.join('\n\n');
}
