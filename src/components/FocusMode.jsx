import { useEffect, useState } from 'react';
import Mascot from './Mascot';
import { getCategory } from '../lib/categories';
import { loadFocusSession, saveFocusSession, clearFocusSession } from '../lib/focusSession';

const RADIUS = 92;
const CIRC = 2 * Math.PI * RADIUS;

const POMO_WORK = 25 * 60;
const POMO_SHORT = 5 * 60;
const POMO_LONG = 15 * 60;
const POMO_CYCLES = 4;
const PHASE_SECONDS = { work: POMO_WORK, short: POMO_SHORT, long: POMO_LONG };

const PHASE_LABEL = { work: '집중 시간', short: '짧은 휴식', long: '긴 휴식' };
const PHASE_POSE = { work: 'reading', short: 'lying', long: 'heart' };

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// 멈춰 있으면 left(남은 초)를, 돌아가는 중이면 endAt(끝나는 시각)을 기준으로 계산해요.
// 시각 기준이라 화면이 꺼져 있던 동안에도 시간이 제대로 흘러가요.
function isRunning(timer) {
  return timer.started && !timer.paused;
}

function remainingOf(timer, now) {
  if (!isRunning(timer)) return timer.left;
  return Math.max(0, Math.ceil((timer.endAt - now) / 1000));
}

// 포모도로: 화면이 꺼진 사이 여러 구간이 지났을 수도 있으니 현재 시각까지 따라잡아요
function advancePomodoro(timer, now) {
  if (!timer.pomodoro || !isRunning(timer) || timer.endAt > now) return timer;
  let { phase, cycle, endAt } = timer;
  while (endAt <= now) {
    if (phase === 'work') {
      cycle += 1;
      phase = cycle >= POMO_CYCLES ? 'long' : 'short';
    } else {
      if (phase === 'long') cycle = 0;
      phase = 'work';
    }
    endAt += PHASE_SECONDS[phase] * 1000;
  }
  return { ...timer, phase, cycle, endAt };
}

export default function FocusMode({ item, source, onClose, onComplete, onParkIdea }) {
  const rawTarget = item.target ?? item.amount;
  const totalMinutes = item.unit === '분' && rawTarget ? rawTarget : 25;
  const totalSeconds = totalMinutes * 60;

  const [saved] = useState(() => {
    const s = loadFocusSession();
    return s && s.source === source && s.item?.id === item.id ? s : null;
  });
  const [timer, setTimer] = useState(
    () =>
      saved?.timer ?? {
        started: false,
        paused: false,
        pomodoro: false,
        phase: 'work',
        cycle: 0,
        left: totalSeconds,
        endAt: null,
      },
  );
  const [now, setNow] = useState(() => Date.now());
  const [stepDone, setStepDone] = useState(() => saved?.stepDone ?? (item.steps || []).map(() => false));
  const [ideaText, setIdeaText] = useState('');
  const [parkedCount, setParkedCount] = useState(saved?.parkedCount ?? 0);
  const [savedFlash, setSavedFlash] = useState(false);

  const { started, paused, pomodoro, phase, cycle } = timer;
  const running = isRunning(timer);
  const remaining = remainingOf(timer, now);

  useEffect(() => {
    if (!running) return;
    const sync = () => {
      const t = Date.now();
      setNow(t);
      setTimer((prev) => advancePomodoro(prev, t));
    };
    sync();
    const id = setInterval(sync, 500);
    // 화면을 다시 켰을 때 바로 맞춰요
    document.addEventListener('visibilitychange', sync);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [running]);

  useEffect(() => {
    saveFocusSession({ source, item, timer, stepDone, parkedCount });
  }, [source, item, timer, stepDone, parkedCount]);

  function start() {
    setTimer((t) => ({ ...t, started: true, paused: false, endAt: Date.now() + t.left * 1000 }));
  }

  function togglePause() {
    setTimer((t) =>
      t.paused
        ? { ...t, paused: false, endAt: Date.now() + t.left * 1000 }
        : { ...t, paused: true, left: remainingOf(t, Date.now()), endAt: null },
    );
  }

  function togglePomodoro() {
    setTimer((t) => {
      const secs = t.pomodoro ? totalSeconds : POMO_WORK;
      const next = { ...t, pomodoro: !t.pomodoro, paused: false, phase: 'work', cycle: 0, left: secs };
      return isRunning(next) ? { ...next, endAt: Date.now() + secs * 1000 } : next;
    });
  }

  const cat = getCategory(item.category);
  const phaseSeconds = pomodoro ? PHASE_SECONDS[phase] : totalSeconds;
  const remainingFraction = phaseSeconds === 0 ? 0 : remaining / phaseSeconds;
  const dashoffset = CIRC * (1 - remainingFraction);
  const ringColor = !pomodoro || phase === 'work' ? 'var(--hero-2)' : 'var(--success)';
  const mascotPose = !started ? 'wave' : paused ? 'lying' : pomodoro ? PHASE_POSE[phase] : 'reading';

  const currentStepIndex = stepDone.findIndex((d) => !d);

  function toggleStep(idx) {
    setStepDone((prev) => prev.map((d, i) => (i === idx ? !d : d)));
  }

  function submitIdea() {
    if (!ideaText.trim()) return;
    onParkIdea(ideaText.trim());
    setIdeaText('');
    setParkedCount((n) => n + 1);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function close() {
    clearFocusSession();
    onClose();
  }

  function finish() {
    clearFocusSession();
    onComplete();
    onClose();
  }

  return (
    <div className="focus-overlay">
      <div className="focus-inner">
        <div className="focus-header">
          <button className="icon-btn" onClick={close} aria-label="닫기">
            ✕
          </button>
          <span className="focus-pill">✦ {pomodoro ? `🍅 ${PHASE_LABEL[phase]}` : '집중 모드'}</span>
          <span style={{ width: 34 }} />
        </div>

        <div className="focus-cat">
          <span className="tag">
            {cat.emoji} {cat.label}
          </span>
        </div>
        <div className="focus-title">{item.title}</div>

        <div className="busy-row" style={{ marginBottom: 16 }}>
          <div className="busy-icon">🍅</div>
          <div className="busy-text">
            <div className="busy-title">포모도로 모드</div>
            <div className="busy-sub">25분 집중 + 5분 휴식을 4번, 그 다음 긴 휴식</div>
          </div>
          <button className={'switch' + (pomodoro ? ' on' : '')} onClick={togglePomodoro}>
            <span className="knob" />
          </button>
        </div>

        {pomodoro && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 14 }}>
            {Array.from({ length: POMO_CYCLES }, (_, i) => (
              <span
                key={i}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: i < cycle ? 'var(--hero-2)' : 'var(--surface-3)',
                  boxShadow: i === cycle && phase === 'work' ? '0 0 0 2px var(--hero-2)' : 'none',
                }}
              />
            ))}
          </div>
        )}

        <div className="focus-ring-wrap">
          <svg width="220" height="220" viewBox="0 0 220 220">
            <circle cx="110" cy="110" r={RADIUS} fill="none" stroke="var(--surface-2)" strokeWidth="16" />
            <circle
              cx="110"
              cy="110"
              r={RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashoffset}
              transform="rotate(-90 110 110)"
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
            />
            <foreignObject x="35" y="35" width="150" height="150">
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <Mascot pose={mascotPose} size={44} />
                <div style={{ fontSize: 30, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                  {formatClock(remaining)}
                </div>
              </div>
            </foreignObject>
          </svg>
        </div>
        <div className="focus-ring-label">
          {!started
            ? '준비되면 시작을 눌러요'
            : pomodoro
            ? `${PHASE_LABEL[phase]} · ${paused ? '잠깐 쉬는 중' : `${Math.ceil(phaseSeconds / 60)}분 중 남은 시간`}`
            : `${totalMinutes}분 중 ${paused ? '잠깐 쉬는 중' : '남은 시간'}`}
        </div>

        {item.steps && item.steps.length > 0 && (
          <div className="focus-steps">
            <div className="section-title" style={{ margin: '0 0 10px' }}>
              작은 단계로 나눴어요
            </div>
            {item.steps.map((step, idx) => {
              const done = stepDone[idx];
              const isCurrent = idx === currentStepIndex;
              return (
                <div
                  className={'focus-step' + (done ? ' done' : '') + (isCurrent ? ' current' : '')}
                  key={idx}
                  onClick={() => toggleStep(idx)}
                >
                  <span className={'step-num' + (done ? ' done' : '')}>{done ? '✓' : idx + 1}</span>
                  <span className="step-text">{step}</span>
                  {isCurrent && <span className="now-badge">지금!</span>}
                </div>
              );
            })}
          </div>
        )}

        <div className="idea-park">
          <div className="title">💡 딴생각 잠깐 맡겨 두기</div>
          <div className="row">
            <input
              type="text"
              placeholder="예: 저녁 뭐 먹지"
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitIdea()}
            />
            <button className="btn" style={{ flex: '0 0 auto' }} onClick={submitIdea}>
              {savedFlash ? '맡겼어요 ✓' : '맡기기'}
            </button>
          </div>
          <div className="idea-park-note">아이디어 보관함에 넣어 둘게요 {parkedCount > 0 && `· 오늘 ${parkedCount}개 맡김`}</div>
        </div>

        <div className="focus-footer">
          {started ? (
            <>
              <button className="btn secondary" style={{ flex: 1 }} onClick={togglePause}>
                {paused ? '다시 시작' : '잠깐 쉬기'}
              </button>
              <button className="btn" style={{ flex: 1.4 }} onClick={finish}>
                ✓ 여기까지 했어요!
              </button>
            </>
          ) : (
            <button className="btn" style={{ flex: 1 }} onClick={start}>
              ▶ 시작하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
