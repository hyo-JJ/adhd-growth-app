import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: '홈', icon: '🏠', end: true },
  { to: '/goals', label: '목표', icon: '🎯' },
  { to: '/records', label: '기록', icon: '📝' },
  { to: '/calendar', label: '캘린더', icon: '📅' },
  { to: '/my', label: 'MY', icon: '⚙️' },
];

export default function NavBar() {
  return (
    <nav className="bottom-nav">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
        >
          <span className="nav-icon">{it.icon}</span>
          <span>{it.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
