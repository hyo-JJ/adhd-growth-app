import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { today, formatKorean } from '../lib/date';
import { dayItems, dayStatus } from '../lib/stats';
import { CATEGORIES, getCategory } from '../lib/categories';
import Sheet from '../components/Sheet';
import Mascot from '../components/Mascot';
import CategoryIcon from '../components/CategoryIcon';
import FocusMode from '../components/FocusMode';
import ReschedulePlanner from '../components/ReschedulePlanner';

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
    setJournal,
  } = useStore();
  const t = today();
  const minimal = !!state.minimalMode[t];
  const items = useMemo(() => dayItems(state, t), [state, t]);
  const status = useMemo(() => dayStatus(state, t), [state, t]);

  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('etc');
  const [newMinutes, setNewMinutes] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newRequired, setNewRequired] = useState(true);
  const savedJournal = state.journals[t] || '';
  const [journalDraft, setJournalDraft] = useState('');
  const [journalEditing, setJournalEditing] = useState(false);
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
      time: newTime,
      required: newRequired,
    });
    setNewTitle('');
    setNewMinutes('');
    setNewTime('');
    setNewRequired(true);
    setAddOpen(false);
  }

  function submitIdea() {
    if (!ideaText.trim()) return;
    addIdea({ title: ideaText.trim() });
    setIdeaText('');
    setIdeaOpen(false);
  }

  function submitJournal() {
    const text = journalDraft.trim();
    if (!text) return;
    setJournal(t, text);
    setJournalEditing(false);
  }

  function editJournal() {
    setJournalDraft(savedJournal);
    setJournalEditing(true);
  }

  const overdueTasks = state.customTasks.filter((c) => !c.done && c.date < t);
  const heroCat = hero ? getCategory(hero.category) : null;
  const overLimit = state.dailyMaxTasks != null && items.length > state.dailyMaxTasks;
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
            <Mascot mood={savedJournal ? 'happy' : 'default'} size={52} />
            <div className="mood-prompt">오늘을 마무리하며 한 줄 일기</div>
          </div>
          {savedJournal && !journalEditing ? (
            <div className="journal-saved">
              <div className="journal-text">{savedJournal}</div>
              <button className="btn secondary" onClick={editJournal}>
                수정
              </button>
            </div>
          ) : (
            <div className="journal-input-row">
              <input
                type="text"
                value={journalDraft}
                onChange={(e) => setJournalDraft(e.target.value)}
                placeholder="오늘 어땠나요? 한 줄이면 충분해요"
                maxLength={200}
                onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && submitJournal()}
              />
              <button className="btn" onClick={submitJournal} disabled={!journalDraft.trim()}>
                저장
              </button>
            </div>
          )}
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
              {hero.time && `${hero.time} · `}
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

        {overLimit && (
          <div className="banner">
            오늘 할 일이 {items.length}개로, 정해둔 하루 최대 {state.dailyMaxTasks}개보다 많아요. &lsquo;가능하면&rsquo; 할 일은 미뤄도 괜찮아요.
          </div>
        )}

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
              const targetLabel = [
                item.time,
                cat.label,
                item.kind === 'routine' && `${minimal && item.minTarget != null ? item.minTarget : item.target}${item.unit}`,
                !item.required && '가능하면',
              ]
                .filter(Boolean)
                .join(' · ');
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
            placeholder="예: 세탁기 돌리기"
            autoFocus
          />
        </div>
        <label>카테고리</label>
        <div className="chip-row">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={'chip' + (newCategory === cat.id ? ' active' : '')}
              onClick={() => setNewCategory(cat.id)}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
        <label>꼭 해야 하나요?</label>
        <div className="chip-row">
          <button className={'chip' + (newRequired ? ' active' : '')} onClick={() => setNewRequired(true)}>
            오늘 꼭
          </button>
          <button className={'chip' + (!newRequired ? ' active' : '')} onClick={() => setNewRequired(false)}>
            가능하면
          </button>
        </div>
        <label>시간 (선택)</label>
        <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
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
