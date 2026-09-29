import { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { buildPlanPrompt } from '../lib/aiPrompt';
import { parseAiPlan } from '../lib/importParser';
import { CATEGORIES, getCategory } from '../lib/categories';
import { weekdayLabel } from '../lib/date';

const EXAMPLE_PLAN = {
  goals: [
    {
      title: '자격증 시험 합격',
      category: 'study',
      subGoals: [
        { title: '기본 강의 완강', progress: 0 },
        { title: '기출문제 3회독', progress: 0 },
      ],
    },
  ],
  routines: [
    { title: '강의 듣기', category: 'study', days: [1, 2, 3, 4, 5], amount: 30, minAmount: 10, unit: '분', goalTitle: '자격증 시험 합격' },
    { title: '산책', category: 'health', days: [0, 1, 2, 3, 4, 5, 6], amount: 15, minAmount: 5, unit: '분' },
    { title: '책상 위 정리', category: 'home', days: [0, 3], amount: 10, minAmount: 3, unit: '분' },
  ],
};

function routineSchedule(r) {
  const days = r.days.length === 7 ? '매일' : r.days.map(weekdayLabel).join(',');
  const min = r.minAmount != null ? ` (최소 ${r.minAmount}${r.unit})` : '';
  return `${days}${r.time ? ` ${r.time}` : ''} · ${r.amount}${r.unit}${min}`;
}

// mode: 'first' = 가입 직후 첫 계획, 'replan' = 실행 기록을 AI에게 넘겨 계획 조정
export default function Onboarding({ onDone, mode = 'first' }) {
  const { state, importPlan } = useStore();
  const replan = mode === 'replan';
  const prompt = useMemo(() => buildPlanPrompt({ state: replan ? state : null }), [replan, state]);
  const [step, setStep] = useState('prompt'); // prompt | paste | preview
  const [pasted, setPasted] = useState('');
  const [parsed, setParsed] = useState(null);
  const [copied, setCopied] = useState(false);
  const [removeIds, setRemoveIds] = useState(() => new Set());

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function tryParse() {
    setParsed(parseAiPlan(pasted));
    setRemoveIds(new Set());
    setStep('preview');
  }

  function confirmImport(plan) {
    importPlan(plan, { removeRoutineIds: [...removeIds] });
    onDone();
  }

  function toggleRemove(id) {
    setRemoveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const droppedRoutines =
    replan && parsed ? state.routines.filter((r) => !parsed.routines.some((pr) => pr.title === r.title)) : [];
  const isEmptyPlan = parsed && parsed.goals.length === 0 && parsed.routines.length === 0 && parsed.tasks.length === 0;

  const body = (
    <div className="app-main" style={{ paddingBottom: 40 }}>
      <div style={{ textAlign: 'right', marginBottom: -10 }}>
        <button className="link-btn" onClick={onDone}>
          {replan ? '← 돌아가기' : '나중에 할게요 →'}
        </button>
      </div>

      {step === 'prompt' && (
        <>
          {!replan && (
            <div style={{ textAlign: 'center', margin: '20px 0 16px' }}>
              <div style={{ fontSize: 36 }}>👋</div>
              <h1 style={{ margin: '10px 0 4px' }}>반가워요, {state.nickname}님!</h1>
            </div>
          )}
          <div className="topbar" style={{ padding: 0, margin: replan ? '20px 0 10px' : '0 0 10px' }}>
            <h1>{replan ? '실행 기록으로 계획 다시 짜기' : '내 목표, AI랑 같이 정리하기'}</h1>
            <div className="sub">
              {replan
                ? '최근 2주 실행 기록이 프롬프트에 포함돼요. 평소 쓰는 AI에 붙여넣고, AI가 묻는 질문에 답하면서 계획을 조정해보세요.'
                : '평소 쓰는 AI(ChatGPT, Claude 등)에 아래 프롬프트를 붙여넣어 보세요. 신경 쓰이는 목표를 적고 AI의 질문에 답하면, 지금 생활에 맞는 계획을 같이 만들어줘요.'}
            </div>
          </div>
          <div className="card">
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                fontSize: 13,
                lineHeight: 1.5,
                maxHeight: 260,
                overflowY: 'auto',
                background: 'var(--surface-2)',
                padding: 12,
                borderRadius: 10,
                margin: 0,
              }}
            >
              {prompt}
            </pre>
            <div style={{ height: 12 }} />
            <button className="btn block" onClick={copyPrompt}>
              {copied ? '복사됨 ✓' : '프롬프트 복사하기'}
            </button>
          </div>

          {!replan && (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>AI가 목표를 이렇게 나눠요</h3>
              <div className="chip-row">
                {CATEGORIES.map((c) => (
                  <span key={c.id} className="tag" title={c.hint}>
                    {c.emoji} {c.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button className="btn secondary block" onClick={() => setStep('paste')}>
            답변 다 받았어요 → 붙여넣으러 가기
          </button>
          {!replan && (
            <>
              <div style={{ height: 10 }} />
              <button className="btn ghost block" onClick={() => confirmImport(EXAMPLE_PLAN)}>
                귀찮으면 예시로 먼저 시작할게요
              </button>
            </>
          )}
        </>
      )}

      {step === 'paste' && (
        <>
          <div className="topbar" style={{ padding: 0, margin: '20px 0 10px' }}>
            <h1>AI 답변 붙여넣기</h1>
            <div className="sub">AI가 마지막에 준 JSON 코드블록을 통째로 복사해서 붙여넣어주세요.</div>
          </div>
          <div className="card">
            <textarea
              style={{ minHeight: 180 }}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder={'```json\n{ "goals": [...], "routines": [...], "tasks": [...] }\n```'}
              autoFocus
            />
            <div style={{ height: 12 }} />
            <button className="btn block" onClick={tryParse} disabled={!pasted.trim()}>
              확인하기
            </button>
          </div>
          <button className="btn ghost block" onClick={() => setStep('prompt')}>
            ← 프롬프트 다시 보기
          </button>
        </>
      )}

      {step === 'preview' && parsed && (
        <>
          <div className="topbar" style={{ padding: 0, margin: '20px 0 10px' }}>
            <h1>이렇게 만들까요?</h1>
            <div className="sub">
              {replan
                ? '제목이 같은 목표·루틴은 새 내용으로 바뀌고, 지금까지의 기록은 그대로 남아요.'
                : '이상한 부분은 나중에 목표/MY 탭에서 고칠 수 있어요.'}
            </div>
          </div>

          {parsed.errors.length > 0 && (
            <div className="banner" style={{ background: '#fdeceb', color: 'var(--danger)' }}>
              ⚠️ {parsed.errors[0]}
            </div>
          )}

          {parsed.settings.dailyMaxTasks != null && (
            <div className="banner">하루 최대 할 일: {parsed.settings.dailyMaxTasks}개</div>
          )}

          {parsed.goals.length > 0 && (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>🎯 핵심 목표 {parsed.goals.length}개</h3>
              {parsed.goals.map((g, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div className="tag">
                    {getCategory(g.category).emoji} {getCategory(g.category).label}
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>
                    {g.title}
                    {g.deadline && <span className="task-meta"> · ~{g.deadline}</span>}
                  </div>
                  {g.subGoals.map((sg, j) => (
                    <div key={j} className="task-meta">
                      · {sg.title}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {parsed.routines.length > 0 && (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>🔁 반복 루틴 {parsed.routines.length}개</h3>
              {parsed.routines.map((r, i) => (
                <div className="task-row" key={i}>
                  <div className="task-title">
                    {getCategory(r.category).emoji} {r.title}
                    <div className="task-meta">{routineSchedule(r)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {parsed.tasks.length > 0 && (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>📌 일회성 할 일 {parsed.tasks.length}개</h3>
              {parsed.tasks.map((t, i) => (
                <div className="task-row" key={i}>
                  <div className="task-title">
                    {getCategory(t.category).emoji} {t.title}
                    <div className="task-meta">
                      {t.date.slice(5).replace('-', '/')}
                      {t.time && ` ${t.time}`} · {t.required ? '꼭 할 일' : '가능하면'}
                      {t.estMinutes != null && ` · 약 ${t.estMinutes}분`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {droppedRoutines.length > 0 && !isEmptyPlan && (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>새 계획에 없는 기존 루틴</h3>
              <div className="task-meta" style={{ marginBottom: 8 }}>
                정리할 루틴만 골라주세요. 고르지 않으면 그대로 남아요. (정리하면 그 루틴의 기록도 함께 지워져요)
              </div>
              {droppedRoutines.map((r) => (
                <div className="task-row" key={r.id}>
                  <div className="task-title">
                    {getCategory(r.category).emoji} {r.title}
                    <div className="task-meta">{routineSchedule(r)}</div>
                  </div>
                  <button className={'chip' + (removeIds.has(r.id) ? ' active' : '')} onClick={() => toggleRemove(r.id)}>
                    {removeIds.has(r.id) ? '정리함' : '유지'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {isEmptyPlan ? (
            <button className="btn secondary block" onClick={() => setStep('paste')}>
              다시 붙여넣기
            </button>
          ) : (
            <>
              <button className="btn block" onClick={() => confirmImport(parsed)}>
                {replan ? '이 계획으로 바꾸기' : '이대로 시작하기'}
              </button>
              <div style={{ height: 10 }} />
              <button className="btn ghost block" onClick={() => setStep('paste')}>
                다시 붙여넣기
              </button>
            </>
          )}
        </>
      )}
    </div>
  );

  if (replan) return body;
  return (
    <div className="app-shell" style={{ justifyContent: 'center' }}>
      {body}
    </div>
  );
}
