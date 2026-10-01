import { useMemo, useState } from 'react';
import Sheet from './Sheet';
import { buildReviewPrompt } from '../lib/aiPrompt';

const PERIODS = [
  { days: 7, label: '최근 1주' },
  { days: 14, label: '최근 2주' },
  { days: 28, label: '최근 4주' },
];

// 실행 기록을 프롬프트로 만들어, 사용자가 평소 쓰는 AI에게 점검받을 수 있게 내보낸다.
export default function AiReviewSheet({ open, onClose, state }) {
  const [days, setDays] = useState(14);
  const [includeJournal, setIncludeJournal] = useState(true);
  const [concern, setConcern] = useState('');
  const [status, setStatus] = useState(''); // '' | copied | failed

  const prompt = useMemo(
    () => buildReviewPrompt(state, { days, includeJournal, concern }),
    [state, days, includeJournal, concern]
  );
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  function flash(next) {
    setStatus(next);
    setTimeout(() => setStatus(''), 2000);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      flash('copied');
    } catch {
      flash('failed');
    }
  }

  async function share() {
    try {
      await navigator.share({ title: '하나씩 실행 기록 점검', text: prompt });
    } catch {
      // 사용자가 공유를 취소한 경우도 여기로 온다
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="🔍 AI에게 점검받기">
      <div className="task-meta" style={{ marginBottom: 12 }}>
        실행 기록을 정리한 질문을 만들어 드려요. 평소 쓰는 AI(ChatGPT, Claude 등)에 붙여넣으면 잘하고 있는 점과 바꿔볼 점을 알려줘요.
      </div>

      <label style={{ marginTop: 0 }}>기간</label>
      <div className="chip-row">
        {PERIODS.map((p) => (
          <button key={p.days} className={'chip' + (days === p.days ? ' active' : '')} onClick={() => setDays(p.days)}>
            {p.label}
          </button>
        ))}
      </div>

      <label>한 줄 일기</label>
      <div className="chip-row">
        <button className={'chip' + (includeJournal ? ' active' : '')} onClick={() => setIncludeJournal(true)}>
          같이 보내기
        </button>
        <button className={'chip' + (!includeJournal ? ' active' : '')} onClick={() => setIncludeJournal(false)}>
          빼고 보내기
        </button>
      </div>

      <label>특히 궁금한 점 (선택)</label>
      <input
        type="text"
        value={concern}
        onChange={(e) => setConcern(e.target.value)}
        placeholder="예: 운동이 자꾸 밀리는데 어떻게 하면 좋을까?"
        maxLength={200}
      />

      <label>보낼 내용 미리보기</label>
      <pre className="prompt-preview">{prompt}</pre>

      <div style={{ height: 14 }} />
      <button className="btn block" onClick={copy}>
        {status === 'copied' ? '복사됨 ✓ AI 대화창에 붙여넣어 주세요' : status === 'failed' ? '복사에 실패했어요. 다시 눌러주세요' : '복사하기'}
      </button>
      {canShare && (
        <button className="btn secondary block" style={{ marginTop: 8 }} onClick={share}>
          AI 앱으로 내보내기
        </button>
      )}
    </Sheet>
  );
}
