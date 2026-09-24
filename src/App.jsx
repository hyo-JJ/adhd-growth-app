import { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { supabaseConfigured } from './lib/supabaseClient';
import NavBar from './components/NavBar';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Goals from './pages/Goals';
import Records from './pages/Records';
import CalendarPage from './pages/CalendarPage';
import My from './pages/My';

function LoadingScreen() {
  return (
    <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>불러오는 중...</div>
    </div>
  );
}

function SetupNeeded() {
  return (
    <div className="app-shell" style={{ justifyContent: 'center' }}>
      <div className="app-main">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Supabase 설정이 필요해요</h2>
          <p className="task-meta">
            프로젝트 루트에 <code>.env</code> 파일을 만들고 <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code> 값을
            채워주세요. <code>supabase/schema.sql</code>을 Supabase SQL Editor에서 실행하면 테이블이 만들어져요.
          </p>
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  return (
    <HashRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/records" element={<Records />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/my" element={<My />} />
        </Routes>
        <NavBar />
      </div>
    </HashRouter>
  );
}

function Gate() {
  const { ready, state } = useStore();
  const [skipOnboarding, setSkipOnboarding] = useState(false);

  if (!ready) return <LoadingScreen />;

  const isEmpty = state.goals.length === 0 && state.routines.length === 0;
  if (isEmpty && !skipOnboarding) {
    return <Onboarding onDone={() => setSkipOnboarding(true)} />;
  }
  return <MainApp />;
}

function AuthGate() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Login />;
  return (
    <StoreProvider>
      <Gate />
    </StoreProvider>
  );
}

function App() {
  if (!supabaseConfigured) return <SetupNeeded />;
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;
