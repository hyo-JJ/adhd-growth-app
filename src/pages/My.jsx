import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { weekdayLabel } from '../lib/date';
import RoutineSheet from '../components/RoutineEditor';
import CategoryIcon from '../components/CategoryIcon';

const STAGES = [
  { id: 'idea', label: '아이디어' },
  { id: 'todo', label: '할 일' },
  { id: 'doing', label: '진행중' },
  { id: 'done', label: '완료' },
];

const IDEA_STAGES = [
  { id: 'idea', label: '아이디어' },
  { id: 'doing', label: '진행중' },
  { id: 'done', label: '완료' },
];

export default function My() {
  const store = useStore();
  const { state, setNickname, setDailyMaxTasks, addRoutine, updateRoutine, deleteRoutine, resetAllData } = store;
  const { user, signOut } = useAuth();

  const [nick, setNick] = useState(state.nickname);
  const [maxTasks, setMaxTasks] = useState(state.dailyMaxTasks ?? '');
  const [routineSheet, setRoutineSheet] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);

  return (
    <>
      <div className="topbar">
        <h1>MY</h1>
        <div className="sub">루틴 · 계획 · 프로젝트 관리</div>
      </div>
      <div className="app-main" style={{ paddingTop: 4 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>프로필</h3>
          <div className="row">
            <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} />
            <button className="btn secondary" style={{ flex: '0 0 auto' }} onClick={() => setNickname(nick)}>
              저장
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>🤖 AI와 계획 다시 짜기</h3>
          <div className="task-meta" style={{ marginBottom: 10 }}>
            계획대로 잘 안 되고 있다면, 최근 2주 실행 기록을 AI에게 보여주고 같이 조정해봐요.
          </div>
          <Link to="/plan" className="btn block" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            실행 기록으로 계획 조정하기
          </Link>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>하루 최대 할 일 수</h3>
          <div className="task-meta" style={{ marginBottom: 10 }}>
            오늘 할 일이 이 숫자보다 많으면 홈에서 알려드려요. 비워두면 제한 없어요.
          </div>
          <div className="row">
            <input type="number" min="1" placeholder="예: 5" value={maxTasks} onChange={(e) => setMaxTasks(e.target.value)} />
            <button
              className="btn secondary"
              style={{ flex: '0 0 auto' }}
              onClick={() => setDailyMaxTasks(Number(maxTasks) > 0 ? Math.round(Number(maxTasks)) : null)}
            >
              저장
            </button>
          </div>
        </div>

        <RoutineSection
          state={state}
          onAdd={() => {
            setEditingRoutine(null);
            setRoutineSheet(true);
          }}
          onEdit={(r) => {
            setEditingRoutine(r);
            setRoutineSheet(true);
          }}
          deleteRoutine={deleteRoutine}
        />

        <ProjectSection store={store} />
        <IdeaSection store={store} />

        <div className="card">
          <h3 style={{ marginTop: 0 }}>계정</h3>
          <div className="task-meta" style={{ marginBottom: 10 }}>
            아이디: {user?.user_metadata?.username || '-'}
          </div>
          <button className="btn secondary block" onClick={() => signOut()}>
            로그아웃
          </button>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>데이터</h3>
          <button
            className="btn danger block"
            onClick={() => {
              if (confirm('모든 데이터를 초기화할까요? 되돌릴 수 없어요.')) resetAllData();
            }}
          >
            전체 데이터 초기화
          </button>
        </div>
      </div>

      <RoutineSheet
        open={routineSheet}
        onClose={() => setRoutineSheet(false)}
        routine={editingRoutine}
        addRoutine={addRoutine}
        updateRoutine={updateRoutine}
      />
    </>
  );
}

function RoutineSection({ state, onAdd, onEdit, deleteRoutine }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>🔁 반복 루틴</h3>
        <button className="link-btn" onClick={onAdd}>+ 추가</button>
      </div>
      {state.routines.length === 0 && <div className="empty-state">등록된 루틴이 없어요.</div>}
      {state.routines.map((r) => {
        return (
          <div className="task-row plain" key={r.id}>
            <CategoryIcon id={r.category} />
            <div className="task-title" onClick={() => onEdit(r)} style={{ cursor: 'pointer' }}>
              {r.title}
              <div className="task-meta">
                {r.days.length === 7 ? '매일' : r.days.map(weekdayLabel).join(',')}
                {r.time && ` ${r.time}`} · {r.amount}{r.unit}
                {r.minAmount != null && ` (최소 ${r.minAmount}${r.unit})`}
              </div>
            </div>
            <button className="icon-btn" onClick={() => deleteRoutine(r.id)}>🗑</button>
          </div>
        );
      })}
    </div>
  );
}

function ProjectSection({ store }) {
  const { state, addProject, updateProject, deleteProject } = store;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  function submit() {
    if (!name.trim()) return;
    addProject({ name: name.trim() });
    setName('');
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>📁 프로젝트</h3>
        <button className="link-btn" onClick={() => setOpen((o) => !o)}>{open ? '접기' : '펼치기'}</button>
      </div>
      {open && (
        <>
          <div className="row" style={{ marginTop: 10 }}>
            <input type="text" placeholder="예: 포트폴리오 사이트" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn" style={{ flex: '0 0 auto' }} onClick={submit}>추가</button>
          </div>
          {state.projects.length === 0 && <div className="empty-state">프로젝트를 추가해보세요.</div>}
          {state.projects.map((p) => (
            <div className="task-row" key={p.id}>
              <div className="task-title">{p.name}</div>
              <select value={p.stage} onChange={(e) => updateProject(p.id, { stage: e.target.value })} style={{ width: 100 }}>
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <button className="icon-btn" style={{ width: 26, height: 26, fontSize: 12 }} onClick={() => deleteProject(p.id)}>✕</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

const TAG_SUGGESTIONS = ['#아이디어', '#할일', '#나중에'];
const STALE_DAYS = 7;

function daysSince(dateStr) {
  if (!dateStr) return 0;
  const then = new Date(dateStr).setHours(0, 0, 0, 0);
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.round((now - then) / 86400000);
}

function IdeaSection({ store }) {
  const { state, addIdea, updateIdea, deleteIdea } = store;
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [pendingTag, setPendingTag] = useState('');
  const [activeStage, setActiveStage] = useState('idea');

  function submit() {
    if (!content.trim()) return;
    addIdea({ title: content.trim(), tag: pendingTag });
    setContent('');
    setPendingTag('');
  }

  function advance(idea) {
    const idx = IDEA_STAGES.findIndex((s) => s.id === idea.status);
    if (idx === -1 || idx === IDEA_STAGES.length - 1) return;
    updateIdea(idea.id, { status: IDEA_STAGES[idx + 1].id });
  }

  const counts = Object.fromEntries(IDEA_STAGES.map((s) => [s.id, state.ideas.filter((i) => i.status === s.id).length]));
  const shown = state.ideas.filter((i) => i.status === activeStage);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>💡 아이디어 보관함</h3>
        <button className="link-btn" onClick={() => setOpen((o) => !o)}>{open ? '접기' : '펼치기'}</button>
      </div>
      {open && (
        <>
          <div className="row" style={{ marginTop: 10 }}>
            <input
              type="text"
              placeholder="한 줄이면 충분해요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            <button className="btn" style={{ flex: '0 0 auto' }} onClick={submit}>저장</button>
          </div>
          <div className="chip-row" style={{ marginTop: 10 }}>
            {TAG_SUGGESTIONS.map((tg) => (
              <button
                key={tg}
                className={'chip' + (pendingTag === tg ? ' active' : '')}
                onClick={() => setPendingTag((p) => (p === tg ? '' : tg))}
              >
                {tg}
              </button>
            ))}
          </div>

          <div className="chip-row" style={{ marginTop: 16 }}>
            {IDEA_STAGES.map((s) => (
              <button
                key={s.id}
                className={'chip' + (activeStage === s.id ? ' active' : '')}
                onClick={() => setActiveStage(s.id)}
              >
                {s.label} {counts[s.id]}
              </button>
            ))}
          </div>

          {shown.length === 0 && <div className="empty-state">아직 이 단계엔 아이디어가 없어요.</div>}
          <div className="idea-grid">
            {shown.map((i) => {
              const stale = i.status !== 'done' && daysSince(i.createdAt) >= STALE_DAYS;
              return (
                <div className="idea-card" key={i.id}>
                  <button className="del-btn" onClick={() => deleteIdea(i.id)} aria-label="삭제">✕</button>
                  {i.capturedInFocus && <span className="badge focus">집중 중에 맡김</span>}
                  {stale && <span className="badge stale">{daysSince(i.createdAt)}일째 쉬는 중</span>}
                  <div className="idea-title">{i.title}</div>
                  <div className="idea-meta">
                    {i.tag && `${i.tag} · `}
                    {i.createdAt ? new Date(i.createdAt).toISOString().slice(5, 10).replace('-', '월 ') + '일' : ''}
                  </div>
                  {i.status !== 'done' && (
                    <button className="arrow-btn" onClick={() => advance(i)} aria-label="다음 단계로">
                      →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
