import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await sendMagicLink(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message || '메일 전송에 실패했어요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell" style={{ justifyContent: 'center' }}>
      <div className="app-main" style={{ paddingBottom: 40 }}>
        <div style={{ textAlign: 'center', margin: '40px 0 30px' }}>
          <div style={{ fontSize: 40 }}>🌱</div>
          <h1 style={{ margin: '10px 0 4px' }}>오늘 하나</h1>
          <div className="sub">여러 목표를 오늘 하나로 연결하는 성장관리 앱</div>
        </div>

        <div className="card">
          {sent ? (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📬</div>
              <h3>메일함을 확인해주세요</h3>
              <div className="task-meta">
                <strong>{email}</strong> 로 로그인 링크를 보냈어요. 메일의 링크를 누르면 바로 로그인돼요.
              </div>
              <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => setSent(false)}>
                다른 이메일로 다시 받기
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <label style={{ marginTop: 0 }}>이메일</label>
              <input
                type="text"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>{error}</div>}
              <div style={{ height: 14 }} />
              <button className="btn block" type="submit" disabled={loading}>
                {loading ? '전송 중...' : '로그인 링크 받기'}
              </button>
              <div className="task-meta" style={{ marginTop: 10, textAlign: 'center' }}>
                비밀번호 없이, 메일로 받은 링크만 누르면 로그인돼요.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
