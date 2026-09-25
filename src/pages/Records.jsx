import { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { getCategory } from '../lib/categories';
import { today, formatKorean, weekdayLabel } from '../lib/date';
import { dayStatus, weekDates, dailyFocusMinutes, weeklyCategorySummary } from '../lib/stats';
import Mascot from '../components/Mascot';
import CategoryIcon from '../components/CategoryIcon';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const REPORT_CATS = ['japanese', 'dev', 'exercise', 'selfcare'];

function formatCatValue(bucket) {
  if (!bucket) return { value: '-', sub: '아직 기록 없어요' };
  if (bucket.unit === '분') {
    const h = Math.floor(bucket.minutes / 60);
    const m = bucket.minutes % 60;
    return { value: h > 0 ? `${h}시간 ${m}분` : `${m}분`, sub: `${bucket.days.size}일 완료` };
  }
  return { value: `${bucket.otherTotal}${bucket.unit}`, sub: `${bucket.days.size}일 완료` };
}

function WeeklyReport({ state }) {
  const t = today();
  const dates = useMemo(() => weekDates(t), [t]);
  const focusByDay = useMemo(() => dailyFocusMinutes(state, dates), [state, dates]);
  const catSummary = useMemo(() => weeklyCategorySummary(state, dates), [state, dates]);

  const movedDays = dates.filter((d) => d <= t && dayStatus(state, d).doneCount > 0).length;
  const totalFocusMinutes = focusByDay.reduce((sum, d) => sum + d.minutes, 0);
  const maxMinutes = Math.max(1, ...focusByDay.map((d) => d.minutes));

  return (
    <div className="card">
      <div className="task-meta" style={{ marginBottom: 2 }}>
        주간 리포트 · {dates[0].slice(5).replace('-', '월 ')}일–{dates[6].slice(8)}일
      </div>
      <h2 style={{ margin: '0 0 14px' }}>이번 주 7일 중 {movedDays}일 움직였어요</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-2)', borderRadius: 14, padding: 14, marginBottom: 16 }}>
        <Mascot mood="happy" size={44} />
        <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          연속 기록이 끊겨도 괜찮아요. 쌓인 날에 꽃 도장을 찍어 드릴게요.
        </div>
      </div>

      <div className="streak-row">
        {dates.map((d) => {
          const moved = d <= t && dayStatus(state, d).doneCount > 0;
          return (
            <div className="streak-day" key={d}>
              <span className={'flower-dot' + (moved ? ' done' : '') + (d === t ? ' today' : '')}>
                {moved ? '🌸' : ''}
              </span>
              <span className="lab">{weekdayLabel(new Date(d + 'T00:00:00').getDay())}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '22px 0 10px' }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>집중한 시간</span>
        <span style={{ fontWeight: 800, fontSize: 20 }}>
          {Math.floor(totalFocusMinutes / 60)}시간 {totalFocusMinutes % 60}분
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90 }}>
        {focusByDay.map((d) => (
          <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {d.minutes > 0 ? (
              <div
                style={{
                  width: '100%',
                  maxWidth: 26,
                  height: Math.max(10, (d.minutes / maxMinutes) * 70),
                  borderRadius: 999,
                  background: d.date === t ? 'var(--hero-2)' : 'var(--accent)',
                  opacity: d.date === t ? 1 : 0.75,
                }}
              />
            ) : (
              <div className="task-meta" style={{ alignSelf: 'flex-end', marginBottom: 4 }}>
                쉼
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        {dates.map((d) => (
          <div key={d} className="task-meta" style={{ flex: 1, textAlign: 'center' }}>
            {weekdayLabel(new Date(d + 'T00:00:00').getDay())}
          </div>
        ))}
      </div>

      <div className="stat-grid" style={{ marginTop: 20 }}>
        {REPORT_CATS.map((cid) => {
          const cat = getCategory(cid);
          const { value, sub } = formatCatValue(catSummary[cid]);
          return (
            <div className="stat-tile" style={{ background: cat.bg }} key={cid}>
              <div className="lab" style={{ color: cat.color }}>
                {cat.emoji} {cat.label}
              </div>
              <div className="val">{value}</div>
              <div className="lab-sub">{sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
        <WeeklyReport state={state} />

        <div className="card">
          <label style={{ marginTop: 0 }}>기록할 날짜</label>
          <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} max={today()} />
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>루틴 기록</h3>
          {routines.length === 0 && <div className="empty-state">등록된 루틴이 없어요. MY 탭에서 추가해보세요.</div>}
          {routines.map((r) => {
            const amt = currentAmount(r.id);
            return (
              <div className="task-row plain" key={r.id}>
                <CategoryIcon id={r.category} />
                <div className="task-title">
                  {r.title}
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
            <div className="task-row plain" key={idx}>
              <div className="task-title">{h.label}</div>
              <span className="task-meta">{h.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
