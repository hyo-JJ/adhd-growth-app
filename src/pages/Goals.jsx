import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { getCategory, CATEGORIES } from '../lib/categories';
import Sheet from '../components/Sheet';

export default function Goals() {
  const { state, addGoal, deleteGoal, addSubGoal, updateSubGoal, deleteSubGoal } = useStore();
  const [goalSheet, setGoalSheet] = useState(false);
  const [subSheetFor, setSubSheetFor] = useState(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('etc');
  const [deadline, setDeadline] = useState('');

  const [subTitle, setSubTitle] = useState('');

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

  function goalProgress(goal) {
    if (!goal.subGoals.length) return 0;
    const sum = goal.subGoals.reduce((a, sg) => a + (sg.done ? 100 : sg.progress), 0);
    return Math.round(sum / goal.subGoals.length);
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
          const cat = getCategory(goal.category);
          const progress = goalProgress(goal);
          return (
            <div className="card goal-card" key={goal.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="tag" style={{ marginBottom: 6, display: 'inline-block' }}>
                    {cat.emoji} {cat.label}
                  </span>
                  <h3 style={{ margin: '4px 0' }}>{goal.title}</h3>
                  {goal.deadline && (
                    <div className="task-meta">목표일 {goal.deadline}</div>
                  )}
                </div>
                <button className="icon-btn" onClick={() => deleteGoal(goal.id)} aria-label="목표 삭제">
                  🗑
                </button>
              </div>

              <div className="progress-track" style={{ marginTop: 10 }}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="task-meta" style={{ marginTop: 6 }}>진행률 {progress}%</div>

              <div className="sub-list">
                {goal.subGoals.map((sg) => (
                  <div className="subgoal-row" key={sg.id}>
                    <button
                      className={'checkbox' + (sg.done ? ' done' : '')}
                      style={{ width: 22, height: 22 }}
                      onClick={() => updateSubGoal(goal.id, sg.id, { done: !sg.done, progress: !sg.done ? 100 : sg.progress })}
                    >
                      {sg.done ? '✓' : ''}
                    </button>
                    <span className={'name' + (sg.done ? '' : '')} style={sg.done ? { textDecoration: 'line-through', color: 'var(--text-faint)' } : undefined}>
                      {sg.title}
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
                      {sg.done ? 100 : sg.progress}%
                    </span>
                    <button className="icon-btn" style={{ width: 26, height: 26, fontSize: 12 }} onClick={() => deleteSubGoal(goal.id, sg.id)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button className="btn ghost" onClick={() => setSubSheetFor(goal.id)}>
                + 세부 목표 추가
              </button>
            </div>
          );
        })}

        <button className="btn block" onClick={() => setGoalSheet(true)}>
          + 새 목표 만들기
        </button>
      </div>

      <Sheet open={goalSheet} onClose={() => setGoalSheet(false)} title="새 목표">
        <div className="field">
          <label>목표 이름</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 일본 취업 준비" autoFocus />
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
          <input type="text" value={subTitle} onChange={(e) => setSubTitle(e.target.value)} placeholder="예: 일본어 N3 취득" autoFocus />
        </div>
        <div style={{ height: 16 }} />
        <button className="btn block" onClick={submitSub}>추가하기</button>
      </Sheet>
    </>
  );
}
