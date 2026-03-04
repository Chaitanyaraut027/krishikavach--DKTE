import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { schemesAPI, cropAPI } from '../../services/api';

const CATEGORIES = ["Marginal (< 1 Hectare)", "Small (1 - 2 Hectares)", "Medium (2 - 10 Hectares)", "Large (> 10 Hectares)"];

const Schemes = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { isDark } = useTheme();

    const [crops, setCrops] = useState([]);

    // Form State
    const [state, setState] = useState(user?.address?.state || 'Maharashtra');
    const [crop, setCrop] = useState('');
    const [landSize, setLandSize] = useState('');
    const [landUnit, setLandUnit] = useState('acres');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [additionalInfo, setAdditionalInfo] = useState('');

    // Status State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null);
    const [selectedScheme, setSelectedScheme] = useState(null);

    useEffect(() => {
        const fetchCrops = async () => {
            try {
                const res = await cropAPI.getCrops();
                setCrops(res.data || []);
                if (res.data?.length > 0) {
                    setCrop(res.data[0].name);
                }
            } catch (err) {
                console.error("Failed to fetch crops", err);
            }
        };
        fetchCrops();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResults(null);
        setSelectedScheme(null);

        try {
            const res = await schemesAPI.checkEligibility({
                state,
                crop,
                landSize,
                landUnit,
                category,
                additionalInfo
            });
            setResults(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to check eligibility');
        } finally {
            setLoading(false);
        }
    };

    const textH = isDark ? 'text-white' : 'text-gray-900';
    const textS = isDark ? 'text-gray-400' : 'text-gray-500';
    const cardBase = isDark ? 'bg-[#111827] border-gray-800' : 'bg-white border-gray-100';

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#050e0a]' : 'bg-gradient-to-br from-[#f0fdf4] via-[#ecfdf5] to-[#f0f4ff]'}`}>
            <style>{`
                @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.3); opacity: 0; } }
                .loader-ring { animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
            `}</style>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Header */}
                <div className={`relative overflow-hidden rounded-3xl shadow-xl border ${isDark ? 'bg-gradient-to-br from-indigo-900/40 to-blue-900/20 border-indigo-500/30' : 'bg-gradient-to-br from-indigo-600 to-blue-700 border-indigo-200'}`}>
                    <div className="relative p-6 sm:p-8 flex items-center gap-6">
                        <div className="hidden sm:flex w-16 h-16 bg-white/20 rounded-2xl items-center justify-center text-3xl shadow-lg backdrop-blur">
                            🏛️
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                                AI Government Schemes Finder
                            </h1>
                            <p className="text-indigo-100 max-w-xl">
                                Discover Central and State agricultural schemes you are eligible for. Enter your farm details and let our AI instantly match you with the right benefits.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-4">
                        <div className={`rounded-3xl shadow-xl border overflow-hidden ${cardBase}`}>
                            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    📋 {t('Farm Details')}
                                </h2>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${textS}`}>{t('State')}</label>
                                    <input type="text" value={state} onChange={(e) => setState(e.target.value)} required
                                        className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                                </div>

                                <div>
                                    <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${textS}`}>{t('Primary Crop')}</label>
                                    <input type="text" value={crop} onChange={(e) => setCrop(e.target.value)} required placeholder="e.g. Soybean, Cotton"
                                        className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                                    {crops.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {crops.map(c => (
                                                <button key={c._id} type="button" onClick={() => setCrop(c.name)} className={`text-xs px-2 py-1 rounded-md border ${crop === c.name ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}>
                                                    {c.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${textS}`}>{t('Land Size')}</label>
                                        <input type="number" step="0.1" value={landSize} onChange={(e) => setLandSize(e.target.value)} required
                                            className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${textS}`}>{t('Unit')}</label>
                                        <select value={landUnit} onChange={(e) => setLandUnit(e.target.value)}
                                            className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                            <option value="acres">Acres</option>
                                            <option value="hectares">Hectares</option>
                                            <option value="guntha">Guntha</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${textS}`}>{t('Farmer Category')}</label>
                                    <select value={category} onChange={(e) => setCategory(e.target.value)}
                                        className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${textS}`}>{t('Additional Info (Optional)')}</label>
                                    <textarea value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} rows="2" placeholder="e.g. Organic farming, Drip irrigation installed"
                                        className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}></textarea>
                                </div>

                                <button type="submit" disabled={loading} className={`w-full py-3.5 rounded-xl text-white font-extrabold shadow-lg transition-all ${loading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-emerald-500/30 hover:-translate-y-0.5'}`}>
                                    {loading ? t('Checking Eligibility...') : t('Check My Eligibility')}
                                </button>
                                {error && <p className="text-red-500 text-xs font-semibold text-center mt-2">{error}</p>}
                            </form>
                        </div>
                    </div>

                    {/* Right Column: AI Results */}
                    <div className="lg:col-span-8 flex flex-col">
                        {loading && (
                            <div className={`flex-1 flex flex-col items-center justify-center rounded-3xl border border-dashed ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-emerald-200 bg-emerald-50/50'} py-20`}>
                                <div className="relative w-20 h-20 flex items-center justify-center mb-6">
                                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                                    <div className="absolute inset-2 rounded-full border-4 border-teal-400 border-b-transparent animate-spin" style={{ animationDirection: "reverse" }}></div>
                                    <span className="text-2xl">🤖</span>
                                </div>
                                <h3 className={`text-xl font-extrabold mb-2 ${textH}`}>AI is analyzing your details...</h3>
                                <p className={textS}>Checking across Central and State government databases...</p>
                            </div>
                        )}

                        {!loading && !results && (
                            <div className={`flex-1 flex flex-col items-center justify-center rounded-3xl border border-dashed ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-300 bg-gray-50/50'} py-20`}>
                                <div className="text-6xl mb-4 opacity-50 grayscale transition-all duration-700 hover:grayscale-0" style={{ animation: 'float 4s ease-in-out infinite' }}>🏦</div>
                                <h3 className={`text-xl font-extrabold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>No Results Yet</h3>
                                <p className={`max-w-md text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Fill out the form on the left to see exactly which agricultural schemes you are eligible for, plus AI-guided tips.</p>
                            </div>
                        )}

                        {!loading && results && (
                            <div className="space-y-6 animate-fade-in fade-in">
                                {/* AI Guidance Box */}
                                <div className={`relative overflow-hidden rounded-2xl border p-5 ${isDark ? 'bg-gradient-to-r from-emerald-900/20 to-teal-900/10 border-emerald-500/30' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">🧠</div>
                                        <div>
                                            <h3 className={`text-sm font-extrabold mb-1.5 flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                AI Strategic Guidance
                                            </h3>
                                            <p className={`text-sm leading-relaxed ${isDark ? 'text-emerald-100/90' : 'text-emerald-900'}`}>{results.aiGuidance}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mb-2">
                                    <h3 className={`text-xl font-extrabold ${textH}`}>Eligible Schemes ({results.schemes?.length || 0})</h3>
                                    <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200">Verified by AI</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {results.schemes?.map((scheme, idx) => (
                                        <div key={idx} onClick={() => setSelectedScheme(scheme)} className={`group relative rounded-2xl border p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isDark ? 'bg-gray-800 border-gray-700 hover:border-indigo-500/50' : 'bg-white border-gray-200 hover:border-indigo-300'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-lg ${scheme.level.toLowerCase().includes('central') ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {scheme.level} Scheme
                                                </span>
                                            </div>
                                            <h4 className={`text-lg font-extrabold mb-2 line-clamp-1 group-hover:text-indigo-500 transition-colors ${textH}`}>{scheme.schemeName}</h4>
                                            <p className={`text-xs leading-relaxed mb-4 line-clamp-2 ${textS}`}>{scheme.briefDescription}</p>

                                            <div className={`mt-auto p-3 rounded-xl border ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-emerald-50 border-emerald-100'}`}>
                                                <p className={`text-[11px] font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>💰 Est. Benefit: {scheme.estimatedBenefit}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Scheme Details Modal */}
            {selectedScheme && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedScheme(null)}>
                    <div className={`relative max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} p-1`} onClick={e => e.stopPropagation()}>

                        <div className={`sticky top-0 z-10 flex justify-between items-center px-6 py-4 rounded-t-[22px] backdrop-blur-md border-b ${isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-100'}`}>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📑</span>
                                <h3 className={`text-xl font-extrabold ${textH}`}>{selectedScheme.schemeName}</h3>
                            </div>
                            <button onClick={() => setSelectedScheme(null)} className={`w-8 h-8 flex items-center justify-center rounded-full text-xl transition-all ${isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900'}`}>×</button>
                        </div>

                        <div className="p-6 sm:p-8 space-y-6">
                            <div>
                                <h4 className={`text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2`}>Objective</h4>
                                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selectedScheme.briefDescription}</p>
                            </div>

                            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-emerald-900/10 border-emerald-800/50' : 'bg-emerald-50 border-emerald-100'}`}>
                                <h4 className={`text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2`}>Why You Are Eligible</h4>
                                <p className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>{selectedScheme.eligibilityReason}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                    <h4 className={`text-xs font-bold uppercase tracking-widest ${textS} mb-1`}>Benefit</h4>
                                    <p className={`text-sm font-extrabold ${textH}`}>{selectedScheme.estimatedBenefit}</p>
                                </div>
                                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                    <h4 className={`text-xs font-bold uppercase tracking-widest ${textS} mb-1`}>Deadline</h4>
                                    <p className={`text-sm font-extrabold ${selectedScheme.deadline.toLowerCase() === 'ongoing' ? 'text-emerald-500' : 'text-orange-500'}`}>{selectedScheme.deadline}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className={`text-xs font-bold uppercase tracking-widest border-b pb-2 mb-3 ${isDark ? 'text-gray-400 border-gray-800' : 'text-gray-500 border-gray-200'}`}>Required Documents</h4>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {selectedScheme.requiredDocuments?.map((doc, i) => (
                                        <li key={i} className={`flex items-center gap-2 text-sm ${textS}`}>
                                            <span className="text-indigo-500">✓</span> {doc}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <a href={selectedScheme.applyLink.toLowerCase().startsWith('http') ? selectedScheme.applyLink : `https://google.com/search?q=${encodeURIComponent(selectedScheme.schemeName + " apply")}`} target="_blank" rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-sm px-6 py-3 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all">
                                    {selectedScheme.applyLink.toLowerCase().includes('http') ? 'Apply on Official Portal ↗' : 'Find Application Process ↗'}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Schemes;
