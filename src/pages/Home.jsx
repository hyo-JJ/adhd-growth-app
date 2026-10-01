import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { today, formatKorean } from '../lib/date';
import { dayItems, dayStatus } from '../lib/stats';
import { getCategory } from '../lib/categories';
import { SLOTS, slotOfTime, greeting } from '../lib/timeSlot';
import Sheet from '../components/Sheet';
import Mascot from '../components/Mascot';
import CategoryIcon from '../components/CategoryIcon';
import FocusMode from '../components/FocusMode';
import ReschedulePlanner from '../components/ReschedulePlanner';
import AddTaskSheet from '../components/AddTaskSheet';
import { loadFocusSession } from '../lib/focusSession';

const TIPS = [
  '완벽하게 말고, 5분만 시작해도 오늘은 성공이에요.',
  '물 한 잔 마시고 시작하면 집중이 조금 쉬워져요.',
  '하기 싫은 일은 제일 작은 첫 단계만 적어보세요.',
  '딴생각이 떠오르면 💡에 던져두고 다시 돌아와요.',
  '끝낸 일에 체크하는 순간을 충분히 즐겨요.',
  '바쁜 날엔 "오늘 너무 바빠요"를 켜도 괜찮아요.',
  '어제 못 한 건 어제의 일. 오늘 하나만 해봐요.',
];

function tipOfDay(dateStr) {
  const n = Number(dateStr.replace(/-/g, ''));
  return TIPS[n % TIPS.length];
}

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
  const navigate = useNavigate();
  const t = today();
  const minimal = !!state.minimalMode[t];
  const items = useMemo(() => dayItems(state, t), [state, t]);
  const status = useMemo(() => dayStatus(state, t), [state, t]);

  const [addOpen, setAddOpen] = useState(false);
  const savedJournal = state.journals[t] || '';
  const [journalDraft, setJournalDraft] = useState('');
  const [journalEditing, setJournalEditing] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [focusItem, setFocusItem] = useState(() => {
    const s = loadFocusSession();
    return s?.source === 'home' ? s.item : null;
  });
  const [ideaOpen, setIdeaOpen] = useState(false);
  const [ideaText, setIdeaText] = useState('');
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const incomplete = items.filter((i) => !i.done);
  useEffect(() => {
    if (heroIndex >= incomplete.length) setHeroIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomplete.length]);
  const hero = incomplete[heroIndex] || null;

  // 아침/점심/저녁/언제든 으로 나눠서 요약 카드로 보여준다
  const slotGroups = SLOTS.map((slot) => {
    const slotItems = items.filter((i) => slotOfTime(i.time) === slot.id);
    const cats = [...new Set(slotItems.map((i) => getCategory(i.category).id))];
    return { slot, items: slotItems, cats, doneCount: slotItems.filter((i) => i.done).length };
  }).filter((g) => g.items.length > 0);

  function toggleItem(item) {
    if (item.kind === 'routine') {
      if (item.done) clearCompletion(item.id, t);
      else setCompletion(item.id, t, minimal && item.minTarget != null ? item.minTarget : item.target);
    } else {
      toggleCustomTask(item.id);
    }
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
      <div className="home-header">
        <div className="home-header-top">
          <span className="date-chip">✦ {formatKorean(t)}</span>
          <button className="icon-btn soft" onClick={() => setIdeaOpen(true)} aria-label="아이디어 적기">
            💡
          </button>
        </div>
        <div className="home-greeting-row">
          <div>
            <div className="home-greeting">{greeting()}</div>
            <div className="home-name">{state.nickname}님!</div>
            <div className="home-sub">오늘도 하나씩 해봐요 ✨</div>
          </div>
          <Mascot pose={savedJournal ? 'heart' : 'wave'} size={92} className="home-mascot" />
        </div>

        <div className="journal-box">
          <div className="journal-label">📝 오늘의 한 줄 일기</div>
          {savedJournal && !journalEditing ? (
            <div className="journal-saved">
              <div className="journal-text">{savedJournal}</div>
              <button className="link-btn" onClick={editJournal}>
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
              <button className="btn small" onClick={submitJournal} disabled={!journalDraft.trim()}>
                저장
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="app-main" style={{ paddingTop: 8 }}>
        {overdueTasks.length > 0 && (
          <button className="banner" style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }} onClick={() => setRescheduleOpen(true)}>
            🔁 밀린 일정 {overdueTasks.length}개, 다시 계획해볼까요?
          </button>
        )}

        {hero ? (
          <div className="hero-card">
            <div className="hero-top">
              <span className="hero-eyebrow">지금 할 것 하나</span>
              <span className="hero-cat-badge">
                {heroCat.emoji} {heroCat.label}
              </span>
            </div>
            <div className="hero-body">
              <div className="hero-bubble">
                <Mascot pose="main" size={70} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="hero-title">{hero.title}</div>
                <div className="hero-sub">
                  {hero.time && `${hero.time} · `}
                  {heroTarget ? `${heroTarget} · ` : ''}시작만 해도 충분해요 💗
                </div>
              </div>
            </div>
            <div className="hero-actions">
              {incomplete.length > 1 && (
                <button className="hero-swap-btn" onClick={() => setHeroIndex((i) => (i + 1) % incomplete.length)} aria-label="다른 할 일 보기">
                  ⇄
                </button>
              )}
              <button className="hero-start-btn" onClick={() => setFocusItem(hero)}>
                5분만 시작하기 <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="hero-card hero-empty">
            <Mascot pose={items.length === 0 ? 'lying' : 'heart'} size={72} className="mascot-center" />
            <div className="hero-title" style={{ marginTop: 8 }}>
              {items.length === 0 ? '오늘 등록된 할 일이 없어요' : '오늘 할 일을 다 끝냈어요!'}
            </div>
            <div className="hero-sub">
              {items.length === 0 ? '아래에서 할 일을 추가하거나 MY 탭에서 루틴을 만들어보세요' : '작은 하나하나가 모여 큰 변화가 돼요'}
            </div>
          </div>
        )}

        <div className="busy-row">
          <div className="busy-icon">☕</div>
          <div className="busy-text">
            <div className="busy-title">오늘 너무 바빠요</div>
            <div className="busy-sub">최소 행동만 남겨 드릴게요</div>
          </div>
          <button className={'switch' + (minimal ? ' on' : '')} onClick={() => toggleMinimalMode(t)} aria-label="최소 모드">
            <span className="knob" />
          </button>
        </div>

        {overLimit && (
          <div className="banner">
            오늘 할 일이 {items.length}개로, 정해둔 하루 최대 {state.dailyMaxTasks}개보다 많아요. &lsquo;가능하면&rsquo; 할 일은 미뤄도 괜찮아요.
          </div>
        )}

        {slotGroups.length > 0 && (
          <>
            <div className="section-header-row">
              <h3>시간별 루틴</h3>
              <span className="count-pill">
                오늘 {status.doneCount}/{status.totalCount} 완료
              </span>
            </div>
            {slotGroups.map(({ slot, items: slotItems, cats, doneCount }) => {
              const allDone = doneCount === slotItems.length;
              return (
                <button
                  key={slot.id}
                  className={'slot-card' + (allDone ? ' all-done' : '')}
                  style={{ background: slot.bg }}
                  onClick={() => navigate(`/records?slot=${slot.id}`)}
                >
                  <span className="slot-icon">{slot.icon}</span>
                  <span className="slot-text">
                    <span className="slot-label">{slot.label}</span>
                    <span className="slot-meta">
                      {allDone ? '모두 완료 ✓' : `${slotItems.length}개 중 ${doneCount}개 완료`}
                    </span>
                  </span>
                  <span className="slot-thumbs">
                    {cats.slice(0, 3).map((c) => (
                      <span className="slot-thumb" key={c}>
                        <CategoryIcon id={c} size={30} />
                      </span>
                    ))}
                  </span>
                  <span className="slot-chevron" style={{ color: slot.color }}>
                    ›
                  </span>
                </button>
              );
            })}
          </>
        )}

        <button className="btn soft block" style={{ marginTop: 4 }} onClick={() => setAddOpen(true)}>
          + 오늘 할 일 추가
        </button>

        <h3 className="home-section-title">오늘의 한마디</h3>
        <div className="tip-card">
          <Mascot pose="heart" size={46} />
          <div>{tipOfDay(t)}</div>
        </div>
      </div>

      <AddTaskSheet open={addOpen} onClose={() => setAddOpen(false)} date={t} addCustomTask={addCustomTask} />

      <Sheet open={ideaOpen} onClose={() => setIdeaOpen(false)} title="💡 새 아이디어 톡!">
        <div className="field">
          <input
            type="text"
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            placeholder="한 줄이면 충분해요"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && submitIdea()}
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
          source="home"
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
