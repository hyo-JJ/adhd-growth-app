import { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { today, formatKorean } from '../lib/date';
import { dayItems, dayStatus, computeStreak, weeklyReport } from '../lib/stats';
import { getCategory } from '../lib/categories';
import Sheet from '../components/Sheet';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function weekdayShort(dateStr) {
  return ['일', '월', '화', '수', '목', '금', '토'][new Date(dateStr + 'T00:00:00').getDay()];
}

export default function Home() {
  const { state, setCompletion, clearCompletion, toggleCustomTask, addCustomTask, toggleMinimalMode } =
    useStore();
  const t = today();
  const minimal = !!state.minimalMode[t];
  const items = useMemo(() => dayItems(state, t), [state, t]);
  const status = useMemo(() => dayStatus(state, t), [state, t]);
  const streak = useMemo(() => computeStreak(state, t), [state, t]);
  const report = useMemo(() => weeklyReport(state, t), [state, t]);

  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('etc');

  function toggleRoutine(item) {
    if (item.done) {
      clearCompletion(item.id, t);
    } else {
      const amount = minimal && item.minTarget != null ? item.minTarget : item.target;
      setCompletion(item.id, t, amount);
    }
  }

  function submitAdd() {
    if (!newTitle.trim()) return;
    addCustomTask({ title: newTitle.trim(), category: newCategory, date: t });
    setNewTitle('');
    setAddOpen(false);
  }

  const overdueCount = state.customTasks.filter((c) => !c.done && c.carriedFrom && c.date === t).length;

  return (
    <>
      <div className="topbar">
        <h1>안녕, {state.nickname} 🌷</h1>
        <div className="sub">{formatKorean(t)}</div>
      </div>

      <div className="app-main" style={{ paddingTop: 4 }}>
        {overdueCount > 0 && (
          <div className="banner">
            🔁 밀린 일정 {overdueCount}개가 오늘로 옮겨졌어요.
          </div>
        )}

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 style={{ margin: 0 }}>오늘의 성장 {status.rate}%</h2>
            {streak > 0 && <span className="tag">🔥 {streak}일 연속</span>}
          </div>
          <div style={{ height: 10 }} />
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${status.rate}%` }} />
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-dim)' }}>
            {status.doneCount} / {status.totalCount} 완료
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>🎯 오늘 할 일</h3>
            <button
              className={'btn secondary'}
              style={{ fontSize: 12, padding: '7px 10px' }}
              onClick={() => toggleMinimalMode(t)}
            >
              {minimal ? '✅ 최소 루틴 적용중' : '오늘 너무 바빠'}
            </button>
          </div>

          {items.length === 0 && (
            <div className="empty-state">오늘 등록된 루틴이 없어요. MY 탭에서 루틴을 추가해보세요.</div>
          )}

          {items.map((item) => {
            const cat = getCategory(item.category);
            const targetLabel =
              item.kind === 'routine'
                ? `${minimal && item.minTarget != null ? item.minTarget : item.target}${item.unit}`
                : null;
            return (
              <div className="task-row" key={item.kind + item.id}>
                <button
                  className={'checkbox' + (item.done ? ' done' : '')}
                  onClick={() => (item.kind === 'routine' ? toggleRoutine(item) : toggleCustomTask(item.id))}
                  aria-label="완료 체크"
                >
                  {item.done ? '✓' : ''}
                </button>
                <div className="task-title">
                  <span className={item.done ? 'done-text' : ''}>
                    {cat.emoji} {item.title}
                  </span>
                  {item.carriedFrom && <div className="task-meta">밀린 일정에서 이동됨</div>}
                </div>
                {targetLabel && <span className="tag">{targetLabel}</span>}
              </div>
            );
          })}

          <div style={{ marginTop: 12 }}>
            <button className="btn secondary block" onClick={() => setAddOpen(true)}>
              + 오늘 할 일 추가
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>📊 이번 주 리포트</h3>
          <div className="stat-grid" style={{ marginBottom: 14 }}>
            <div className="stat-tile">
              <div className="val">{Math.floor(report.studyMinutes / 60)}h {report.studyMinutes % 60}m</div>
              <div className="lab">공부+개발 시간</div>
            </div>
            <div className="stat-tile">
              <div className="val">{report.exerciseCount}</div>
              <div className="lab">운동 누적</div>
            </div>
            <div className="stat-tile">
              <div className="val">{streak}일</div>
              <div className="lab">연속 성장</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={report.daily} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tickFormatter={weekdayShort}
                tick={{ fontSize: 12, fill: 'var(--text-dim)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                formatter={(v) => [`${v}%`, '완료율']}
                labelFormatter={(d) => formatKorean(d)}
                contentStyle={{ fontSize: 12, borderRadius: 10 }}
              />
              <Bar dataKey="rate" radius={[6, 6, 6, 6]}>
                {report.daily.map((d, idx) => (
                  <Cell key={idx} fill={d.date === t ? '#5b6ee1' : '#c7cdf5'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="오늘 할 일 추가">
        <div className="field">
          <label>할 일</label>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="예: 콘텐츠 아이디어 1개"
            autoFocus
          />
        </div>
        <label>카테고리</label>
        <div className="chip-row">
          {['japanese', 'dev', 'exercise', 'selfcare', 'project', 'study', 'content', 'etc'].map((c) => {
            const cat = getCategory(c);
            return (
              <button
                key={c}
                className={'chip' + (newCategory === c ? ' active' : '')}
                onClick={() => setNewCategory(c)}
              >
                {cat.emoji} {cat.label}
              </button>
            );
          })}
        </div>
        <div style={{ height: 16 }} />
        <button className="btn block" onClick={submitAdd}>
          추가하기
        </button>
      </Sheet>
    </>
  );
}
