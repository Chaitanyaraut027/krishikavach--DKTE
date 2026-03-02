import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

// ── Sun / Moon SVG icons ─────────────────────────────────────────────────
const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);
const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

// ── Toggle pill component ─────────────────────────────────────────────────
const ThemeToggle = ({ isDark, onToggle }) => (
  <button
    onClick={onToggle}
    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    className="kk-theme-toggle"
    aria-label="Toggle theme"
  >
    <span style={{ fontSize: 13 }}>{isDark ? '☀️' : '🌙'}</span>
    <span className={`kk-toggle-track ${isDark ? 'dark-on' : 'light-on'}`}>
      <span className="kk-toggle-thumb" />
    </span>
    <span style={{ fontSize: 11 }}>{isDark ? 'Light' : 'Dark'}</span>
  </button>
);

// ════════════════════════════════════════════════════════════════════════════
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!user) return [];
    if (user.role === 'farmer') return [
      { path: '/farmer', label: 'Dashboard', icon: '🏠' },
      { path: '/farmer/crops', label: 'My Crops', icon: '🌾' },
      { path: '/farmer/disease-reports', label: 'Disease Reports', icon: '🔍' },
      { path: '/farmer/weather', label: 'Weather', icon: '☁️' },
      { path: '/farmer/market', label: 'Market', icon: '📊' },
    ];
    if (user.role === 'admin') return [
      { path: '/admin', label: 'Dashboard', icon: '🏠' },
      { path: '/admin/farmers', label: 'Farmers', icon: '👨‍🌾' },
      { path: '/admin/agronomists', label: 'Agronomists', icon: '🔬' },
    ];
    if (user.role === 'agronomist') return [
      { path: '/agronomist', label: 'Dashboard', icon: '🏠' },
      { path: '/agronomist/profile', label: 'Profile', icon: '👤' },
    ];
    return [];
  };

  const navLinks = getNavLinks();

  const roleConfig = {
    farmer: { gradient: 'from-emerald-700 to-green-800', ring: 'ring-emerald-400', dot: 'bg-emerald-400' },
    admin: { gradient: 'from-slate-800 to-gray-900', ring: 'ring-slate-400', dot: 'bg-blue-400' },
    agronomist: { gradient: 'from-teal-700 to-cyan-800', ring: 'ring-teal-400', dot: 'bg-teal-400' },
  };
  const rc = user ? (roleConfig[user.role] || roleConfig.farmer) : roleConfig.farmer;
  const profilePath = user
    ? (user.role === 'admin' ? '/admin/profile' : user.role === 'agronomist' ? '/agronomist/profile' : '/farmer/profile')
    : '/';

  const isActive = (path) =>
    location.pathname === path ||
    (path !== '/' && path !== '/farmer' && path !== '/admin' && path !== '/agronomist' && location.pathname.startsWith(path));

  return (
    <nav className={`bg-gradient-to-r ${rc.gradient} text-white shadow-2xl sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity flex-shrink-0">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-xl shadow-inner">
              🌾
            </div>
            <span className="font-extrabold text-lg tracking-tight hidden sm:block">Krishi Kavach</span>
          </Link>

          {/* Desktop Nav links */}
          <div className="hidden md:flex items-center gap-1 flex-1 ml-6">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link key={link.path} to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                    ${active ? 'bg-white/25 shadow-inner text-white' : 'text-white/80 hover:bg-white/15 hover:text-white'}`}>
                  <span className="text-base">{link.icon}</span>
                  <span>{link.label}</span>
                  {active && <span className={`w-1.5 h-1.5 ${rc.dot} rounded-full ml-0.5`} />}
                </Link>
              );
            })}
          </div>

          {/* Right side: theme toggle + profile + logout */}
          <div className="hidden md:flex items-center gap-3">
            {/* ── Theme Toggle ─────────────────────────── */}
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />

            {user && (
              <>
                <Link to={profilePath}
                  className="flex items-center gap-2.5 hover:bg-white/15 px-3 py-1.5 rounded-xl transition-all duration-200">
                  <div className={`h-9 w-9 rounded-xl bg-white/25 flex items-center justify-center font-extrabold text-sm ring-2 ${rc.ring} ring-offset-1 ring-offset-transparent shadow`}>
                    {user.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold leading-none">{user.fullName?.split(' ')[0]}</p>
                    <p className="text-xs text-white/60 capitalize mt-0.5">{user.role}</p>
                  </div>
                </Link>
                <button onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-semibold transition-all duration-200 border border-white/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile right side: theme toggle pill + avatar + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {/* Compact theme toggle for mobile */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Light Mode' : 'Dark Mode'}
              className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-lg transition-all border border-white/20"
              aria-label="Toggle theme">
              {isDark ? '☀️' : '🌙'}
            </button>
            {user && (
              <div className={`h-8 w-8 rounded-xl bg-white/25 flex items-center justify-center font-extrabold text-sm ring-2 ${rc.ring}`}>
                {user.fullName?.charAt(0).toUpperCase()}
              </div>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl hover:bg-white/20 transition-colors" aria-label="Toggle menu">
              {mobileMenuOpen
                ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              }
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 py-3 space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link key={link.path} to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${active ? 'bg-white/25 font-bold' : 'hover:bg-white/15 font-medium'}`}>
                  <span className="text-xl">{link.icon}</span>
                  <span className="text-sm">{link.label}</span>
                  {active && <span className={`ml-auto w-2 h-2 ${rc.dot} rounded-full`} />}
                </Link>
              );
            })}
            {user && (
              <div className="pt-3 border-t border-white/20 space-y-1">
                <Link to={profilePath} onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/15 transition-all">
                  <span className="text-xl">👤</span>
                  <div>
                    <p className="text-sm font-bold">{user.fullName}</p>
                    <p className="text-xs text-white/60 capitalize">{user.role}</p>
                  </div>
                </Link>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 transition-all duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-semibold text-sm">Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
