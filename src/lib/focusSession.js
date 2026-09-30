import { today } from './date';

// 화면이 꺼지거나 앱이 종료돼도 집중 타이머를 이어갈 수 있게 폰에 저장해 둬요
const KEY = 'focus-session';

export function loadFocusSession() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (!s || s.date !== today()) return null;
    return s;
  } catch {
    return null;
  }
}

export function saveFocusSession(session) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...session, date: today() }));
  } catch {
    // 저장 공간을 못 쓰는 환경이면 그냥 넘어가요
  }
}

export function clearFocusSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
