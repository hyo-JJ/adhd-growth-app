import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useStore } from '../context/StoreContext';
import { getMonthMatrix, today, formatKorean, addDays, monthDates, weekdayLabel, weekday } from '../lib/date';
import { dayItems, dayStatus, weekDates, rangeRate, categoryRates, computeStreak } from '../lib/stats';
import { getCategory } from '../lib/categories';
import Mascot from '../components/Mascot';
import CategoryIcon from '../components/CategoryIcon';

const LINE_COLOR = '#F0789A';
const PERIODS = [
  { id: 'week', label: '주' },
  { id: 'month', label: '월' },
  { id: 'year', label: '년' },
];

// 선택한 기간의 그래프 점들과, 비교용 직전 기간 날짜를 만든다
function buildPeriod(state, period, t) {
  const now = new Date(t + 'T00:00:00');
  const y = now.getFullYear();
  const m = now.getMonth();

  if (period === 'week') {
    const dates = weekDates(t);
    const points = dates.map((d) => ({
      label: weekdayLabel(weekday(d)),
      rate: d > t ? null : dayStatus(state, d).totalCount === 0 ? null : dayStatus(state, d).rate,
    }));
    return { dates, prevDates: weekDates(addDays(t, -7)), points, caption: '이번 주' };
  }

  if (period === 'month') {
    const dates = monthDates(y, m);
    const points = dates.map((d) => {
      const st = d > t ? null : dayStatus(state, d);
      return { label: `${Number(d.slice(8))}`, rate: st && st.totalCount > 0 ? st.rate : null };
    });
    const prev = new Date(y, m - 1, 1);
    return { dates, prevDates: monthDates(prev.getFullYear(), prev.getMonth()), points, caption: '이번 달' };
  }

  const months = Array.from({ length: 12 }, (_, i) => monthDates(y, i));
  const points = months.map((dates, i) => ({ label: `${i + 1}월`, rate: rangeRate(state, dates).rate }));
  const prevYear = Array.from({ length: 12 }, (_, i) => monthDates(y - 1, i)).flat();
  return { dates: months.flat(), prevDates: prevYear, points, caption: '올해' };
}

function scoreMessage(rate) {
  if (rate == null) return { title: '아직 기록이 없어요', sub: '오늘 하나부터 시작해봐요' };
  if (rate >= 80) return { title: '아주 잘하고 있어요!', sub: '이 흐름 그대로면 충분해요 💗' };
  if (rate >= 50) return { title: '꾸준히 하고 있어요', sub: '절반 넘게 해냈어요 ✨' };
  if (rate > 0) return { title: '조금씩 움직였어요', sub: '움직인 날이 쌓이고 있어요' };
  return { title: '쉬어간 기간이에요', sub: '다시 하나만 해봐요' };
}

export default function CalendarPage() {
  const { state, setCompletion, clearCompletion, toggleCustomTask } = useStore();
  const t = today();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selected, setSelected] = useState(t);
  const [period, setPeriod] = useState('week');

  const weeks = useMemo(() => getMonthMatrix(cursor.year, cursor.month), [cursor]);
  const selItems = useMemo(() => dayItems(state, selected), [state, selected]);
  const selStatus = useMemo(() => dayStatus(state, selected), [state, selected]);

  const stats = useMemo(() => {
    const p = buildPeriod(state, period, t);
    const score = rangeRate(state, p.dates);
    const cur = categoryRates(state, p.dates);
    const prev = categoryRates(state, p.prevDates);
    const cats = {};
    for (const [cid, v] of Object.entries(cur)) {
      const id = getCategory(cid).id;
      const b = cats[id] || { done: 0, total: 0, prevDone: 0, prevTotal: 0 };
      b.done += v.done;
      b.total += v.total;
      cats[id] = b;
    }
    for (const [cid, v] of Object.entries(prev)) {
      const id = getCategory(cid).id;
      if (!cats[id]) continue;
      cats[id].prevDone += v.done;
      cats[id].prevTotal += v.total;
    }
    const catList = Object.entries(cats)
      .map(([id, b]) => {
        const rate = Math.round((b.done / b.total) * 100);
        const prevRate = b.prevTotal > 0 ? Math.round((b.prevDone / b.prevTotal) * 100) : null;
        return { id, ...b, rate, delta: prevRate == null ? null : rate - prevRate };
      })
      .sort((a, b) => b.total - a.total);
    return { ...p, score, catList };
  }, [state, period, t]);

  const streak = useMemo(() => computeStreak(state, t), [state, t]);
  const msg = scoreMessage(stats.score.rate);

  function changeMonth(delta) {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  }

  function toggleItem(item) {
    if (item.kind === 'routine') {
      if (item.done) clearCompletion(item.id, selected);
      else setCompletion(item.id, selected, item.target);
    } else {
      toggleCustomTask(item.id);
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>캘린더</h1>
          <div className="sub">얼마나 잘하고 있는지 한눈에 봐요 ✨</div>
        </div>
      </div>
      <div className="app-main" style={{ paddingTop: 4 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <button className="icon-btn soft" onClick={() => changeMonth(-1)} aria-label="이전 달">
              ‹
            </button>
            <h3 style={{ margin: 0 }}>
              {cursor.year}년 {cursor.month + 1}월
            </h3>
            <button className="icon-btn soft" onClick={() => changeMonth(1)} aria-label="다음 달">
              ›
            </button>
          </div>
          <div className="cal-grid">
            {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
              <div className="cal-head" key={d}>
                {d}
              </div>
            ))}
            {weeks.flat().map((cell) => {
              const st = dayStatus(state, cell.dateStr);
              const cats = [...new Set(st.items.filter((i) => i.done).map((i) => getCategory(i.category).id))].slice(0, 3);
              const full = st.totalCount > 0 && st.rate === 100;
              return (
                <div
                  key={cell.dateStr}
                  className={
                    'cal-cell' +
                    (!cell.inMonth ? ' out' : '') +
                    (cell.dateStr === t ? ' today' : '') +
                    (full ? ' full' : '') +
                    (cell.dateStr === selected ? ' selected' : '')
                  }
                  onClick={() => setSelected(cell.dateStr)}
                >
                  <span>{Number(cell.dateStr.slice(8))}</span>
                  <div className="cal-dot-row">
                    {cats.map((c) => (
                      <span key={c} className="cal-dot" style={{ background: getCategory(c).color }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cal-day-detail">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontWeight: 700 }}>{formatKorean(selected)}</span>
              <span className="task-meta">
                {selStatus.doneCount} / {selStatus.totalCount} 완료
              </span>
            </div>
            {selItems.length === 0 && <div className="task-meta" style={{ padding: '8px 0' }}>이 날은 일정이 없어요.</div>}
            {selItems.map((item) => {
              const cat = getCategory(item.category);
              return (
                <div className="task-row plain" key={item.kind + item.id}>
                  <button className={'checkbox' + (item.done ? ' done' : '')} onClick={() => toggleItem(item)} aria-label="완료 체크">
                    {item.done ? '✓' : ''}
                  </button>
                  <div className="task-title">
                    <span className={item.done ? 'done-text' : ''}>
                      {cat.emoji} {item.title}
                    </span>
                  </div>
                  {item.kind === 'routine' && (
                    <span className="tag">
                      {item.target}
                      {item.unit}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="segmented three">
          {PERIODS.map((p) => (
            <button key={p.id} className={'seg-btn' + (period === p.id ? ' active' : '')} onClick={() => setPeriod(p.id)}>
              {p.label}
            </button>
          ))}
        </div>

        <h3 className="home-section-title" style={{ marginTop: 4 }}>
          {stats.caption} 달성률
        </h3>
        <div className="score-card">
          <div className="score-top">
            <div className="score-num">
              {stats.score.rate ?? '–'}
              {stats.score.rate != null && <small>%</small>}
            </div>
            <div className="score-msg">
              <div className="score-title">{msg.title}</div>
              <div className="score-sub">
                {stats.score.total > 0 ? `${stats.score.total}개 중 ${stats.score.done}개 완료 · ` : ''}
                {msg.sub}
              </div>
            </div>
            <Mascot pose="heart" size={64} className="score-mascot" />
          </div>
          <div className="score-chart" role="img" aria-label={`${stats.caption} 날짜별 달성률 그래프`}>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={stats.points} margin={{ top: 12, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(240,120,154,0.15)" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }}
                  interval={period === 'month' ? 4 : 0}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  cursor={{ stroke: LINE_COLOR, strokeOpacity: 0.3 }}
                  formatter={(v) => [`${v}%`, '달성률']}
                  labelFormatter={(l) => (period === 'month' ? `${l}일` : period === 'week' ? `${l}요일` : l)}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke={LINE_COLOR}
                  strokeWidth={2}
                  connectNulls
                  dot={{ r: period === 'month' ? 3 : 4, fill: '#fff', stroke: LINE_COLOR, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: LINE_COLOR, stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <h3 className="home-section-title">분야별 달성률</h3>
        <div className="card" style={{ padding: '6px 16px' }}>
          {stats.catList.length === 0 && <div className="empty-state">이 기간엔 아직 기록이 없어요.</div>}
          {stats.catList.map((c) => {
            const cat = getCategory(c.id);
            return (
              <div className="task-row plain" key={c.id}>
                <CategoryIcon id={c.id} size={34} />
                <div className="task-title">
                  {cat.label}
                  <div className="task-meta">
                    {c.total}개 중 {c.done}개 완료
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800 }}>{c.rate}%</div>
                  {c.delta != null && c.delta !== 0 && (
                    <div className={'delta ' + (c.delta > 0 ? 'up' : 'down')}>
                      {c.delta > 0 ? '↑' : '↓'} {Math.abs(c.delta)}%p
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <h3 className="home-section-title">연속 기록</h3>
        <div className="streak-card">
          <span className="streak-fire">🔥</span>
          <div style={{ flex: 1 }}>
            <div>
              <span className="streak-num">{streak}</span> 일 연속 다 해냈어요
            </div>
            <div className="task-meta">{streak > 0 ? '정말 잘하고 있어요!' : '끊겨도 괜찮아요. 오늘부터 다시 하나씩!'}</div>
          </div>
          <Mascot pose="wave" size={54} />
        </div>
      </div>
    </>
  );
}
