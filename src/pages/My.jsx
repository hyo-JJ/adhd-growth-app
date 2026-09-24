import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { getCategory, CATEGORIES } from '../lib/categories';
import { weekdayLabel } from '../lib/date';
import Sheet from '../components/Sheet';

const STAGES = [
  { id: 'idea', label: '아이디어' },
  { id: 'todo', label: '할 일' },
  { id: 'doing', label: '진행중' },
  { id: 'done', label: '완료' },
];

const IDEA_STAGES = [
  { id: 'idea', label: '아이디어' },
  { id: 'shooting_plan', label: '촬영 예정' },
  { id: 'shooting', label: '촬영' },
  { id: 'editing', label: '편집' },
  { id: 'uploaded', label: '업로드' },
];

export default function My() {
  const store = useStore();
  const { state, setNickname, addRoutine, updateRoutine, deleteRoutine, resetAllData } = store;
  const { user, signOut } = useAuth();

  const [nick, setNick] = useState(state.nickname);
  const [routineSheet, setRoutineSheet] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);

  return (
    <>
      <div className="topbar">
        <h1>MY</h1>
        <div className="sub">루틴 · 학습 · 프로젝트 관리</div>
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

        <VocabSection store={store} />
        <ProjectSection store={store} />
        <IdeaSection store={store} />

        <div className="card">
          <h3 style={{ marginTop: 0 }}>계정</h3>
          <div className="task-meta" style={{ marginBottom: 10 }}>{user?.email}</div>
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
        const cat = getCategory(r.category);
        return (
          <div className="task-row" key={r.id}>
            <div className="task-title" onClick={() => onEdit(r)} style={{ cursor: 'pointer' }}>
              {cat.emoji} {r.title}
              <div className="task-meta">
                {r.days.length === 7 ? '매일' : r.days.map(weekdayLabel).join(',')} · {r.amount}{r.unit}
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

function RoutineSheet({ open, onClose, routine, addRoutine, updateRoutine }) {
  const isEdit = !!routine;

  return (
    <Sheet open={open} onClose={onClose} title={isEdit ? '루틴 수정' : '새 루틴'} key={(routine?.id || 'new') + '-' + open}>
      <RoutineForm
        initial={routine}
        onSubmit={(data) => {
          if (isEdit) updateRoutine(routine.id, data);
          else addRoutine(data);
          onClose();
        }}
      />
    </Sheet>
  );
}

function RoutineForm({ initial, onSubmit }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [category, setCategory] = useState(initial?.category || 'etc');
  const [days, setDays] = useState(initial?.days || [0, 1, 2, 3, 4, 5, 6]);
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [minAmount, setMinAmount] = useState(initial?.minAmount ?? '');
  const [unit, setUnit] = useState(initial?.unit || '분');

  function toggleDay(d) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  return (
    <div>
      <div className="field">
        <label>루틴 이름</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 일본어 공부" autoFocus />
      </div>
      <label>분야</label>
      <div className="chip-row">
        {CATEGORIES.map((c) => (
          <button key={c.id} className={'chip' + (category === c.id ? ' active' : '')} onClick={() => setCategory(c.id)}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>
      <label>반복 요일</label>
      <div className="day-pill-row">
        {[0, 1, 2, 3, 4, 5, 6].map((d) => (
          <button key={d} className={'day-pill' + (days.includes(d) ? ' active' : '')} onClick={() => toggleDay(d)}>
            {weekdayLabel(d)}
          </button>
        ))}
      </div>
      <div className="row">
        <div>
          <label>목표량</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="30" />
        </div>
        <div>
          <label>단위</label>
          <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="분/회/L" />
        </div>
      </div>
      <label>최소 루틴 목표량 (선택, "오늘 너무 바빠"용)</label>
      <input type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} placeholder="10" />
      <div style={{ height: 16 }} />
      <button
        className="btn block"
        onClick={() =>
          title.trim() &&
          onSubmit({
            title: title.trim(),
            category,
            days,
            amount: Number(amount) || 0,
            minAmount: minAmount === '' ? null : Number(minAmount),
            unit,
          })
        }
      >
        저장
      </button>
    </div>
  );
}

function VocabSection({ store }) {
  const { state, addVocab, updateVocab, deleteVocab } = store;
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');

  function submit() {
    if (!word.trim() || !meaning.trim()) return;
    addVocab({ word: word.trim(), meaning: meaning.trim() });
    setWord('');
    setMeaning('');
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>🇯🇵 일본어 단어장</h3>
        <button className="link-btn" onClick={() => setOpen((o) => !o)}>{open ? '접기' : '펼치기'}</button>
      </div>
      {open && (
        <>
          <div className="row" style={{ marginTop: 10 }}>
            <input type="text" placeholder="단어" value={word} onChange={(e) => setWord(e.target.value)} />
            <input type="text" placeholder="뜻" value={meaning} onChange={(e) => setMeaning(e.target.value)} />
            <button className="btn" style={{ flex: '0 0 auto' }} onClick={submit}>추가</button>
          </div>
          {state.vocab.length === 0 && <div className="empty-state">단어를 추가해보세요.</div>}
          {state.vocab.map((v) => (
            <div className="task-row" key={v.id}>
              <div className="task-title">
                {v.word} <span className="task-meta">— {v.meaning}</span>
              </div>
              <button
                className={'chip' + (v.wrong ? ' active' : '')}
                style={{ fontSize: 11, padding: '5px 10px' }}
                onClick={() => updateVocab(v.id, { wrong: !v.wrong })}
              >
                오답
              </button>
              <button className="icon-btn" style={{ width: 26, height: 26, fontSize: 12 }} onClick={() => deleteVocab(v.id)}>✕</button>
            </div>
          ))}
        </>
      )}
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
            <input type="text" placeholder="예: SAI" value={name} onChange={(e) => setName(e.target.value)} />
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

function IdeaSection({ store }) {
  const { state, addIdea, updateIdea, deleteIdea } = store;
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');

  function submit() {
    if (!content.trim()) return;
    addIdea({ title: content.trim() });
    setContent('');
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>💡 아이디어 보관함</h3>
        <button className="link-btn" onClick={() => setOpen((o) => !o)}>{open ? '접기' : '펼치기'}</button>
      </div>
      {open && (
        <>
          <div className="row" style={{ marginTop: 10 }}>
            <input type="text" placeholder="떠오른 생각을 적어보세요" value={content} onChange={(e) => setContent(e.target.value)} />
            <button className="btn" style={{ flex: '0 0 auto' }} onClick={submit}>저장</button>
          </div>
          {state.ideas.length === 0 && <div className="empty-state">아이디어를 저장해보세요.</div>}
          {state.ideas.map((i) => (
            <div className="task-row" key={i.id}>
              <div className="task-title">{i.title}</div>
              <select value={i.status} onChange={(e) => updateIdea(i.id, { status: e.target.value })} style={{ width: 110 }}>
                {IDEA_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <button className="icon-btn" style={{ width: 26, height: 26, fontSize: 12 }} onClick={() => deleteIdea(i.id)}>✕</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
