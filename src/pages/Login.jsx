import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export default function Login() {
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!USERNAME_RE.test(username)) return '아이디는 영문/숫자/밑줄(_)만, 3~20자로 만들어주세요.';
    if (password.length < 6) return '비밀번호는 6자 이상으로 만들어주세요.';
    if (mode === 'signup') {
      if (!nickname.trim()) return '닉네임을 입력해주세요.';
      if (password !== password2) return '비밀번호가 서로 달라요.';
    }
    return '';
  }

  async function submit(e) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        await signUp({ username, nickname: nickname.trim(), password });
      } else {
        await signIn({ username, password });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell" style={{ justifyContent: 'center' }}>
      <div className="app-main" style={{ paddingBottom: 40 }}>
        <div style={{ textAlign: 'center', margin: '40px 0 24px' }}>
          <div style={{ fontSize: 40 }}>🌱</div>
          <h1 style={{ margin: '10px 0 4px' }}>오늘 하나</h1>
          <div className="sub">여러 목표를 오늘 하나로 연결하는 성장관리 앱</div>
        </div>

        <div className="chip-row" style={{ marginBottom: 14, justifyContent: 'center' }}>
          <button className={'chip' + (mode === 'signup' ? ' active' : '')} onClick={() => setMode('signup')}>
            회원가입
          </button>
          <button className={'chip' + (mode === 'login' ? ' active' : '')} onClick={() => setMode('login')}>
            로그인
          </button>
        </div>

        <div className="card">
          <form onSubmit={submit}>
            <div className="field">
              <label style={{ marginTop: 0 }}>아이디</label>
              <input
                type="text"
                placeholder="영문/숫자/밑줄, 3~20자"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>

            {mode === 'signup' && (
              <>
                <label>닉네임</label>
                <input
                  type="text"
                  placeholder="앱에서 불릴 이름"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </>
            )}

            <label>비밀번호</label>
            <input
              type="password"
              placeholder="6자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {mode === 'signup' && (
              <>
                <label>비밀번호 확인</label>
                <input
                  type="password"
                  placeholder="비밀번호를 한 번 더"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                />
              </>
            )}

            {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 10 }}>{error}</div>}
            <div style={{ height: 16 }} />
            <button className="btn block" type="submit" disabled={loading}>
              {loading ? '처리 중...' : mode === 'signup' ? '가입하고 시작하기' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
