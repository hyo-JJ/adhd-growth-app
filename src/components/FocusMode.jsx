import { useEffect, useRef, useState } from 'react';
import Mascot from './Mascot';
import { getCategory } from '../lib/categories';

const RADIUS = 92;
const CIRC = 2 * Math.PI * RADIUS;

const POMO_WORK = 25 * 60;
const POMO_SHORT = 5 * 60;
const POMO_LONG = 15 * 60;
const POMO_CYCLES = 4;

const PHASE_LABEL = { work: '집중 시간', short: '짧은 휴식', long: '긴 휴식' };
const PHASE_MOOD = { work: 'focus', short: 'shy', long: 'happy' };

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FocusMode({ item, onClose, onComplete, onParkIdea }) {
  const rawTarget = item.target ?? item.amount;
  const totalMinutes = item.unit === '분' && rawTarget ? rawTarget : 25;
  const totalSeconds = totalMinutes * 60;

  const [remaining, setRemaining] = useState(totalSeconds);
  const [paused, setPaused] = useState(false);
  const [pomodoro, setPomodoro] = useState(false);
  const [phase, setPhase] = useState('work');
  const [cycle, setCycle] = useState(0);
  const [stepDone, setStepDone] = useState(() => (item.steps || []).map(() => false));
  const [ideaText, setIdeaText] = useState('');
  const [parkedCount, setParkedCount] = useState(0);
  const [savedFlash, setSavedFlash] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [paused]);

  // auto-advance through pomodoro work/break phases when the clock hits zero
  useEffect(() => {
    if (!pomodoro || remaining !== 0) return;
    if (phase === 'work') {
      const nextCycle = cycle + 1;
      setCycle(nextCycle);
      if (nextCycle >= POMO_CYCLES) {
        setPhase('long');
        setRemaining(POMO_LONG);
      } else {
        setPhase('short');
        setRemaining(POMO_SHORT);
      }
    } else {
      if (phase === 'long') setCycle(0);
      setPhase('work');
      setRemaining(POMO_WORK);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, pomodoro]);

  function togglePomodoro() {
    setPomodoro((prev) => {
      const next = !prev;
      setPaused(false);
      if (next) {
        setPhase('work');
        setCycle(0);
        setRemaining(POMO_WORK);
      } else {
        setRemaining(totalSeconds);
      }
      return next;
    });
  }

  const cat = getCategory(item.category);
  const phaseSeconds = pomodoro ? (phase === 'work' ? POMO_WORK : phase === 'short' ? POMO_SHORT : POMO_LONG) : totalSeconds;
  const remainingFraction = phaseSeconds === 0 ? 0 : remaining / phaseSeconds;
  const dashoffset = CIRC * (1 - remainingFraction);
  const ringColor = !pomodoro || phase === 'work' ? 'var(--hero-2)' : 'var(--success)';
  const mascotMood = paused ? 'shy' : pomodoro ? PHASE_MOOD[phase] : 'focus';

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

  function finish() {
    onComplete();
    onClose();
  }

  return (
    <div className="focus-overlay">
      <div className="focus-inner">
        <div className="focus-header">
          <button className="icon-btn" onClick={onClose} aria-label="닫기">
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
                <Mascot mood={mascotMood} size={44} />
                <div style={{ fontSize: 30, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                  {formatClock(remaining)}
                </div>
              </div>
            </foreignObject>
          </svg>
        </div>
        <div className="focus-ring-label">
          {pomodoro
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
              placeholder="예: 쇼츠 썸네일 아이디어"
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
          <button className="btn secondary" style={{ flex: 1 }} onClick={() => setPaused((p) => !p)}>
            {paused ? '다시 시작' : '잠깐 쉬기'}
          </button>
          <button className="btn" style={{ flex: 1.4 }} onClick={finish}>
            ✓ 여기까지 했어요!
          </button>
        </div>
      </div>
    </div>
  );
}
