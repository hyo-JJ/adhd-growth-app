import { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { getCategory } from '../lib/categories';
import { today, formatKorean } from '../lib/date';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Records() {
  const { state, setCompletion, clearCompletion, addWeightLog } = useStore();
  const [logDate, setLogDate] = useState(today());
  const [weightInput, setWeightInput] = useState('');

  const routines = state.routines;

  function currentAmount(routineId) {
    return state.completions[routineId]?.[logDate];
  }

  function submitWeight() {
    const kg = parseFloat(weightInput);
    if (!kg || kg <= 0) return;
    addWeightLog(kg, logDate);
    setWeightInput('');
  }

  const sortedWeights = useMemo(
    () => [...state.weightLogs].sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-14),
    [state.weightLogs]
  );

  const history = useMemo(() => {
    const items = [];
    for (const r of routines) {
      const byDate = state.completions[r.id] || {};
      for (const [date, amount] of Object.entries(byDate)) {
        items.push({ date, label: `${getCategory(r.category).emoji} ${r.title} ${amount}${r.unit}` });
      }
    }
    for (const w of state.weightLogs) {
      items.push({ date: w.date, label: `⚖️ 체중 ${w.kg}kg` });
    }
    return items.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 20);
  }, [state.completions, state.weightLogs, routines]);

  return (
    <>
      <div className="topbar">
        <h1>기록</h1>
        <div className="sub">공부·운동·체중·물을 빠르게 기록해요</div>
      </div>
      <div className="app-main" style={{ paddingTop: 4 }}>
        <div className="card">
          <label style={{ marginTop: 0 }}>기록할 날짜</label>
          <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} max={today()} />
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>루틴 기록</h3>
          {routines.length === 0 && <div className="empty-state">등록된 루틴이 없어요. MY 탭에서 추가해보세요.</div>}
          {routines.map((r) => {
            const cat = getCategory(r.category);
            const amt = currentAmount(r.id);
            return (
              <div className="task-row" key={r.id}>
                <div className="task-title">
                  {cat.emoji} {r.title}
                  <div className="task-meta">목표 {r.amount}{r.unit}</div>
                </div>
                <input
                  type="number"
                  style={{ width: 72 }}
                  placeholder="0"
                  value={amt ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '') clearCompletion(r.id, logDate);
                    else setCompletion(r.id, logDate, Number(v));
                  }}
                />
                <span className="task-meta">{r.unit}</span>
              </div>
            );
          })}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>⚖️ 체중 기록</h3>
          <div className="row">
            <input
              type="number"
              step="0.1"
              placeholder="예: 65.5"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
            />
            <button className="btn" style={{ flex: '0 0 auto' }} onClick={submitWeight}>
              기록
            </button>
          </div>
          {sortedWeights.length > 1 && (
            <div style={{ marginTop: 14 }}>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={sortedWeights} margin={{ left: -30, right: 10, top: 6, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} tickFormatter={(d) => d.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                  <Tooltip labelFormatter={(d) => formatKorean(d)} formatter={(v) => [`${v}kg`, '체중']} contentStyle={{ fontSize: 12, borderRadius: 10 }} />
                  <Line type="monotone" dataKey="kg" stroke="#5b6ee1" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>최근 기록</h3>
          {history.length === 0 && <div className="empty-state">아직 기록이 없어요.</div>}
          {history.map((h, idx) => (
            <div className="task-row" key={idx}>
              <div className="task-title">{h.label}</div>
              <span className="task-meta">{h.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
