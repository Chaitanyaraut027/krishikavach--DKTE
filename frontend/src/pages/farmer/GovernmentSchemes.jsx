import { useState, useEffect } from 'react';
import { schemesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const GovernmentSchemes = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { isDark } = useTheme();

    const [farmProfile, setFarmProfile] = useState({
        state: '',
        district: '',
        crops: [],
        landSize: '',
        landUnit: 'acres',
        farmerCategory: 'small',
        irrigationType: 'rainfed',
        isOrganicFarm: false,
        hasSoilHealthCard: false,
        hasKisanCreditCard: false,
        annualIncome: '',
        bankAccountLinked: true,
        aadhaarLinked: true,
    });

    const [eligibleSchemes, setEligibleSchemes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('schemes'); // 'schemes' | 'profile'
    const [selectedScheme, setSelectedScheme] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await schemesAPI.getProfile();
            if (res.data.profile) {
                if (!res.data.profile.state || !res.data.profile.district) {
                    setActiveTab('profile');
                } else {
                    setFarmProfile(res.data.profile);
                    fetchEligibility(res.data.profile);
                }
            } else {
                setFarmProfile(prev => ({
                    ...prev,
                    district: user?.address?.district || '',
                }));
                setActiveTab('profile');
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            setError('Failed to load profile details.');
        } finally {
            setLoading(false);
        }
    };

    const fetchEligibility = async (profile) => {
        try {
            setChecking(true);
            setError('');
            const res = await schemesAPI.checkEligibility({ farmProfile: profile });
            if (res.data.schemes && res.data.schemes.length > 0) {
                setEligibleSchemes(res.data.schemes);
            } else {
                setEligibleSchemes([]);
            }
        } catch (err) {
            console.error('Failed to check eligibility:', err);
            setError(err.response?.data?.message || 'AI service is currently unavailable. Please try again later.');
        } finally {
            setChecking(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError('');
            const res = await schemesAPI.saveProfile(farmProfile);
            setFarmProfile(res.data.profile);
            fetchEligibility(res.data.profile);
            setActiveTab('schemes');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFarmProfile(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' && value !== '' ? Number(value) : value)
        }));
    };

    return (
        <div className={`min-h-screen pb-20 theme-transition ${isDark ? 'bg-[#040812]' : 'bg-[#f4f7ff]'}`}>
            <style>{`
                .scheme-card { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
                .scheme-card:hover { transform: translateY(-8px) scale(1.02); }
                .tab-btn { position: relative; }
                .tab-btn::after { content: ''; position: absolute; bottom: 0; left: 50%; width: 0; height: 3px; background: #10b981; transition: all 0.3s ease; transform: translateX(-50%); border-radius: 10px; }
                .tab-btn.active::after { width: 60%; }
                .animate-float { animation: float 6s ease-in-out infinite; }
                @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
            `}</style>

            {/* --- Hero / Header Section --- */}
            <div className={`relative pt-12 pb-24 px-4 overflow-hidden`}>
                {/* Background Decorations */}
                <div className="absolute top-0 left-0 w-full h-full -z-10">
                    <div className={`absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full blur-[120px] opacity-30 ${isDark ? 'bg-emerald-600' : 'bg-emerald-200'}`} />
                    <div className={`absolute bottom-[-10%] left-[-5%] w-96 h-96 rounded-full blur-[120px] opacity-20 ${isDark ? 'bg-indigo-600' : 'bg-indigo-200'}`} />
                </div>

                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                    <div className="text-center md:text-left space-y-6 flex-1 kk-fade-up">
                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full text-emerald-500 font-bold text-xs uppercase tracking-widest">
                            <span className="animate-pulse">●</span> Official Benefits Finder
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-current leading-[1.1]">
                            Maximize Your <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Farm Potential</span> 💰
                        </h1>
                        <p className={`text-lg max-w-xl mx-auto md:mx-0 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Our AI analyzes 100+ state and central government schemes to find the ones you are eligible for. Save time and grow faster.
                        </p>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
                            <button
                                onClick={() => setActiveTab('schemes')}
                                className={`px-8 py-3.5 rounded-2xl font-black transition-all kk-slide-in ${activeTab === 'schemes' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/25 scale-105' : 'bg-white/10 border border-white/20 text-current hover:bg-white/20'}`}
                            >
                                Eligible Schemes
                            </button>
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`px-8 py-3.5 rounded-2xl font-black transition-all kk-slide-in ${activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/25 scale-105' : 'bg-white/10 border border-white/20 text-current hover:bg-white/20'}`}
                            >
                                Update Farm Profile
                            </button>
                        </div>
                    </div>

                    <div className="hidden lg:block relative kk-fade-up">
                        <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-[40px] shadow-2xl animate-float">
                            <div className="bg-[#0f172a] rounded-[32px] overflow-hidden w-72 h-[450px] shadow-2xl border-4 border-gray-800 relative">
                                <div className="p-6 space-y-4">
                                    <div className="h-4 w-2/3 bg-white/10 rounded-full" />
                                    <div className="h-24 w-full bg-emerald-500/20 rounded-2xl border border-emerald-500/30 flex items-center justify-center">
                                        <span className="text-4xl">🌾</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-3 w-full bg-white/10 rounded-full" />
                                        <div className="h-3 w-full bg-white/10 rounded-full" />
                                        <div className="h-3 w-2/3 bg-white/10 rounded-full" />
                                    </div>
                                    <div className="pt-8 flex flex-col gap-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-12 w-full bg-white/5 border border-white/10 rounded-xl" />
                                        ))}
                                    </div>
                                </div>
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-800 rounded-b-xl" />
                            </div>
                        </div>
                        {/* Shadow blobs under phone */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-10 bg-black/40 blur-2xl rounded-full" />
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-20">
                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 p-5 rounded-3xl flex items-center gap-4 kk-fade-in shadow-lg backdrop-blur-md">
                        <span className="text-2xl">⚠️</span>
                        <div className="font-bold">{error}</div>
                    </div>
                )}

                {/* --- Main Tab Content --- */}
                <div className="kk-fade-up">
                    {activeTab === 'schemes' ? (
                        <div className="space-y-10">
                            {checking ? (
                                <div className="kk-card p-16 text-center space-y-6 border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md">
                                    <div className="relative w-24 h-24 mx-auto">
                                        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20" />
                                        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-pulse opacity-40" />
                                        <div className="relative z-10 w-full h-full flex items-center justify-center text-5xl">🤖</div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black lg:text-3xl">Scanning Opportunities...</h3>
                                        <p className="text-current opacity-60 mt-2 max-w-md mx-auto">Our AI is cross-referencing your profile with live government databases to find precise matches.</p>
                                    </div>
                                    <div className="flex justify-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            ) : eligibleSchemes.length === 0 ? (
                                <div className="kk-card p-16 text-center space-y-8 border-current/10">
                                    <div className="text-8xl filter drop-shadow-2xl">🚜</div>
                                    <div className="space-y-3">
                                        <h3 className="text-3xl font-black leading-tight">No Schemes Matched Yet</h3>
                                        <p className="max-w-lg mx-auto opacity-70 text-lg">We need a bit more info about your farm to find the right benefits. Tell us about your location and land size.</p>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('profile')}
                                        className="kk-btn-primary px-12 py-4 scale-110 hover:scale-115"
                                    >
                                        Perfect, Let's Add Details →
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {eligibleSchemes.map((scheme, idx) => (
                                        <div
                                            key={scheme.id}
                                            className="scheme-card kk-card h-full flex flex-col border-emerald-500/10 hover:border-emerald-500/30 group overflow-hidden"
                                            style={{ animationDelay: `${idx * 0.1}s` }}
                                        >
                                            {/* Priority Badge */}
                                            <div className="flex items-center justify-between p-6 pb-0">
                                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${scheme.priority === 'high' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                                                    {scheme.priority} Match
                                                </div>
                                                <div className="text-3xl filter grayscale group-hover:grayscale-0 transition-all duration-500">{scheme.icon || '📜'}</div>
                                            </div>

                                            <div className="p-6 flex-1 space-y-4">
                                                <h3 className="text-xl font-black leading-tight group-hover:text-emerald-500 transition-colors uppercase tracking-tight">{scheme.name}</h3>
                                                <p className="text-sm opacity-60 line-clamp-3 leading-relaxed">{scheme.description}</p>

                                                <div className="pt-4 space-y-3">
                                                    <div className="flex items-center gap-3 bg-emerald-500/5 group-hover:bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/10 transition-colors">
                                                        <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">₹</div>
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-black uppercase text-emerald-500/70">Estimated High Benefit</p>
                                                            <p className="text-lg font-black text-emerald-600 truncate tracking-tight">{scheme.estimatedBenefit}</p>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                                                        <p className="text-[10px] font-black uppercase text-indigo-500/70 mb-1 flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> AI Recommendation
                                                        </p>
                                                        <p className="text-xs font-semibold leading-relaxed line-clamp-2 italic opacity-80 overflow-hidden">{scheme.guidance}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6 pt-0 mt-auto">
                                                <button
                                                    onClick={() => setSelectedScheme(scheme)}
                                                    className="w-full py-4 rounded-2xl bg-current/5 border border-current/10 font-black text-sm uppercase tracking-widest hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transform transition-all active:scale-95 flex items-center justify-center gap-2 group/btn"
                                                >
                                                    View Roadmap <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* --- Profile Form Section --- */
                        <form onSubmit={handleProfileSubmit} className="kk-card p-8 lg:p-12 space-y-12 backdrop-blur-xl border-emerald-500/20">
                            <div className="space-y-2 border-l-4 border-emerald-600 pl-6">
                                <h2 className="text-3xl font-black uppercase tracking-tight">Your Farm Profile</h2>
                                <p className="opacity-60 font-semibold">Keep this updated to receive the newest government scheme alerts.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {/* Location Group */}
                                <div className="space-y-6 p-6 rounded-[32px] bg-white/5 border border-white/10">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                                        <span className="w-4 h-[1px] bg-emerald-500" /> Geography
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[11px] font-black uppercase ml-1 opacity-60">State</label>
                                            <input type="text" name="state" value={farmProfile.state} onChange={handleInputChange} className="kk-input mt-1" placeholder="e.g. Maharashtra" required />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-black uppercase ml-1 opacity-60">District</label>
                                            <input type="text" name="district" value={farmProfile.district} onChange={handleInputChange} className="kk-input mt-1" placeholder="e.g. Nashik" required />
                                        </div>
                                    </div>
                                </div>

                                {/* Land Group */}
                                <div className="space-y-6 p-6 rounded-[32px] bg-white/5 border border-white/10">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                                        <span className="w-4 h-[1px] bg-blue-500" /> Land Assets
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[11px] font-black uppercase ml-1 opacity-60">Total Area</label>
                                            <div className="flex gap-2 mt-1">
                                                <input type="number" name="landSize" value={farmProfile.landSize} onChange={handleInputChange} className="kk-input flex-1" placeholder="Size" required min="0" step="0.1" />
                                                <select name="landUnit" value={farmProfile.landUnit} onChange={handleInputChange} className="kk-input w-28 text-center bg-current/5">
                                                    <option value="acres">Acres</option>
                                                    <option value="hectares">Hectares</option>
                                                    <option value="guntha">Guntha</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-black uppercase ml-1 opacity-60">Farmer Segment</label>
                                            <select name="farmerCategory" value={farmProfile.farmerCategory} onChange={handleInputChange} className="kk-input mt-1">
                                                <option value="marginal">Marginal (&lt;1 ha)</option>
                                                <option value="small">Small (1-2 ha)</option>
                                                <option value="medium">Medium (2-10 ha)</option>
                                                <option value="large">Large (&gt;10 ha)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Economics Group */}
                                <div className="space-y-6 p-6 rounded-[32px] bg-white/5 border border-white/10">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                                        <span className="w-4 h-[1px] bg-amber-500" /> Financials
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[11px] font-black uppercase ml-1 opacity-60">Irrigation System</label>
                                            <select name="irrigationType" value={farmProfile.irrigationType} onChange={handleInputChange} className="kk-input mt-1">
                                                <option value="rainfed">Rainfed</option>
                                                <option value="canal">Canal</option>
                                                <option value="borewell">Borewell</option>
                                                <option value="drip">Drip</option>
                                                <option value="sprinkler">Sprinkler</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-black uppercase ml-1 opacity-60">Annual Agri Income (₹)</label>
                                            <input type="number" name="annualIncome" value={farmProfile.annualIncome} onChange={handleInputChange} className="kk-input mt-1" placeholder="Approx Yearly Income" min="0" step="1000" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Checkboxes Group */}
                            <div className="pt-10 border-t border-white/10">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[
                                        { name: 'isOrganicFarm', label: 'Registered Organic Farmer', icon: '🌿' },
                                        { name: 'hasSoilHealthCard', label: 'Soil Health Card Available', icon: '🧪' },
                                        { name: 'hasKisanCreditCard', label: 'Active KCC Account', icon: '💳' }
                                    ].map(item => (
                                        <label key={item.name} className={`flex items-center gap-4 p-5 rounded-3xl border cursor-pointer transition-all duration-300 ${farmProfile[item.name] ? 'bg-emerald-500/10 border-emerald-500/50 shadow-inner' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                                            <input type="checkbox" name={item.name} checked={farmProfile[item.name]} onChange={handleInputChange} className="w-6 h-6 accent-emerald-600 rounded-lg" />
                                            <div className="flex flex-col">
                                                <span className="text-xl mb-1">{item.icon}</span>
                                                <span className="text-sm font-black uppercase tracking-tight">{item.label}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-8 flex flex-col sm:flex-row items-center justify-end gap-6">
                                <button type="button" onClick={() => setActiveTab('schemes')} className="text-sm font-black uppercase underline underline-offset-8 opacity-50 hover:opacity-100 transition-opacity">Skip for now</button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="kk-btn-primary px-16 py-5 rounded-[24px] text-lg lg:text-xl shadow-2xl shadow-emerald-500/40 relative group overflow-hidden"
                                >
                                    <span className="relative z-10">{loading ? 'Saving Data...' : 'Find New Schemes →'}</span>
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* --- Scheme Detail Modal --- */}
            {selectedScheme && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-all duration-300">
                    <div className={`relative w-full max-w-3xl rounded-[48px] overflow-hidden kk-fade-up shadow-[0_0_100px_rgba(16,185,129,0.3)] ${isDark ? 'bg-[#0f172a] border border-white/10' : 'bg-white'}`}>
                        {/* Status Bar */}
                        <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 animate-shimmer" />

                        {/* Close button */}
                        <button onClick={() => setSelectedScheme(null)} className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-current text-2xl z-20 transition-all active:scale-90">×</button>

                        <div className="max-h-[90vh] overflow-y-auto overflow-x-hidden p-8 lg:p-12 space-y-10">
                            {/* Modal Header */}
                            <div className="flex flex-col md:flex-row items-start gap-8 border-b border-white/10 pb-10">
                                <div className="w-24 h-24 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-[32px] flex items-center justify-center text-5xl shadow-2xl shrink-0">
                                    {selectedScheme.icon || '📄'}
                                </div>
                                <div className="space-y-3">
                                    <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-[3px] border border-emerald-500/20">{selectedScheme.category}</div>
                                    <h2 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight">{selectedScheme.name}</h2>
                                    <p className="opacity-70 text-lg leading-relaxed">{selectedScheme.description}</p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4 md:px-0">
                                <div className="p-6 rounded-[32px] bg-emerald-500/5 border border-emerald-500/20 group hover:bg-emerald-500/10 transition-colors">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 opacity-70 mb-2">Estimated High Benefit</h4>
                                    <p className="text-xl font-black text-emerald-600 tracking-tight">{selectedScheme.estimatedBenefit}</p>
                                </div>
                                <div className="p-6 rounded-[32px] bg-amber-500/5 border border-amber-500/20 group hover:bg-amber-500/10 transition-colors">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 opacity-70 mb-2">Application Window</h4>
                                    <p className="text-xl font-black text-amber-600 tracking-tight">{selectedScheme.deadline || 'Ongoing'}</p>
                                </div>
                            </div>

                            {/* Section: Documents */}
                            <div className="space-y-6">
                                <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                    <span className="w-8 h-[2px] bg-emerald-500 rounded-full" /> Preparation Checklist
                                </h4>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {selectedScheme.requiredDocuments.map((doc, i) => (
                                        <li key={i} className={`flex items-start gap-4 p-5 rounded-[24px] border ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">✓</div>
                                            <span className="text-sm font-bold opacity-80">{doc}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* AI Advice Box */}
                            <div className="p-8 rounded-[40px] bg-indigo-500/5 border-2 border-dashed border-indigo-500/20 relative group">
                                <div className="absolute -top-4 left-8 bg-indigo-500 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 scale-105">AI Strategic Advice</div>
                                <div className="text-4xl absolute -right-4 -top-8 filter drop-shadow-xl opacity-20 group-hover:opacity-100 transition-opacity duration-700">💫</div>
                                <p className="text-lg font-bold text-current leading-relaxed italic pr-6">"{selectedScheme.guidance}"</p>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex flex-col sm:flex-row gap-6 pt-10 sticky bottom-0 bg-transparent">
                                <a
                                    href={selectedScheme.applyLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-[2] text-center bg-emerald-600 text-white py-6 rounded-3xl font-black text-xl shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 hover:scale-102 transition-all flex items-center justify-center gap-3 group"
                                >
                                    Apply Online Immediately <span className="group-hover:translate-x-2 transition-transform">🚀</span>
                                </a>
                                <button
                                    onClick={() => setSelectedScheme(null)}
                                    className="flex-1 py-6 rounded-3xl font-black text-sm uppercase tracking-widest border border-current/10 hover:bg-current/5 transition-all"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GovernmentSchemes;
