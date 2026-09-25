import { useState } from 'react';
import Mascot from './Mascot';
import { addDays, today, formatKorean } from '../lib/date';

function buildOptions(task, t) {
  const tomorrow = addDays(t, 1);
  const opts = [];
  if (task.estMinutes) {
    const halved = Math.max(15, Math.round(task.estMinutes / 2));
    opts.push({ label: `${halved}분으로 줄여서 오늘`, recommended: true, apply: { date: t, estMinutes: halved } });
  } else {
    opts.push({ label: '오늘로 옮기기', recommended: true, apply: { date: t } });
  }
  opts.push({ label: '내일로 미루기', apply: { date: tomorrow } });
  opts.push({ label: '이번 목표에서 빼기', apply: null });
  return opts;
}

export default function ReschedulePlanner({ tasks, updateCustomTask, deleteCustomTask, onClose }) {
  const t = today();
  const [choices, setChoices] = useState(() => Object.fromEntries(tasks.map((task) => [task.id, 0])));

  function confirm() {
    for (const task of tasks) {
      const opts = buildOptions(task, t);
      const opt = opts[choices[task.id] ?? 0];
      if (!opt.apply) {
        deleteCustomTask(task.id);
      } else {
        updateCustomTask(task.id, { ...opt.apply, carriedFrom: task.carriedFrom || task.date });
      }
    }
    onClose();
  }

  const addedMinutes = tasks.reduce((sum, task) => {
    const opts = buildOptions(task, t);
    const opt = opts[choices[task.id] ?? 0];
    if (opt.apply?.date === t) return sum + (opt.apply.estMinutes ?? task.estMinutes ?? 0);
    return sum;
  }, 0);

  return (
    <div className="focus-overlay">
      <div className="focus-inner">
        <div className="focus-header">
          <button className="link-btn" onClick={onClose}>
            ‹ 오늘
          </button>
          <span style={{ width: 60 }} />
          <span style={{ width: 34 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <Mascot mood="love" size={56} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>괜찮아요! 다시 작게 나눠 볼게요</div>
          </div>
        </div>
        <div className="task-meta" style={{ marginBottom: 20, lineHeight: 1.5 }}>
          못 한 일은 실패가 아니라 다시 계획할 일이에요. 아래에서 오늘의 나에게 맞는 방법을 골라주세요.
        </div>

        {tasks.map((task) => {
          const opts = buildOptions(task, t);
          const selected = choices[task.id] ?? 0;
          return (
            <div className="card" key={task.id}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{task.title}</div>
              <div className="task-meta" style={{ marginBottom: 10 }}>
                원래 {formatKorean(task.date)}
                {task.estMinutes ? ` · ${task.estMinutes}분` : ''}
              </div>
              {opts.map((opt, idx) => (
                <label
                  key={idx}
                  className={'task-row plain'}
                  style={{ cursor: 'pointer', gap: 10 }}
                  onClick={() => setChoices((c) => ({ ...c, [task.id]: idx }))}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: '2px solid ' + (selected === idx ? 'var(--accent)' : 'var(--border)'),
                      background: selected === idx ? 'var(--accent)' : 'transparent',
                      flexShrink: 0,
                    }}
                  />
                  <span className="task-title" style={{ fontWeight: 500 }}>
                    {opt.label}
                  </span>
                  {opt.recommended && <span className="tag">+추천</span>}
                </label>
              ))}
            </div>
          );
        })}

        {addedMinutes > 0 && (
          <div className="task-meta" style={{ textAlign: 'center', marginBottom: 10 }}>
            오늘 할 일에 {addedMinutes}분이 더해져요
          </div>
        )}
        <button className="btn block" onClick={confirm}>
          이렇게 다시 놓아 주세요
        </button>
      </div>
    </div>
  );
}
