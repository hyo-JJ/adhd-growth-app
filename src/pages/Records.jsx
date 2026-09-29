import { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { getCategory } from '../lib/categories';
import { today, weekdayLabel } from '../lib/date';
import { dayStatus, weekDates, dailyFocusMinutes, weeklyCategorySummary } from '../lib/stats';
import Mascot from '../components/Mascot';
import CategoryIcon from '../components/CategoryIcon';

// 이번 주에 기록이 있는 분야 중 많이 한 순서로 최대 4개, 기록이 없으면 등록된 루틴의 분야로 채운다.
function reportCategories(state, catSummary) {
  const used = Object.keys(catSummary).sort((a, b) => catSummary[b].days.size - catSummary[a].days.size);
  const planned = [...new Set(state.routines.map((r) => getCategory(r.category).id))];
  return [...new Set([...used, ...planned])].slice(0, 4);
}

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
  const reportCats = reportCategories(state, catSummary);

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
        <Mascot pose="main" size={48} />
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

      {reportCats.length > 0 && (
      <div className="stat-grid" style={{ marginTop: 20 }}>
        {reportCats.map((cid) => {
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
      )}
    </div>
  );
}

export default function Records() {
  const { state, setCompletion, clearCompletion } = useStore();
  const [logDate, setLogDate] = useState(today());

  const routines = state.routines;

  function currentAmount(routineId) {
    return state.completions[routineId]?.[logDate];
  }

  const history = useMemo(() => {
    const items = [];
    for (const r of routines) {
      const byDate = state.completions[r.id] || {};
      for (const [date, amount] of Object.entries(byDate)) {
        items.push({ date, label: `${getCategory(r.category).emoji} ${r.title} ${amount}${r.unit}` });
      }
    }
    for (const t of state.customTasks) {
      if (t.done) items.push({ date: t.date, label: `${getCategory(t.category).emoji} ${t.title} 완료` });
    }
    return items.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 20);
  }, [state.completions, state.customTasks, routines]);

  const journalEntries = useMemo(
    () => Object.entries(state.journals).sort((a, b) => (a[0] < b[0] ? 1 : -1)),
    [state.journals]
  );

  return (
    <>
      <div className="topbar">
        <h1>기록</h1>
        <div className="sub">루틴을 실제로 얼마나 했는지 기록해요</div>
      </div>
      <div className="app-main" style={{ paddingTop: 4 }}>
        <WeeklyReport state={state} />

        <div className="card">
          <h3 style={{ marginTop: 0 }}>한 줄 일기</h3>
          {journalEntries.length === 0 && <div className="empty-state">홈에서 오늘을 마무리하며 한 줄 적어보세요.</div>}
          {journalEntries.map(([date, text]) => (
            <div className="task-row plain" key={date}>
              <div className="task-title" style={{ fontWeight: 500 }}>{text}</div>
              <span className="task-meta" style={{ flexShrink: 0 }}>{date.slice(5).replace('-', '/')}</span>
            </div>
          ))}
        </div>

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
