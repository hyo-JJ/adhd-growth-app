import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

const EMAIL_DOMAIN = 'onulhana.com';

export function usernameToEmail(username) {
  return `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`;
}

function friendlyAuthError(error) {
  const msg = error?.message || '';
  const code = error?.code || error?.error_code || '';
  if (error?.status === 429 || /rate limit/i.test(msg) || /rate_limit/i.test(code)) {
    return '요청이 너무 잦아요. Supabase 프로젝트의 Authentication 설정에서 "Confirm email"을 꺼두면 이 문제가 사라져요. 잠시 후 다시 시도해주세요.';
  }
  if (/already registered|already exists/i.test(msg)) return '이미 사용 중인 아이디예요.';
  if (/invalid login credentials/i.test(msg)) return '아이디 또는 비밀번호가 올바르지 않아요.';
  if (/password.*(least|short)/i.test(msg)) return '비밀번호는 6자 이상으로 만들어주세요.';
  if (/invalid/i.test(msg) && /email/i.test(msg)) return '아이디에 사용할 수 없는 문자가 있어요. 영문/숫자/밑줄만 써주세요.';
  return msg || `문제가 발생했어요${code ? ` (${code})` : ''}. 잠시 후 다시 시도해주세요.`;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user: session?.user || null,
    loading: session === undefined,
    async signUp({ username, nickname, password }) {
      const { data, error } = await supabase.auth.signUp({
        email: usernameToEmail(username),
        password,
        options: { data: { username: username.trim().toLowerCase(), nickname } },
      });
      if (error) throw new Error(friendlyAuthError(error));
      if (!data.session) {
        throw new Error('가입은 됐지만 자동 로그인에 실패했어요. 로그인 탭에서 다시 시도해주세요.');
      }
    },
    async signIn({ username, password }) {
      const { error } = await supabase.auth.signInWithPassword({
        email: usernameToEmail(username),
        password,
      });
      if (error) throw new Error(friendlyAuthError(error));
    },
    async signOut() {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
