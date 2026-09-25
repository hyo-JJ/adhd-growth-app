import { useEffect, useRef, useState } from 'react';
import Mascot from './Mascot';
import { getCategory } from '../lib/categories';

const RADIUS = 92;
const CIRC = 2 * Math.PI * RADIUS;

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FocusMode({ item, onClose, onComplete, onParkIdea }) {
  const totalMinutes = item.unit === '분' && item.target ? item.target : 25;
  const totalSeconds = totalMinutes * 60;
  const [remaining, setRemaining] = useState(totalSeconds);
  const [paused, setPaused] = useState(false);
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

  const cat = getCategory(item.category);
  const remainingFraction = totalSeconds === 0 ? 0 : remaining / totalSeconds;
  const dashoffset = CIRC * (1 - remainingFraction);

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
          <span className="focus-pill">✦ 집중 모드</span>
          <span style={{ width: 34 }} />
        </div>

        <div className="focus-cat">
          <span className="tag">
            {cat.emoji} {cat.label}
          </span>
        </div>
        <div className="focus-title">{item.title}</div>

        <div className="focus-ring-wrap">
          <svg width="220" height="220" viewBox="0 0 220 220">
            <circle cx="110" cy="110" r={RADIUS} fill="none" stroke="var(--surface-2)" strokeWidth="16" />
            <circle
              cx="110"
              cy="110"
              r={RADIUS}
              fill="none"
              stroke="var(--hero-2)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashoffset}
              transform="rotate(-90 110 110)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
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
                <Mascot mood={paused ? 'shy' : 'focus'} size={44} />
                <div style={{ fontSize: 30, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                  {formatClock(remaining)}
                </div>
              </div>
            </foreignObject>
          </svg>
        </div>
        <div className="focus-ring-label">
          {totalMinutes}분 중 {paused ? '잠깐 쉬는 중' : '남은 시간'}
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
