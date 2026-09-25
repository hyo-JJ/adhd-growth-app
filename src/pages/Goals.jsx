import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { CATEGORIES } from '../lib/categories';
import { today } from '../lib/date';
import { routinesForDate, goalWeeklyProgress } from '../lib/stats';
import Sheet from '../components/Sheet';
import Mascot from '../components/Mascot';
import CategoryIcon from '../components/CategoryIcon';
import FocusMode from '../components/FocusMode';
import RoutineSheet from '../components/RoutineEditor';

const LARGE_THRESHOLD = 40; // minutes

export default function Goals() {
  const {
    state,
    addGoal,
    deleteGoal,
    addSubGoal,
    updateSubGoal,
    deleteSubGoal,
    addRoutine,
    updateRoutine,
    setCompletion,
    clearCompletion,
    addCustomTask,
    addIdea,
  } = useStore();
  const t = today();

  const [goalSheet, setGoalSheet] = useState(false);
  const [subSheetFor, setSubSheetFor] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('etc');
  const [deadline, setDeadline] = useState('');
  const [subTitle, setSubTitle] = useState('');

  const [expanded, setExpanded] = useState({}); // goalId -> subGoalId
  const [actionSheetFor, setActionSheetFor] = useState(null); // {goalId, subGoalId}
  const [splitFor, setSplitFor] = useState(null); // routine
  const [stepsText, setStepsText] = useState('');
  const [dismissed, setDismissed] = useState(() => new Set());
  const [focusItem, setFocusItem] = useState(null);

  function submitGoal() {
    if (!title.trim()) return;
    addGoal({ title: title.trim(), category, deadline });
    setTitle('');
    setCategory('etc');
    setDeadline('');
    setGoalSheet(false);
  }

  function submitSub() {
    if (!subTitle.trim() || !subSheetFor) return;
    addSubGoal(subSheetFor, { title: subTitle.trim() });
    setSubTitle('');
    setSubSheetFor(null);
  }

  function subGoalProgress(sg) {
    return sg.done ? 100 : sg.progress;
  }

  function actionsFor(subGoalId) {
    return routinesForDate(state.routines, t)
      .filter((r) => r.subGoalId === subGoalId)
      .map((r) => ({
        ...r,
        done: state.completions[r.id]?.[t] != null,
      }));
  }

  function toggleAction(action) {
    if (action.done) clearCompletion(action.id, t);
    else setCompletion(action.id, t, action.amount);
  }

  function openSplit(action) {
    setSplitFor(action);
    setStepsText((action.steps || []).join('\n'));
  }

  function saveSplit() {
    const steps = stepsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    updateRoutine(splitFor.id, { steps });
    setSplitFor(null);
  }

  function sendFirstStep(action) {
    addCustomTask({ title: action.steps[0], category: action.category, date: t });
  }

  return (
    <>
      <div className="topbar">
        <h1>목표</h1>
        <div className="sub">큰 목표를 작은 행동으로 나눠보세요</div>
      </div>
      <div className="app-main" style={{ paddingTop: 4 }}>
        {state.goals.length === 0 && (
          <div className="empty-state">아직 목표가 없어요. 첫 목표를 추가해보세요.</div>
        )}

        {state.goals.map((goal) => {
          const wp = goalWeeklyProgress(state, goal.id);
          const barPct = wp.total === 0 ? 0 : Math.round((wp.done / wp.total) * 100);
          const openSubId = expanded[goal.id] !== undefined ? expanded[goal.id] : goal.subGoals[0]?.id;

          return (
            <div key={goal.id}>
              <div className="card" style={{ background: 'var(--accent-soft)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Mascot mood="default" size={40} />
                    <div>
                      <div className="task-meta" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                        큰 목표 {goal.deadline ? `· ${goal.deadline}까지` : ''}
                      </div>
                      <h3 style={{ margin: '2px 0 0' }}>{goal.title}</h3>
                    </div>
                  </div>
                  <button className="icon-btn" onClick={() => deleteGoal(goal.id)} aria-label="목표 삭제">
                    🗑
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '16px 0 6px' }}>
                  <span className="task-meta">이번 주 행동</span>
                  <span className="task-meta">{wp.done}/{wp.total} 완료</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${barPct}%` }} />
                </div>
              </div>

              {goal.subGoals.map((sg) => {
                const isOpen = sg.id === openSubId;
                const actions = actionsFor(sg.id);
                const doneToday = actions.filter((a) => a.done).length;
                return (
                  <div className="card" key={sg.id}>
                    <div
                      className="accordion-header"
                      onClick={() => setExpanded((e) => ({ ...e, [goal.id]: isOpen ? null : sg.id }))}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{sg.title}</div>
                        <div className="task-meta">
                          행동 {actions.length}개 {actions.length > 0 && `· 오늘 ${doneToday}개 완료`}
                        </div>
                      </div>
                      <span className={'chevron' + (isOpen ? ' open' : '')}>›</span>
                    </div>

                    {isOpen && (
                      <div style={{ marginTop: 14 }}>
                        {actions.map((action) => {
                          const isLarge =
                            action.unit === '분' &&
                            action.amount >= LARGE_THRESHOLD &&
                            !action.done &&
                            !(action.steps && action.steps.length) &&
                            !dismissed.has(action.id);

                          if (isLarge) {
                            return (
                              <div className="split-card" key={action.id}>
                                <div className="split-title">{action.title}</div>
                                <div className="split-meta">
                                  {action.amount}{action.unit} · 시작하기엔 조금 커 보여요
                                </div>
                                <div className="split-actions">
                                  <button
                                    className="btn secondary"
                                    onClick={() => setDismissed((d) => new Set(d).add(action.id))}
                                  >
                                    이대로 쓸게요
                                  </button>
                                  <button className="btn" onClick={() => openSplit(action)}>
                                    ✂ 더 작게 쪼개기
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          const hasSteps = action.steps && action.steps.length > 0;
                          const alreadySent =
                            hasSteps && state.customTasks.some((ct) => ct.date === t && ct.title === action.steps[0]);

                          return (
                            <div key={action.id}>
                              <div className="task-row plain">
                                <CategoryIcon id={action.category} size={34} />
                                <div
                                  className="task-title"
                                  style={{ cursor: action.done ? 'default' : 'pointer' }}
                                  onClick={() => !action.done && setFocusItem(action)}
                                >
                                  <span className={action.done ? 'done-text' : ''}>{action.title}</span>
                                  <div className="task-meta">
                                    {action.amount}{action.unit}
                                    {hasSteps && ` · ${action.steps.length}단계로 나눔`}
                                  </div>
                                </div>
                                <button
                                  className={'checkbox' + (action.done ? ' done' : '')}
                                  onClick={() => toggleAction(action)}
                                >
                                  {action.done ? '✓' : ''}
                                </button>
                              </div>
                              {hasSteps && !action.done && !alreadySent && (
                                <button className="btn ghost" onClick={() => sendFirstStep(action)}>
                                  + 첫 조각만 오늘 할 일에 넣기
                                </button>
                              )}
                            </div>
                          );
                        })}

                        <button
                          className="btn ghost"
                          onClick={() => setActionSheetFor({ goalId: goal.id, subGoalId: sg.id, category: goal.category })}
                        >
                          + 오늘의 행동 추가
                        </button>

                        <div className="subgoal-row" style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                          <button
                            className={'checkbox' + (sg.done ? ' done' : '')}
                            style={{ width: 22, height: 22 }}
                            onClick={() => updateSubGoal(goal.id, sg.id, { done: !sg.done, progress: !sg.done ? 100 : sg.progress })}
                          >
                            {sg.done ? '✓' : ''}
                          </button>
                          <span
                            className="name"
                            style={sg.done ? { textDecoration: 'line-through', color: 'var(--text-faint)' } : undefined}
                          >
                            세부 목표 진행률
                          </span>
                          {!sg.done && (
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={sg.progress}
                              onChange={(e) => updateSubGoal(goal.id, sg.id, { progress: Number(e.target.value) })}
                              style={{ width: 70 }}
                            />
                          )}
                          <span className="task-meta" style={{ width: 32, textAlign: 'right' }}>
                            {subGoalProgress(sg)}%
                          </span>
                          <button
                            className="icon-btn"
                            style={{ width: 26, height: 26, fontSize: 12 }}
                            onClick={() => deleteSubGoal(goal.id, sg.id)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <button className="btn ghost" onClick={() => setSubSheetFor(goal.id)}>
                + 세부 목표 추가
              </button>
            </div>
          );
        })}

        <div style={{ height: 6 }} />
        <button className="btn block" onClick={() => setGoalSheet(true)}>
          + 새 목표 만들기
        </button>
      </div>

      <Sheet open={goalSheet} onClose={() => setGoalSheet(false)} title="새 목표">
        <div className="field">
          <label>목표 이름</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 자격증 시험 합격" autoFocus />
        </div>
        <label>분야</label>
        <div className="chip-row">
          {CATEGORIES.map((c) => (
            <button key={c.id} className={'chip' + (category === c.id ? ' active' : '')} onClick={() => setCategory(c.id)}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
        <label>목표일 (선택)</label>
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        <div style={{ height: 16 }} />
        <button className="btn block" onClick={submitGoal}>만들기</button>
      </Sheet>

      <Sheet open={!!subSheetFor} onClose={() => setSubSheetFor(null)} title="세부 목표 추가">
        <div className="field">
          <label>세부 목표</label>
          <input type="text" value={subTitle} onChange={(e) => setSubTitle(e.target.value)} placeholder="예: 인강 완강하기" autoFocus />
        </div>
        <div style={{ height: 16 }} />
        <button className="btn block" onClick={submitSub}>추가하기</button>
      </Sheet>

      <RoutineSheet
        open={!!actionSheetFor}
        onClose={() => setActionSheetFor(null)}
        addRoutine={addRoutine}
        updateRoutine={updateRoutine}
        title="오늘의 행동 추가"
        newDefaults={actionSheetFor ? { category: actionSheetFor.category } : undefined}
        extraFields={actionSheetFor ? { goalId: actionSheetFor.goalId, subGoalId: actionSheetFor.subGoalId } : undefined}
      />

      <Sheet open={!!splitFor} onClose={() => setSplitFor(null)} title="✂ 작게 쪼개기">
        {splitFor && (
          <>
            <div className="task-meta" style={{ marginBottom: 10 }}>
              {splitFor.title} · {splitFor.amount}{splitFor.unit}
            </div>
            <label style={{ marginTop: 0 }}>작은 단계로 나눠주세요</label>
            <textarea
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              placeholder={'한 줄에 하나씩\n예: 예문 3개 소리 내어 읽기\n연습 문제 5개 풀기\n틀린 문제만 다시 보기'}
              autoFocus
            />
            <div style={{ height: 14 }} />
            <button className="btn block" onClick={saveSplit}>
              이렇게 나눌게요
            </button>
          </>
        )}
      </Sheet>

      {focusItem && (
        <FocusMode
          item={focusItem}
          onClose={() => setFocusItem(null)}
          onComplete={() => toggleAction(focusItem)}
          onParkIdea={(text) => addIdea({ title: text, capturedInFocus: true })}
        />
      )}
    </>
  );
}
