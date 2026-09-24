import { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { getMonthMatrix, today, formatKorean } from '../lib/date';
import { dayItems, dayStatus } from '../lib/stats';
import { getCategory } from '../lib/categories';

export default function CalendarPage() {
  const { state, setCompletion, clearCompletion, toggleCustomTask } = useStore();
  const t = today();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selected, setSelected] = useState(t);

  const weeks = useMemo(() => getMonthMatrix(cursor.year, cursor.month), [cursor]);
  const selItems = useMemo(() => dayItems(state, selected), [state, selected]);
  const selStatus = useMemo(() => dayStatus(state, selected), [state, selected]);

  function changeMonth(delta) {
    let m = cursor.month + delta;
    let y = cursor.year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setCursor({ year: y, month: m });
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
        <h1>캘린더</h1>
        <div className="sub">일정을 한눈에 확인해요</div>
      </div>
      <div className="app-main" style={{ paddingTop: 4 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <button className="icon-btn" onClick={() => changeMonth(-1)}>‹</button>
            <h3 style={{ margin: 0 }}>{cursor.year}년 {cursor.month + 1}월</h3>
            <button className="icon-btn" onClick={() => changeMonth(1)}>›</button>
          </div>
          <div className="cal-grid">
            {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
              <div className="cal-head" key={d}>{d}</div>
            ))}
            {weeks.flat().map((cell) => {
              const st = dayStatus(state, cell.dateStr);
              const cats = [...new Set(st.items.filter((i) => i.done).map((i) => i.category))].slice(0, 3);
              return (
                <div
                  key={cell.dateStr}
                  className={
                    'cal-cell' +
                    (!cell.inMonth ? ' out' : '') +
                    (cell.dateStr === t ? ' today' : '') +
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
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>{formatKorean(selected)}</h3>
          <div className="task-meta" style={{ marginBottom: 8 }}>
            {selStatus.doneCount} / {selStatus.totalCount} 완료
          </div>
          {selItems.length === 0 && <div className="empty-state">이 날은 일정이 없어요.</div>}
          {selItems.map((item) => {
            const cat = getCategory(item.category);
            return (
              <div className="task-row" key={item.kind + item.id}>
                <button className={'checkbox' + (item.done ? ' done' : '')} onClick={() => toggleItem(item)}>
                  {item.done ? '✓' : ''}
                </button>
                <div className="task-title">
                  <span className={item.done ? 'done-text' : ''}>{cat.emoji} {item.title}</span>
                </div>
                {item.kind === 'routine' && <span className="tag">{item.target}{item.unit}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
