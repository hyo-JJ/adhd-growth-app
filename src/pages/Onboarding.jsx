import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { AI_PROMPT } from '../lib/aiPrompt';
import { parseAiPlan } from '../lib/importParser';
import { getCategory } from '../lib/categories';
import { weekdayLabel } from '../lib/date';

const EXAMPLE_PLAN = {
  goals: [
    {
      title: '일본 취업 준비',
      category: 'japanese',
      subGoals: [
        { title: '일본어 N3 취득', progress: 0 },
        { title: '포트폴리오 완성', progress: 0 },
      ],
    },
  ],
  routines: [
    { title: '일본어 공부', category: 'japanese', days: [0, 1, 2, 3, 4, 5, 6], amount: 30, minAmount: 10, unit: '분' },
    { title: '운동', category: 'exercise', days: [0, 1, 2, 3, 4, 5, 6], amount: 500, minAmount: 100, unit: '회' },
    { title: '물 마시기', category: 'selfcare', days: [0, 1, 2, 3, 4, 5, 6], amount: 2, minAmount: 1, unit: 'L' },
  ],
};

export default function Onboarding({ onDone }) {
  const { state, importPlan } = useStore();
  const [step, setStep] = useState('prompt'); // prompt | paste | preview
  const [pasted, setPasted] = useState('');
  const [parsed, setParsed] = useState(null);
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function tryParse() {
    const result = parseAiPlan(pasted);
    setParsed(result);
    setStep('preview');
  }

  function confirmImport(plan) {
    importPlan(plan);
    onDone();
  }

  return (
    <div className="app-shell" style={{ justifyContent: 'center' }}>
      <div className="app-main" style={{ paddingBottom: 40 }}>
        <div style={{ textAlign: 'right', marginBottom: -10 }}>
          <button className="link-btn" onClick={onDone}>
            나중에 할게요 →
          </button>
        </div>
        {step === 'prompt' && (
          <>
            <div style={{ textAlign: 'center', margin: '20px 0 16px' }}>
              <div style={{ fontSize: 36 }}>👋</div>
              <h1 style={{ margin: '10px 0 4px' }}>반가워요, {state.nickname}님!</h1>
            </div>
            <div className="topbar" style={{ padding: 0, marginBottom: 10 }}>
              <h1>내 목표, AI랑 같이 정리하기</h1>
              <div className="sub">평소에 자주 쓰는 AI(챗지피티, 클로드 등)에게 아래 프롬프트를 붙여넣고 몇 가지 질문에 답해보세요.</div>
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
                {AI_PROMPT}
              </pre>
              <div style={{ height: 12 }} />
              <button className="btn block" onClick={copyPrompt}>
                {copied ? '복사됨 ✓' : '프롬프트 복사하기'}
              </button>
            </div>
            <button className="btn secondary block" onClick={() => setStep('paste')}>
              답변 다 받았어요 → 붙여넣으러 가기
            </button>
            <div style={{ height: 10 }} />
            <button className="btn ghost block" onClick={() => confirmImport(EXAMPLE_PLAN)}>
              귀찮으면 예시로 먼저 시작할게요
            </button>
          </>
        )}

        {step === 'paste' && (
          <>
            <div className="topbar" style={{ padding: 0, marginBottom: 10 }}>
              <h1>AI 답변 붙여넣기</h1>
              <div className="sub">AI가 마지막에 준 JSON 코드블록을 통째로 복사해서 붙여넣어주세요.</div>
            </div>
            <div className="card">
              <textarea
                style={{ minHeight: 180 }}
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder={'```json\n{ "goals": [...], "routines": [...] }\n```'}
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
            <div className="topbar" style={{ padding: 0, marginBottom: 10 }}>
              <h1>이렇게 만들까요?</h1>
              <div className="sub">확인하고 이상한 부분 있으면 나중에 목표/MY 탭에서 고칠 수 있어요.</div>
            </div>

            {parsed.errors.length > 0 && (
              <div className="banner" style={{ background: '#fdeceb', color: 'var(--danger)' }}>
                ⚠️ {parsed.errors[0]}
              </div>
            )}

            {parsed.goals.length > 0 && (
              <div className="card">
                <h3 style={{ marginTop: 0 }}>🎯 목표 {parsed.goals.length}개</h3>
                {parsed.goals.map((g, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div className="tag">{getCategory(g.category).emoji} {getCategory(g.category).label}</div>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>{g.title}</div>
                    {g.subGoals.map((sg, j) => (
                      <div key={j} className="task-meta">· {sg.title}</div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {parsed.routines.length > 0 && (
              <div className="card">
                <h3 style={{ marginTop: 0 }}>🔁 루틴 {parsed.routines.length}개</h3>
                {parsed.routines.map((r, i) => (
                  <div className="task-row" key={i}>
                    <div className="task-title">
                      {getCategory(r.category).emoji} {r.title}
                      <div className="task-meta">
                        {r.days.length === 7 ? '매일' : r.days.map(weekdayLabel).join(',')} · {r.amount}{r.unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {parsed.goals.length === 0 && parsed.routines.length === 0 ? (
              <button className="btn secondary block" onClick={() => setStep('paste')}>
                다시 붙여넣기
              </button>
            ) : (
              <>
                <button className="btn block" onClick={() => confirmImport(parsed)}>
                  이대로 시작하기
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
    </div>
  );
}
