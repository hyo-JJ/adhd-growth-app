import { useState } from 'react';
import { CATEGORIES } from '../lib/categories';
import Sheet from './Sheet';

// 홈/기록 탭에서 같이 쓰는 "할 일 추가" 시트
export default function AddTaskSheet({ open, onClose, date, addCustomTask, defaultTime = '' }) {
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('etc');
  const [newMinutes, setNewMinutes] = useState('');
  const [newTime, setNewTime] = useState(defaultTime);
  const [newRequired, setNewRequired] = useState(true);

  function submitAdd() {
    if (!newTitle.trim()) return;
    addCustomTask({
      title: newTitle.trim(),
      category: newCategory,
      date,
      estMinutes: newMinutes ? Number(newMinutes) : null,
      time: newTime,
      required: newRequired,
    });
    setNewTitle('');
    setNewMinutes('');
    setNewTime(defaultTime);
    setNewRequired(true);
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="할 일 추가">
      <div className="field">
        <label>할 일</label>
        <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="예: 세탁기 돌리기" autoFocus />
      </div>
      <label>카테고리</label>
      <div className="chip-row">
        {CATEGORIES.map((cat) => (
          <button key={cat.id} className={'chip' + (newCategory === cat.id ? ' active' : '')} onClick={() => setNewCategory(cat.id)}>
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
      <label>시간 (선택 · 아침/점심/저녁 구분에 쓰여요)</label>
      <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
      <label>예상 시간 (분, 선택)</label>
      <input type="number" value={newMinutes} onChange={(e) => setNewMinutes(e.target.value)} placeholder="예: 60" />
      <div style={{ height: 16 }} />
      <button className="btn block" onClick={submitAdd}>
        추가하기
      </button>
    </Sheet>
  );
}
