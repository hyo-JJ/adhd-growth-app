import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { today, formatKorean } from '../lib/date';
import { dayItems, dayStatus } from '../lib/stats';
import { getCategory } from '../lib/categories';
import Sheet from '../components/Sheet';
import Mascot from '../components/Mascot';
import CategoryIcon from '../components/CategoryIcon';
import FocusMode from '../components/FocusMode';
import ReschedulePlanner from '../components/ReschedulePlanner';

const MOODS = [
  { id: 'tired', label: '졸려요', face: '😪' },
  { id: 'okay', label: '그럭저럭', face: '🙂' },
  { id: 'great', label: '쌩쌩해요', face: '😄' },
];

export default function Home() {
  const {
    state,
    setCompletion,
    clearCompletion,
    toggleCustomTask,
    addCustomTask,
    updateCustomTask,
    deleteCustomTask,
    toggleMinimalMode,
    addIdea,
  } = useStore();
  const t = today();
  const minimal = !!state.minimalMode[t];
  const items = useMemo(() => dayItems(state, t), [state, t]);
  const status = useMemo(() => dayStatus(state, t), [state, t]);

  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('etc');
  const [newMinutes, setNewMinutes] = useState('');
  const [mood, setMood] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [focusItem, setFocusItem] = useState(null);
  const [ideaOpen, setIdeaOpen] = useState(false);
  const [ideaText, setIdeaText] = useState('');
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const incomplete = items.filter((i) => !i.done);
  useEffect(() => {
    if (heroIndex >= incomplete.length) setHeroIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomplete.length]);
  const hero = incomplete[heroIndex] || null;
  const rest = items.filter((i) => !(hero && i.kind === hero.kind && i.id === hero.id));

  function toggleRoutine(item) {
    if (item.done) {
      clearCompletion(item.id, t);
    } else {
      const amount = minimal && item.minTarget != null ? item.minTarget : item.target;
      setCompletion(item.id, t, amount);
    }
  }

  function toggleItem(item) {
    if (item.kind === 'routine') toggleRoutine(item);
    else toggleCustomTask(item.id);
  }

  function submitAdd() {
    if (!newTitle.trim()) return;
    addCustomTask({
      title: newTitle.trim(),
      category: newCategory,
      date: t,
      estMinutes: newMinutes ? Number(newMinutes) : null,
    });
    setNewTitle('');
    setNewMinutes('');
    setAddOpen(false);
  }

  function submitIdea() {
    if (!ideaText.trim()) return;
    addIdea({ title: ideaText.trim() });
    setIdeaText('');
    setIdeaOpen(false);
  }

  const overdueTasks = state.customTasks.filter((c) => !c.done && c.date < t);
  const heroCat = hero ? getCategory(hero.category) : null;
  const heroTarget =
    hero && hero.kind === 'routine' ? `${minimal && hero.minTarget != null ? hero.minTarget : hero.target}${hero.unit}` : null;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">✦ {formatKorean(t)}</div>
          <h1>{state.nickname}님, 오늘도 하나씩!</h1>
        </div>
        <button className="icon-btn" style={{ background: '#fdf0c8', fontSize: 18 }} onClick={() => setIdeaOpen(true)} aria-label="아이디어 적기">
          💡
        </button>
      </div>

      <div className="app-main" style={{ paddingTop: 4 }}>
        {overdueTasks.length > 0 && (
          <button className="banner" style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }} onClick={() => setRescheduleOpen(true)}>
            🔁 밀린 일정 {overdueTasks.length}개, 다시 계획해볼까요?
          </button>
        )}

        <div className="card mood-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Mascot mood={mood === 'great' ? 'happy' : mood === 'tired' ? 'shy' : 'default'} size={52} />
            <div className="mood-prompt">지금 기분은 어때요?</div>
          </div>
          <div className="mood-btn-row">
            {MOODS.map((m) => (
              <button
                key={m.id}
                className={'mood-btn' + (mood === m.id ? ' selected' : '')}
                onClick={() => setMood(m.id)}
              >
                <span className="face">{m.face}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {hero ? (
          <div className="hero-card">
            <div className="hero-top">
              <span className="hero-eyebrow">✦ 지금 할 것 하나</span>
              <span className="hero-cat-badge">
                {heroCat.emoji} {heroCat.label}
              </span>
            </div>
            <div className="hero-title">{hero.title}</div>
            <div className="hero-sub">
              {heroTarget ? `${heroTarget} · 시작만 해도 충분해요` : '오늘 할 일 · 시작만 해도 충분해요'}
            </div>
            <div className="hero-actions">
              <button className="hero-start-btn" onClick={() => setFocusItem(hero)}>
                ▶ 5분만 시작하기
              </button>
              {incomplete.length > 1 && (
                <button
                  className="hero-swap-btn"
                  onClick={() => setHeroIndex((i) => (i + 1) % incomplete.length)}
                  aria-label="다른 할 일 보기"
                >
                  ⇄
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="hero-card hero-empty">
            <Mascot mood="happy" size={48} />
            <div className="hero-title" style={{ marginTop: 8 }}>
              {items.length === 0 ? '오늘 등록된 할 일이 없어요' : '오늘 할 일을 다 끝냈어요!'}
            </div>
            <div className="hero-sub">
              {items.length === 0 ? 'MY 탭에서 루틴을 추가해보세요' : '작은 하나하나가 모여 큰 변화가 돼요'}
            </div>
          </div>
        )}

        <div className="busy-row">
          <div className="busy-icon">☕</div>
          <div className="busy-text">
            <div className="busy-title">오늘 너무 바빠요</div>
            <div className="busy-sub">최소 행동만 남겨 드릴게요</div>
          </div>
          <button className={'switch' + (minimal ? ' on' : '')} onClick={() => toggleMinimalMode(t)}>
            <span className="knob" />
          </button>
        </div>

        {items.length > 0 && (
          <>
            <div className="section-header-row">
              <h3>그다음 할 일</h3>
              <span className="count-pill">
                오늘 {status.doneCount}/{status.totalCount} 완료
              </span>
            </div>
            <div className="leaf-dots">
              {items.map((_, idx) => (
                <span key={idx} className={'leaf-dot' + (idx < status.doneCount ? ' done' : '')}>
                  {idx < status.doneCount ? '🌿' : ''}
                </span>
              ))}
            </div>

            {rest.map((item) => {
              const cat = getCategory(item.category);
              const targetLabel =
                item.kind === 'routine'
                  ? `${cat.label} · ${minimal && item.minTarget != null ? item.minTarget : item.target}${item.unit}`
                  : cat.label;
              const promote = () => {
                if (item.done) return;
                const idx = incomplete.findIndex((i) => i.kind === item.kind && i.id === item.id);
                if (idx !== -1) setHeroIndex(idx);
              };
              return (
                <div className={'task-row' + (item.done ? ' done-row' : '')} key={item.kind + item.id}>
                  <CategoryIcon id={item.category} />
                  <div className="task-title" onClick={promote} style={{ cursor: item.done ? 'default' : 'pointer' }}>
                    <span className={item.done ? 'done-text' : ''}>{item.title}</span>
                    <div className="task-meta">{targetLabel}</div>
                    {item.carriedFrom && <div className="task-meta">밀린 일정에서 이동됨</div>}
                  </div>
                  <button className={'checkbox' + (item.done ? ' done' : '')} onClick={() => toggleItem(item)} aria-label="완료 체크">
                    {item.done ? '✓' : ''}
                  </button>
                </div>
              );
            })}
          </>
        )}

        <div style={{ marginTop: 12 }}>
          <button className="btn secondary block" onClick={() => setAddOpen(true)}>
            + 오늘 할 일 추가
          </button>
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
        <label>예상 시간 (분, 선택)</label>
        <input
          type="number"
          value={newMinutes}
          onChange={(e) => setNewMinutes(e.target.value)}
          placeholder="예: 60"
        />
        <div style={{ height: 16 }} />
        <button className="btn block" onClick={submitAdd}>
          추가하기
        </button>
      </Sheet>

      <Sheet open={ideaOpen} onClose={() => setIdeaOpen(false)} title="💡 새 아이디어 톡!">
        <div className="field">
          <input
            type="text"
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            placeholder="한 줄이면 충분해요"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && submitIdea()}
          />
        </div>
        <div style={{ height: 14 }} />
        <button className="btn block" onClick={submitIdea}>
          저장하고 할 일로 돌아가기
        </button>
      </Sheet>

      {focusItem && (
        <FocusMode
          item={focusItem}
          onClose={() => setFocusItem(null)}
          onComplete={() => toggleItem(focusItem)}
          onParkIdea={(text) => addIdea({ title: text, capturedInFocus: true })}
        />
      )}

      {rescheduleOpen && (
        <ReschedulePlanner
          tasks={overdueTasks}
          updateCustomTask={updateCustomTask}
          deleteCustomTask={deleteCustomTask}
          onClose={() => setRescheduleOpen(false)}
        />
      )}
    </>
  );
}
