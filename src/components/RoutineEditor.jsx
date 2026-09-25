import { useState } from 'react';
import { CATEGORIES } from '../lib/categories';
import { weekdayLabel } from '../lib/date';
import Sheet from './Sheet';

export function RoutineForm({ initial, onSubmit, lockCategory = false }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [category, setCategory] = useState(initial?.category || 'etc');
  const [days, setDays] = useState(initial?.days || [0, 1, 2, 3, 4, 5, 6]);
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [minAmount, setMinAmount] = useState(initial?.minAmount ?? '');
  const [unit, setUnit] = useState(initial?.unit || '분');
  const [stepsText, setStepsText] = useState((initial?.steps || []).join('\n'));

  function toggleDay(d) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  return (
    <div>
      <div className="field">
        <label>이름</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 영어 공부" autoFocus />
      </div>
      {!lockCategory && (
        <>
          <label>분야</label>
          <div className="chip-row">
            {CATEGORIES.map((c) => (
              <button key={c.id} className={'chip' + (category === c.id ? ' active' : '')} onClick={() => setCategory(c.id)}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </>
      )}
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
      <label>✂ 작은 단계 (선택, 집중 모드에서 보여줘요)</label>
      <textarea
        value={stepsText}
        onChange={(e) => setStepsText(e.target.value)}
        placeholder={'한 줄에 하나씩 적어주세요\n예: 단어장 Day 12 열기\n1~10번 소리 내어 읽기'}
      />
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
            steps: stepsText
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean),
          })
        }
      >
        저장
      </button>
    </div>
  );
}

export default function RoutineSheet({
  open,
  onClose,
  routine,
  addRoutine,
  updateRoutine,
  extraFields,
  newDefaults,
  lockCategory,
  title = routine ? '루틴 수정' : '새 루틴',
}) {
  const isEdit = !!routine;
  return (
    <Sheet open={open} onClose={onClose} title={title} key={(routine?.id || 'new') + '-' + open}>
      <RoutineForm
        initial={routine || newDefaults}
        lockCategory={lockCategory}
        onSubmit={(data) => {
          const payload = extraFields ? { ...data, ...extraFields } : data;
          if (isEdit) updateRoutine(routine.id, payload);
          else addRoutine(payload);
          onClose();
        }}
      />
    </Sheet>
  );
}
