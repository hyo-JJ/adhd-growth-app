import { useRegisterSW } from 'virtual:pwa-register/react';

const CHECK_INTERVAL = 30 * 60 * 1000;

// 새 버전이 배포되면 새로고침 안내를 띄워요
export default function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        if (navigator.onLine) registration.update();
      };
      // 홈 화면 앱은 오래 켜 두는 경우가 많아서, 주기적으로 + 다시 열 때마다 확인
      setInterval(check, CHECK_INTERVAL);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="update-banner" role="status">
      <span>새 버전이 나왔어요 ✨</span>
      <button className="btn ghost" onClick={() => setNeedRefresh(false)}>
        나중에
      </button>
      <button className="btn" onClick={() => updateServiceWorker(true)}>
        새로고침
      </button>
    </div>
  );
}
