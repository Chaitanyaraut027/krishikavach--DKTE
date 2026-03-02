import { useState, useEffect, useRef } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell,
} from 'recharts';
import { cropAPI, geminiAPI, userAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// ── Crop emoji map ─────────────────────────────────────────────────────────
const CROP_EMOJI = {
    wheat: '🌾', rice: '🍚', paddy: '🍚', sugarcane: '🎋', cotton: '🌿',
    maize: '🌽', corn: '🌽', soybean: '🫘', soy: '🫘', tomato: '🍅',
    onion: '🧅', potato: '🥔', banana: '🍌', chilli: '🌶️', turmeric: '🟡',
    ginger: '🫚', garlic: '🧄', cauliflower: '🥦', groundnut: '🥜', mustard: '🌻',
    lentil: '🫘', chickpea: '🫘', gram: '🫘', mango: '🥭', grapes: '🍇',
    pomegranate: '🍎', radish: '🌱', coconut: '🥥', arhar: '🫘', tur: '🫘',
    moong: '🫘', urad: '🫘', barley: '🌾', jowar: '🌾', bajra: '🌾',
};
const getCropEmoji = (name) => {
    const lower = (name || '').toLowerCase();
    return Object.entries(CROP_EMOJI).find(([k]) => lower.includes(k))?.[1] || '🌾';
};

const CROP_GRAD = [
    ['#6366f1', '#8b5cf6'], ['#10b981', '#06b6d4'], ['#f59e0b', '#ef4444'],
    ['#ec4899', '#f43f5e'], ['#0ea5e9', '#2563eb'], ['#a855f7', '#7c3aed'],
];

const QUICK_COMMODITIES = [
    'Soybean', 'Wheat', 'Onion', 'Cotton', 'Tomato', 'Potato',
    'Rice', 'Mustard', 'Gram', 'Maize', 'Turmeric', 'Groundnut',
    'Arhar (Tur)', 'Sugarcane', 'Chilli', 'Garlic', 'Ginger', 'Banana',
];

const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
const fmtShort = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

// ── Trend helpers ──────────────────────────────────────────────────────────
const TREND = {
    rising: { icon: '↑', label: 'Rising', bg: '#fef2f2', text: '#dc2626', border: '#fca5a5', dot: '#ef4444' },
    falling: { icon: '↓', label: 'Falling', bg: '#f0fdf4', text: '#16a34a', border: '#86efac', dot: '#22c55e' },
    stable: { icon: '→', label: 'Stable', bg: '#f8fafc', text: '#475569', border: '#cbd5e1', dot: '#94a3b8' },
};
const TrendBadge = ({ trend, pct, dark }) => {
    const cfg = TREND[trend] || TREND.stable;
    if (dark) return (
        <span style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {cfg.icon} {cfg.label}{pct ? ` ${Math.abs(pct)}%` : ''}
        </span>
    );
    return (
        <span style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text, borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {cfg.icon} {cfg.label}{pct ? ` ${Math.abs(pct)}%` : ''}
        </span>
    );
};

// ── Custom rich area tooltip ───────────────────────────────────────────────
const AreaTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#1e1b4b', border: '1px solid #4338ca', borderRadius: 16, padding: '10px 16px', boxShadow: '0 8px 32px rgba(99,102,241,0.35)' }}>
            <p style={{ color: '#a5b4fc', fontSize: 11, marginBottom: 2 }}>{label}</p>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>
                ₹{payload[0]?.value?.toLocaleString('en-IN')}<span style={{ fontSize: 10, color: '#c4b5fd', fontWeight: 500 }}>/qtl</span>
            </p>
        </div>
    );
};

// ── Bar tooltip ────────────────────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: '8px 14px' }}>
            <p style={{ color: '#94a3b8', fontSize: 10, marginBottom: 2 }}>{label}</p>
            <p style={{ color: '#fff', fontWeight: 700 }}>₹{payload[0]?.value?.toLocaleString('en-IN')}</p>
        </div>
    );
};

// ── Skeleton ───────────────────────────────────────────────────────────────
const Sk = ({ h = 48 }) => (
    <div style={{ height: h, borderRadius: 16, background: 'linear-gradient(90deg,rgba(255,255,255,0.05) 25%,rgba(255,255,255,0.1) 50%,rgba(255,255,255,0.05) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
);

// ── Animated price number ──────────────────────────────────────────────────
const AnimPrice = ({ value }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        if (!value) return;
        const target = Number(value);
        const dur = 900;
        let start = null;
        const raf = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / dur, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(ease * target));
            if (p < 1) requestAnimationFrame(raf);
            else setDisplay(target);
        };
        requestAnimationFrame(raf);
    }, [value]);
    return <span>₹{display.toLocaleString('en-IN')}</span>;
};

// ══════════════════════════════════════════════════════════════════════════════
// PRICE INTEL PANEL  — dark glassmorphism
// ══════════════════════════════════════════════════════════════════════════════
const PriceIntelPanel = ({ commodity, district, state, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('nearby'); // nearby | major | chart
    const panelRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true); setError(null); setData(null);
        geminiAPI.getMarketPrices(commodity, district, state)
            .then(res => { if (!cancelled) setData(res.data?.data || res.data); })
            .catch(err => { if (!cancelled) setError(err?.response?.data?.message || err.message || 'Failed to load'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [commodity, district, state]);

    useEffect(() => {
        setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }, []);

    // Compute max modal price for bar scaling
    const maxModal = data ? Math.max(...(data.localMarkets || []).map(m => m.modalPrice || 0), 1) : 1;
    const maxMajor = data ? Math.max(...(data.majorMarkets || []).map(m => m.modalPrice || 0), 1) : 1;

    const tabs = [
        { id: 'nearby', label: '📍 Nearby Mandis' },
        { id: 'major', label: '🇮🇳 Major Markets' },
        ...(data?.priceHistory?.length > 1 ? [{ id: 'chart', label: '📈 30-Day Trend' }] : []),
    ];

    return (
        <div ref={panelRef}
            style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)', borderRadius: 28, border: '1.5px solid rgba(99,102,241,0.35)', boxShadow: '0 25px 60px rgba(99,102,241,0.25)', overflow: 'hidden' }}
            className="fade-up">

            {/* ── Panel Header ─────────────────────────────────────────── */}
            <div style={{ background: 'linear-gradient(135deg,#4338ca,#7c3aed)', padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
                {/* Decorative orbs */}
                <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: -80, right: -40, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -50, left: 20, pointerEvents: 'none' }} />
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                            {getCropEmoji(commodity)}
                        </div>
                        <div>
                            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0 }}>{commodity}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                <span style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#c4b5fd', borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
                                    📍 {district}, {state}
                                </span>
                                <span style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#c4b5fd', borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
                                    ₹/quintal
                                </span>
                                {data && <TrendBadge trend={data.trend} pct={data.trendPercent} dark />}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose}
                        style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>×</button>
                </div>

                {/* Summary bar below header */}
                {data && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                        {[
                            { label: 'Local Modal', value: data.localMarkets?.[0]?.modalPrice, color: '#a5b4fc' },
                            { label: 'Local Min', value: data.localMarkets?.[0]?.minPrice, color: '#86efac' },
                            { label: 'Local Max', value: data.localMarkets?.[0]?.maxPrice, color: '#fca5a5' },
                        ].map(s => s.value ? (
                            <div key={s.label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '8px 16px', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)', minWidth: 110, flex: '1 1 auto', maxWidth: 160 }}>
                                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
                                <p style={{ color: s.color, fontSize: 18, fontWeight: 800, margin: 0 }}><AnimPrice value={s.value} /></p>
                            </div>
                        ) : null)}
                    </div>
                )}
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center', padding: '24px 0' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #6366f1', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                        <p style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500 }}>Fetching live market data via AI…</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[56, 40, 56].map((h, i) => <Sk key={i} h={h} />)}
                    </div>
                </div>
            )}

            {/* Error */}
            {error && !loading && (
                <div style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
                    <p style={{ color: '#f87171', fontWeight: 700 }}>{error}</p>
                    <p style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>Check your API key or try again.</p>
                </div>
            )}

            {/* Data view */}
            {data && !loading && (
                <div style={{ padding: '0 0 24px' }}>
                    {/* Summary */}
                    {data.summary && (
                        <div style={{ margin: '20px 24px 0', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 16, padding: '12px 16px' }}>
                            <p style={{ color: '#a5b4fc', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Market Summary</p>
                            <p style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{data.summary}</p>
                        </div>
                    )}

                    {/* Insights row */}
                    {(data.seasonalInsight || data.bestTimeToSell) && (
                        <div style={{ display: 'flex', gap: 12, margin: '12px 24px 0', flexWrap: 'wrap' }}>
                            {data.seasonalInsight && (
                                <div style={{ flex: 1, minWidth: 200, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: '12px 14px' }}>
                                    <p style={{ color: '#fbbf24', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>🌦️ Seasonal Insight</p>
                                    <p style={{ color: '#fde68a', fontSize: 12, lineHeight: 1.5, margin: 0 }}>{data.seasonalInsight}</p>
                                </div>
                            )}
                            {data.bestTimeToSell && (
                                <div style={{ flex: 1, minWidth: 200, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14, padding: '12px 14px' }}>
                                    <p style={{ color: '#34d399', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>💡 Best Time to Sell</p>
                                    <p style={{ color: '#a7f3d0', fontSize: 12, lineHeight: 1.5, margin: 0 }}>{data.bestTimeToSell}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Tabs ───────────────────────────────────────────── */}
                    <div style={{ display: 'flex', gap: 8, margin: '20px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 0 }}>
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '9px 18px', borderRadius: '12px 12px 0 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                                    background: activeTab === tab.id ? 'rgba(99,102,241,0.2)' : 'transparent',
                                    color: activeTab === tab.id ? '#a5b4fc' : '#64748b',
                                    borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                                }}>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* TAB: Nearby Mandis */}
                    {activeTab === 'nearby' && (
                        <div style={{ padding: '20px 24px 0' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {(data.localMarkets || []).map((m, i) => {
                                    const barW = Math.round(((m.modalPrice || 0) / maxModal) * 100);
                                    const trendCfg = TREND[m.trend] || TREND.stable;
                                    const isNearest = i === 0;
                                    return (
                                        <div key={i}
                                            style={{ background: isNearest ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isNearest ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 18, padding: '14px 18px', transition: 'all 0.2s' }}
                                            onMouseOver={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
                                            onMouseOut={e => e.currentTarget.style.background = isNearest ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)'}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                        {isNearest && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block', flexShrink: 0, boxShadow: '0 0 6px #34d399' }} />}
                                                        <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14 }}>{m.marketName}</span>
                                                        {isNearest && <span style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', borderRadius: 999, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>Nearest</span>}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                                                        <span style={{ color: '#64748b', fontSize: 11 }}>📍 {m.district}</span>
                                                        <span style={{ color: '#64748b', fontSize: 11 }}>🛣️ {m.distance}</span>
                                                        <span style={{ color: '#64748b', fontSize: 11 }}>📦 {m.arrivalQty}</span>
                                                    </div>
                                                    {/* Price bar */}
                                                    <div style={{ marginTop: 10 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                                            <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>
                                                                Min {fmt(m.minPrice)} &nbsp;·&nbsp; Modal <span style={{ color: '#a5b4fc', fontWeight: 800 }}>{fmt(m.modalPrice)}</span> &nbsp;·&nbsp; Max {fmt(m.maxPrice)}
                                                            </span>
                                                        </div>
                                                        <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 999, overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${barW}%`, background: 'linear-gradient(90deg,#6366f1,#a855f7)', borderRadius: 999, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <p style={{ color: '#fff', fontSize: 22, fontWeight: 800, lineHeight: 1, margin: 0 }}><AnimPrice value={m.modalPrice} /></p>
                                                    <p style={{ color: '#64748b', fontSize: 9, margin: '2px 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Modal/quintal</p>
                                                    {m.quality && (
                                                        <span style={{ background: m.quality === 'A' ? 'rgba(52,211,153,0.15)' : m.quality === 'B' ? 'rgba(245,158,11,0.15)' : 'rgba(148,163,184,0.15)', color: m.quality === 'A' ? '#34d399' : m.quality === 'B' ? '#fbbf24' : '#94a3b8', border: `1px solid ${m.quality === 'A' ? 'rgba(52,211,153,0.3)' : m.quality === 'B' ? 'rgba(245,158,11,0.3)' : 'rgba(148,163,184,0.2)'}`, borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                                                            {m.quality === 'A' ? '★ Premium' : m.quality === 'B' ? '◎ Standard' : '◯ Basic'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Bar chart comparison */}
                            {data.localMarkets?.length > 1 && (
                                <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '16px' }}>
                                    <p style={{ color: '#a5b4fc', fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        📊 Mandi Price Comparison (Modal ₹/quintal)
                                    </p>
                                    <ResponsiveContainer width="100%" height={160}>
                                        <BarChart data={data.localMarkets.map(m => ({ name: m.marketName?.split(' ')[0] || m.marketName, price: m.modalPrice }))} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(1)}k`} width={42} />
                                            <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(99,102,241,0.1)' }} />
                                            <Bar dataKey="price" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                                {data.localMarkets.map((_, i) => (
                                                    <Cell key={i} fill={i === 0 ? '#6366f1' : i === 1 ? '#8b5cf6' : i === 2 ? '#a855f7' : '#7c3aed'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: Major Markets */}
                    {activeTab === 'major' && (
                        <div style={{ padding: '20px 24px 0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
                                {(data.majorMarkets || []).map((m, i) => {
                                    const barW = Math.round(((m.modalPrice || 0) / maxMajor) * 100);
                                    const [c1, c2] = CROP_GRAD[i % CROP_GRAD.length];
                                    const trendCfg = TREND[m.trend] || TREND.stable;
                                    return (
                                        <div key={i}
                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '16px', position: 'relative', overflow: 'hidden', transition: 'all 0.25s' }}
                                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                                            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'none'; }}>
                                            {/* Gradient accent */}
                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${c1},${c2})`, borderRadius: '20px 20px 0 0' }} />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                                <div>
                                                    <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13, margin: 0 }}>{m.marketName}</p>
                                                    <p style={{ color: '#64748b', fontSize: 11, margin: '2px 0 0' }}>{m.city}, {m.state}</p>
                                                </div>
                                                <span style={{ background: `${trendCfg.dot}22`, border: `1px solid ${trendCfg.dot}44`, color: trendCfg.dot, borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                    {trendCfg.icon} {trendCfg.label}
                                                </span>
                                            </div>
                                            <p style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: '8px 0 4px' }}>
                                                <AnimPrice value={m.modalPrice} />
                                            </p>
                                            {/* Bar */}
                                            <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
                                                <div style={{ height: '100%', width: `${barW}%`, background: `linear-gradient(90deg,${c1},${c2})`, borderRadius: 999, transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)' }} />
                                            </div>
                                            {m.note && <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.4, margin: 0 }}>{m.note}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                            {/* National bar chart comparison */}
                            {(data.majorMarkets || []).length > 2 && (
                                <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '16px' }}>
                                    <p style={{ color: '#a5b4fc', fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        🇮🇳 National Price Snapshot
                                    </p>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <BarChart data={data.majorMarkets.map(m => ({ name: m.city || m.marketName?.split(' ')[0], price: m.modalPrice }))} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(1)}k`} width={42} />
                                            <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(99,102,241,0.1)' }} />
                                            <Bar dataKey="price" radius={[6, 6, 0, 0]} maxBarSize={36}>
                                                {data.majorMarkets.map((_, i) => {
                                                    const [c1] = CROP_GRAD[i % CROP_GRAD.length];
                                                    return <Cell key={i} fill={c1} />;
                                                })}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: 30-Day chart */}
                    {activeTab === 'chart' && data?.priceHistory?.length > 1 && (() => {
                        const avg = Math.round(data.priceHistory.reduce((s, r) => s + r.price, 0) / data.priceHistory.length);
                        const minP = Math.min(...data.priceHistory.map(r => r.price));
                        const maxP = Math.max(...data.priceHistory.map(r => r.price));
                        const latest = data.priceHistory[data.priceHistory.length - 1]?.price || 0;
                        const first = data.priceHistory[0]?.price || 0;
                        const changePct = first ? (((latest - first) / first) * 100).toFixed(1) : 0;
                        const up = latest >= first;
                        return (
                            <div style={{ padding: '20px 24px 0' }}>
                                {/* Quick stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
                                    {[
                                        { label: 'Current', val: `₹${latest.toLocaleString('en-IN')}`, color: '#a5b4fc' },
                                        { label: '30D Avg', val: `₹${avg.toLocaleString('en-IN')}`, color: '#fbbf24' },
                                        { label: '30D Low', val: `₹${minP.toLocaleString('en-IN')}`, color: '#34d399' },
                                        { label: '30D High', val: `₹${maxP.toLocaleString('en-IN')}`, color: '#f87171' },
                                    ].map(s => (
                                        <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '10px 12px', textAlign: 'center' }}>
                                            <p style={{ color: '#475569', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{s.label}</p>
                                            <p style={{ color: s.color, fontSize: 14, fontWeight: 800, margin: 0 }}>{s.val}</p>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <span style={{ color: up ? '#34d399' : '#f87171', fontSize: 13, fontWeight: 700 }}>
                                        {up ? '▲' : '▼'} {Math.abs(changePct)}% over 30 days
                                    </span>
                                    <span style={{ color: '#475569', fontSize: 11 }}>vs start of period</span>
                                </div>
                                {/* Area Chart */}
                                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '16px 8px 8px' }}>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <AreaChart data={data.priceHistory} margin={{ top: 8, right: 20, left: 0, bottom: 4 }}>
                                            <defs>
                                                <linearGradient id="gPrice" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                                            <XAxis dataKey="date" tickFormatter={fmtShort}
                                                tick={{ fontSize: 10, fill: '#475569' }} tickLine={false}
                                                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} interval={4} />
                                            <YAxis tick={{ fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false}
                                                tickFormatter={v => `₹${(v / 1000).toFixed(1)}k`} width={50} />
                                            <Tooltip content={<AreaTooltip />} />
                                            <ReferenceLine y={avg} stroke="#f59e0b" strokeDasharray="5 4"
                                                label={{ value: `Avg ₹${avg.toLocaleString('en-IN')}`, position: 'insideTopRight', fontSize: 10, fill: '#fbbf24', fontWeight: 700 }} />
                                            <Area type="monotone" dataKey="price" stroke="#6366f1"
                                                strokeWidth={2.5} fill="url(#gPrice)"
                                                dot={false} activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <p style={{ color: '#334155', fontSize: 11, textAlign: 'center', marginTop: 10 }}>
                                    Yellow dashed line = 30-day average price
                                </p>
                            </div>
                        );
                    })()}

                    {/* Footer disclaimer */}
                    <p style={{ color: '#334155', fontSize: 11, textAlign: 'center', marginTop: 20, padding: '0 24px' }}>
                        ✨ AI-generated price intelligence · Estimates only · Always verify at your local mandi
                    </p>
                </div>
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN MARKET PAGE
// ══════════════════════════════════════════════════════════════════════════════
const Market = () => {
    const [myCrops, setMyCrops] = useState([]);
    const [loadingCrops, setLoadingCrops] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const [activePanel, setActivePanel] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const { t } = useLanguage();

    useEffect(() => { Promise.all([loadCrops(), loadProfile()]); }, []);

    const loadCrops = async () => {
        try { setLoadingCrops(true); const r = await cropAPI.getCrops(); setMyCrops(r.data || []); }
        catch { setMyCrops([]); } finally { setLoadingCrops(false); }
    };
    const loadProfile = async () => {
        try { const r = await userAPI.getProfile(); setUserProfile(r.data?.user || r.data); }
        catch { /* silent */ }
    };

    const district = userProfile?.address?.district || 'Nashik';
    const state = 'Maharashtra';

    const openPanel = (commodity, source) => {
        setActivePanel(p => (p?.commodity === commodity && p?.source === source) ? null : { commodity, source });
    };
    const handleSearchSubmit = (e) => { e.preventDefault(); if (searchInput.trim()) openPanel(searchInput.trim(), 'search'); };
    const handleQuick = (c) => { setSearchInput(c); openPanel(c, 'search'); };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0f1e 0%,#0f0a1e 50%,#0a1020 100%)' }}>
            <style>{`
                @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
                @keyframes spin { to{transform:rotate(360deg)} }
                @keyframes pulse-dot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:0.6} }
                .fade-up { animation: fadeUp 0.45s ease both; }
                .crop-btn:hover { transform:translateY(-4px) scale(1.04) !important; }
            `}</style>

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 28 }}>

                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="fade-up" style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)', borderRadius: 28, padding: '24px 28px', border: '1px solid rgba(99,102,241,0.3)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', top: -120, right: -60, pointerEvents: 'none' }} />
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                            <div style={{ width: 60, height: 60, borderRadius: 20, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>📊</div>
                            <div>
                                <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: 0 }}>{t('Market Prices')}</h1>
                                <p style={{ color: '#a5b4fc', fontSize: 13, margin: '4px 0 0' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                                        Live AI Intelligence · 📍 {district}
                                    </span>
                                </p>
                            </div>
                        </div>
                        {userProfile && (
                            <div style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 14, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 16 }}>👤</span>
                                <span style={{ color: '#c4b5fd', fontSize: 13, fontWeight: 600 }}>
                                    {userProfile.fullName?.split(' ')[0]} · <strong style={{ color: '#a5b4fc' }}>{district}</strong>
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── My Crops ─────────────────────────────────────────────── */}
                <section className="fade-up">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <h2 style={{ color: '#f1f5f9', fontSize: 17, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                            🌾 {t('My Crops')} — {t('Tap to See Prices')}
                        </h2>
                        {!loadingCrops && myCrops.length > 0 && (
                            <span style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc', borderRadius: 999, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>
                                {myCrops.length} crops
                            </span>
                        )}
                    </div>

                    {loadingCrops ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 10 }}>
                            {[1, 2, 3, 4].map(i => <Sk key={i} h={90} />)}
                        </div>
                    ) : myCrops.length === 0 ? (
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, textAlign: 'center', padding: '48px 24px' }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
                            <p style={{ color: '#94a3b8', fontWeight: 700, margin: 0 }}>{t('No crops added yet')}</p>
                            <p style={{ color: '#475569', fontSize: 13, marginTop: 6 }}>{t('Add crops in')} <strong style={{ color: '#a5b4fc' }}>{t('Crop Management')}</strong> {t('to see live market prices here.')}</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 10 }}>
                                {myCrops.map((crop, i) => {
                                    const isActive = activePanel?.commodity?.toLowerCase() === crop.cropName?.toLowerCase() && activePanel?.source === 'mycrop';
                                    const [c1, c2] = CROP_GRAD[i % CROP_GRAD.length];
                                    return (
                                        <button key={crop._id} className="crop-btn"
                                            onClick={() => openPanel(crop.cropName, 'mycrop')}
                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px', borderRadius: 20, border: `2px solid ${isActive ? c1 : 'rgba(255,255,255,0.08)'}`, background: isActive ? `linear-gradient(135deg,${c1}22,${c2}11)` : 'rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'all 0.25s', textAlign: 'center' }}>
                                            <div style={{ width: 50, height: 50, borderRadius: 16, background: `linear-gradient(135deg,${c1},${c2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: isActive ? `0 0 16px ${c1}66` : 'none', transition: 'box-shadow 0.3s' }}>
                                                {getCropEmoji(crop.cropName)}
                                            </div>
                                            <span style={{ color: '#f1f5f9', fontSize: 11, fontWeight: 700, lineHeight: 1.3 }}>{crop.cropName}</span>
                                            {crop.area?.value && <span style={{ color: '#475569', fontSize: 9 }}>{crop.area.value} {crop.area.unit}</span>}
                                            <span style={{ color: isActive ? c1 : '#475569', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {isActive ? `▲ ${t('Showing')}` : `↓ ${t('Price')}`}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            {activePanel?.source === 'mycrop' && (
                                <div style={{ marginTop: 16 }}>
                                    <PriceIntelPanel commodity={activePanel.commodity} district={district} state={state} onClose={() => setActivePanel(null)} />
                                </div>
                            )}
                        </>
                    )}
                </section>

                {/* ── Divider ───────────────────────────────────────────────── */}
                <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,rgba(99,102,241,0.3),transparent)' }} />
                    <span style={{ color: '#334155', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', whiteSpace: 'nowrap' }}>{t('Search Any Commodity')}</span>
                    <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,rgba(99,102,241,0.3),transparent)' }} />
                </div>

                {/* ── Commodity Search ──────────────────────────────────────── */}
                <section className="fade-up">
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 24 }}>
                        <h2 style={{ color: '#f1f5f9', fontSize: 17, fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            🔍 {t('Find Prices for Any Commodity')}
                        </h2>
                        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                            <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                                placeholder="Type commodity name (e.g. Soybean, Onion, Wheat)…"
                                style={{ flex: 1, padding: '12px 18px', borderRadius: 16, border: '1.5px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.08)', color: '#f1f5f9', fontSize: 14, outline: 'none', transition: 'all 0.2s' }}
                                onFocus={e => e.target.style.borderColor = '#6366f1'}
                                onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.25)'} />
                            <button type="submit" disabled={!searchInput.trim()}
                                style={{ padding: '12px 24px', borderRadius: 16, fontWeight: 700, fontSize: 14, color: '#fff', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', cursor: searchInput.trim() ? 'pointer' : 'not-allowed', opacity: searchInput.trim() ? 1 : 0.5, boxShadow: '0 4px 16px rgba(99,102,241,0.35)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                                {t('Get Prices')}
                            </button>
                        </form>

                        {/* Quick chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {QUICK_COMMODITIES.map(c => {
                                const isActive = activePanel?.commodity === c && activePanel?.source === 'search';
                                return (
                                    <button key={c} onClick={() => handleQuick(c)}
                                        style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: isActive ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)', background: isActive ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)', color: isActive ? '#a5b4fc' : '#94a3b8' }}
                                        onMouseOver={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; e.currentTarget.style.color = '#a5b4fc'; } }}
                                        onMouseOut={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; } }}>
                                        {getCropEmoji(c)} {c}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {activePanel?.source === 'search' && (
                        <div style={{ marginTop: 16 }}>
                            <PriceIntelPanel commodity={activePanel.commodity} district={district} state={state} onClose={() => setActivePanel(null)} />
                        </div>
                    )}
                </section>

                {/* ── Footer ────────────────────────────────────────────────── */}
                <p className="fade-up" style={{ color: '#1e293b', fontSize: 12, textAlign: 'center', paddingBottom: 8 }}>
                    📊 AI-powered market intelligence · Estimates only · Cross-check with your local mandi before selling
                </p>
            </div>
        </div>
    );
};

export default Market;
