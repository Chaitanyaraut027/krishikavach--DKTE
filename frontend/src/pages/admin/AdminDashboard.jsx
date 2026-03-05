import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [counts, setCounts] = useState({ farmers: '—', agronomists: '—', pending: '—' });

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [fRes, aRes] = await Promise.all([
          adminAPI.getAllFarmers?.().catch(() => null),
          adminAPI.getAllAgronomists?.().catch(() => null),
        ]);
        setCounts({
          farmers: fRes?.data?.length ?? '—',
          agronomists: aRes?.data?.length ?? '—',
          pending: aRes?.data?.filter(a => !a.isVerified)?.length ?? '—',
        });
      } catch { /* silent */ }
    };
    loadCounts();
  }, []);

  const adminCards = [
    {
      to: '/admin/farmers',
      icon: '👨‍🌾',
      title: 'Farmers',
      description: 'View and manage all registered farmer accounts on the platform.',
      gradient: 'from-emerald-500 to-green-600',
      stat: counts.farmers,
      statLabel: 'Total Farmers',
    },
    {
      to: '/admin/agronomists',
      icon: '🔬',
      title: 'Agronomists',
      description: 'Verify agronomist accounts and manage professional registrations.',
      gradient: 'from-blue-500 to-indigo-600',
      stat: counts.agronomists,
      statLabel: 'Total Agronomists',
    },
    {
      to: '/admin/facilities',
      icon: '🏭',
      title: 'Facilities',
      description: 'Manage Ginning Mills, Warehouses, and Processing Centers.',
      gradient: 'from-orange-500 to-red-600',
      statLabel: 'System Verified',
    },
    {
      to: '/admin/seeds',
      icon: '🌱',
      title: 'Seeds',
      description: 'Manage verified seeds for better yield recommendations.',
      gradient: 'from-teal-500 to-emerald-600',
      statLabel: 'Verified Quality',
    },
    {
      to: '/admin/fertilizers',
      icon: '🧪',
      title: 'Fertilizers',
      description: 'Manage verified fertilizers and chemical inputs.',
      gradient: 'from-purple-500 to-pink-600',
      statLabel: 'Expert Approved',
    },
  ];

  const quickStats = [
    { icon: '✅', label: 'System Status', value: 'All Operational', color: 'text-emerald-600' },
    { icon: '⏳', label: 'Pending Verifications', value: counts.pending, color: 'text-amber-600' },
    { icon: '📅', label: 'Last Updated', value: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), color: 'text-blue-600' },
  ];

  return (
    <div className={`min-h-screen ${isDark
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800'
        : 'bg-gradient-to-br from-[#f0f4ff] via-[#e8eeff] to-[#f0f4ff]'
      }`}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.45s ease both; }
        .card-lift { transition: all 0.25s cubic-bezier(.4,0,.2,1); }
        .card-lift:hover { transform: translateY(-5px); }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Admin Banner ─────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-700 via-gray-800 to-slate-700 rounded-3xl border border-white/10 shadow-2xl p-8 fade-up">
          <div className="absolute top-0 right-0 text-[160px] leading-none opacity-5 select-none -mt-4 -mr-4">🛡️</div>
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-3xl border border-white/20">🛡️</div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Administrator</p>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Admin Dashboard</h1>
                </div>
              </div>
              <p className="text-gray-400 text-sm max-w-lg">
                Manage farmers, verify agronomists, and monitor platform health from your central control panel.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-2xl text-sm font-bold">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Live
            </div>
          </div>
        </div>

        {/* ── Quick Stats ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 fade-up">
          {quickStats.map((s, i) => (
            <div key={i} className={`rounded-2xl p-5 flex items-center gap-4 ${isDark ? 'bg-white/5 border border-white/10 backdrop-blur' : 'bg-white border border-gray-200 shadow-sm'
              }`}>
              <div className="text-3xl">{s.icon}</div>
              <div>
                <p className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{s.label}</p>
                <p className={`text-xl font-extrabold ${s.color} mt-0.5`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Management Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 fade-up">
          {adminCards.map((card) => (
            <Link key={card.to} to={card.to}
              className={`group card-lift border rounded-3xl overflow-hidden transition-all ${isDark
                  ? 'bg-white/5 border-white/10 backdrop-blur hover:border-white/20 hover:bg-white/8'
                  : 'bg-white border-gray-200 shadow-sm hover:shadow-xl hover:border-indigo-200'
                }`}>
              <div className={`h-2 bg-gradient-to-r ${card.gradient}`} />
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 transition-transform`}>
                    {card.icon}
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-extrabold text-white">{card.stat}</p>
                    <p className="text-gray-500 text-xs mt-1">{card.statLabel}</p>
                  </div>
                </div>
                <h3 className={`text-2xl font-extrabold mb-2 ${isDark ? 'text-white' : 'text-[#1e1b4b]'}`}>{card.title}</h3>
                <p className={`text-sm mb-5 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{card.description}</p>
                <div className="flex items-center gap-2 text-white font-semibold text-sm group-hover:gap-3 transition-all">
                  Manage {card.title}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Platform Overview ─────────────────────────────────────────── */}
        <div className={`rounded-3xl p-6 fade-up ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm'
          }`}>
          <h2 className={`text-lg font-extrabold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#1e1b4b]'}`}>
            ⚡ Platform Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🌾', label: 'Disease Detection', desc: 'YOLO AI model for crop disease' },
              { icon: '☁️', label: 'Weather Service', desc: 'OpenWeatherMap integration' },
              { icon: '🤖', label: 'AI Assistant', desc: 'Intelligent crop & market insights' },
              { icon: '🌐', label: 'Multi-Language', desc: 'English, Hindi, Marathi' },
            ].map((item, i) => (
              <div key={i} className={`rounded-2xl p-4 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-indigo-50 border border-indigo-100'
                }`}>
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#1e1b4b]'}`}>{item.label}</p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
