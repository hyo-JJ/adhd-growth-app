import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { CATEGORIES, getCategory } from '../lib/categories';
import { today, addDays, formatKorean } from '../lib/date';
import { dayItems } from '../lib/stats';
import { SLOTS, slotOfTime, currentSlot } from '../lib/timeSlot';
import Mascot from '../components/Mascot';
import CategoryIcon from '../components/CategoryIcon';
import AiReviewSheet from '../components/AiReviewSheet';
import AddTaskSheet from '../components/AddTaskSheet';

const SLOT_DEFAULT_TIME = { morning: '09:00', afternoon: '13:00', evening: '19:00', any: '' };

export default function Records() {
  const { state, setCompletion, clearCompletion, toggleCustomTask, addCustomTask } = useStore();
  const t = today();
  const [params, setParams] = useSearchParams();
  const slotId = SLOTS.some((s) => s.id === params.get('slot')) ? params.get('slot') : currentSlot();
  const [date, setDate] = useState(t);
  const [addOpen, setAddOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [amountOpen, setAmountOpen] = useState(false);

  const minimal = date === t && !!state.minimalMode[t];
  const items = useMemo(() => dayItems(state, date), [state, date]);
  const slotCounts = Object.fromEntries(SLOTS.map((s) => [s.id, items.filter((i) => slotOfTime(i.time) === s.id)]));
  const slotItems = slotCounts[slotId];

  // 같은 시간대 안에서는 공부/생활리듬/운동… 분야별로 묶는다
  const groups = CATEGORIES.map((cat) => ({
    cat,
    items: slotItems.filter((i) => getCategory(i.category).id === cat.id),
  }))
    .filter((g) => g.items.length > 0)
    .map((g, gi, arr) => ({ ...g, start: arr.slice(0, gi).reduce((n, x) => n + x.items.length, 0) }));

  function selectSlot(id) {
    setParams({ slot: id }, { replace: true });
  }

  function toggleItem(item) {
    if (item.kind === 'routine') {
      if (item.done) clearCompletion(item.id, date);
      else setCompletion(item.id, date, minimal && item.minTarget != null ? item.minTarget : item.target);
    } else {
      toggleCustomTask(item.id);
    }
  }

  const journalEntries = useMemo(
    () => Object.entries(state.journals).sort((a, b) => (a[0] < b[0] ? 1 : -1)),
    [state.journals]
  );

  return (
    <>
      <div className="topbar">
        <div>
          <h1>기록</h1>
          <div className="sub">시간대별로, 분야별로 지켜야 할 것들</div>
        </div>
      </div>

      <div className="app-main" style={{ paddingTop: 4 }}>
        <div className="date-stepper">
          <button className="icon-btn soft" onClick={() => setDate((d) => addDays(d, -1))} aria-label="이전 날">
            ‹
          </button>
          <div className="date-stepper-label">
            {formatKorean(date)}
            {date === t && <span className="today-badge">오늘</span>}
          </div>
          <button className="icon-btn soft" onClick={() => setDate((d) => addDays(d, 1))} disabled={date >= t} aria-label="다음 날">
            ›
          </button>
        </div>

        <div className="segmented">
          {SLOTS.map((s) => {
            const list = slotCounts[s.id];
            const done = list.filter((i) => i.done).length;
            return (
              <button key={s.id} className={'seg-btn' + (slotId === s.id ? ' active' : '')} onClick={() => selectSlot(s.id)}>
                <span className="seg-icon">{s.icon}</span>
                <span>{s.label}</span>
                {list.length > 0 && (
                  <span className="seg-count">
                    {done}/{list.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {groups.length === 0 && (
          <div className="slot-empty">
            <Mascot pose="lying" size={64} className="mascot-center" />
            <div>이 시간대에는 할 일이 없어요</div>
          </div>
        )}

        {groups.map(({ cat, items: groupItems, start }) => {
          const done = groupItems.filter((i) => i.done).length;
          return (
            <div className="routine-group" key={cat.id}>
              <div className="routine-group-header">
                <span className="routine-group-label" style={{ color: cat.color }}>
                  {cat.emoji} {cat.label}
                </span>
                <span className="routine-group-count">
                  {done}/{groupItems.length}
                </span>
              </div>
              {groupItems.map((item, idx) => {
                const meta = [
                  item.time,
                  item.kind === 'routine' && `${minimal && item.minTarget != null ? item.minTarget : item.target}${item.unit}`,
                  item.kind === 'custom' && '오늘 할 일',
                  !item.required && '가능하면',
                ]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <div className={'routine-row' + (item.done ? ' done' : '')} key={item.kind + item.id}>
                    <span className="routine-num" style={{ background: cat.bg, color: cat.color }}>
                      {start + idx + 1}
                    </span>
                    <span className="routine-thumb">
                      <CategoryIcon id={cat.id} size={40} />
                    </span>
                    <div className="routine-info">
                      <div className="routine-title">{item.title}</div>
                      {meta && <div className="task-meta">{meta}</div>}
                    </div>
                    <button className={'checkbox' + (item.done ? ' done' : '')} onClick={() => toggleItem(item)} aria-label="완료 체크">
                      {item.done ? '✓' : ''}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}

        <button className="btn pill block" onClick={() => setAddOpen(true)}>
          + 할 일 추가
        </button>

        <div className="card" style={{ marginTop: 20 }}>
          <h3>한 줄 일기</h3>
          {journalEntries.length === 0 && <div className="empty-state">홈에서 오늘을 마무리하며 한 줄 적어보세요.</div>}
          {journalEntries.map(([d, text]) => (
            <div className="task-row plain" key={d}>
              <div className="task-title" style={{ fontWeight: 500 }}>
                {text}
              </div>
              <span className="task-meta" style={{ flexShrink: 0 }}>
                {d.slice(5).replace('-', '/')}
              </span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3>🔍 AI에게 점검받기</h3>
          <div className="task-meta" style={{ marginBottom: 10 }}>
            잘하고 있는지, 뭘 바꾸면 좋을지 내 실행 기록을 평소 쓰는 AI에게 보여주고 물어봐요.
          </div>
          <button className="btn block" onClick={() => setReviewOpen(true)}>
            실행 기록 내보내기
          </button>
        </div>

        <div className="card">
          <button className="accordion-header" style={{ width: '100%', background: 'none', border: 'none', padding: 0, color: 'inherit', font: 'inherit' }} onClick={() => setAmountOpen((o) => !o)}>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ margin: 0 }}>루틴 양 직접 기록하기</h3>
              <div className="task-meta">{formatKorean(date)} · 실제로 한 만큼 숫자로 적어요</div>
            </div>
            <span className={'chevron' + (amountOpen ? ' open' : '')}>›</span>
          </button>
          {amountOpen && (
            <div style={{ marginTop: 10 }}>
              {state.routines.length === 0 && <div className="empty-state">등록된 루틴이 없어요. MY 탭에서 추가해보세요.</div>}
              {state.routines.map((r) => {
                const amt = state.completions[r.id]?.[date];
                return (
                  <div className="task-row plain" key={r.id}>
                    <CategoryIcon id={r.category} />
                    <div className="task-title">
                      {r.title}
                      <div className="task-meta">
                        목표 {r.amount}
                        {r.unit}
                      </div>
                    </div>
                    <input
                      type="number"
                      style={{ width: 72 }}
                      placeholder="0"
                      value={amt ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') clearCompletion(r.id, date);
                        else setCompletion(r.id, date, Number(v));
                      }}
                    />
                    <span className="task-meta">{r.unit}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddTaskSheet
        key={slotId + date}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        date={date}
        defaultTime={SLOT_DEFAULT_TIME[slotId]}
        addCustomTask={addCustomTask}
      />
      <AiReviewSheet open={reviewOpen} onClose={() => setReviewOpen(false)} state={state} />
    </>
  );
}
