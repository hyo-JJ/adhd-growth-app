import { NavLink } from 'react-router-dom';

const ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const ICONS = {
  records: (
    <svg {...ICON_PROPS}>
      <rect x="5" y="4" width="14" height="17" rx="3" />
      <path d="M9 4.5V3h6v1.5M9 10h6M9 14h4" />
    </svg>
  ),
  goals: (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </svg>
  ),
  home: (
    <svg {...ICON_PROPS} width={26} height={26} strokeWidth={2.2}>
      <path d="M4 11.5 12 5l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-3.5v-5h-6v5H5.5A1.5 1.5 0 0 1 4 19z" />
    </svg>
  ),
  calendar: (
    <svg {...ICON_PROPS}>
      <rect x="4" y="5.5" width="16" height="15" rx="3" />
      <path d="M8 3.5v4M16 3.5v4M4 10.5h16M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01" />
    </svg>
  ),
  my: (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20.5c1.2-3.6 4-5.3 7.5-5.3s6.3 1.7 7.5 5.3" />
    </svg>
  ),
};

const items = [
  { to: '/records', label: '기록', icon: 'records' },
  { to: '/goals', label: '목표', icon: 'goals' },
  { to: '/', label: '홈', icon: 'home', end: true, center: true },
  { to: '/calendar', label: '캘린더', icon: 'calendar' },
  { to: '/my', label: 'MY', icon: 'my' },
];

export default function NavBar() {
  return (
    <nav className="bottom-nav">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          aria-label={it.label}
          className={({ isActive }) => 'nav-item' + (it.center ? ' center' : '') + (isActive ? ' active' : '')}
        >
          <span className="nav-icon">{ICONS[it.icon]}</span>
          {!it.center && <span>{it.label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}
