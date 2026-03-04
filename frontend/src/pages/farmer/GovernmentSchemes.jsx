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
                // If profile is incomplete, force the user to the profile tab
                if (!res.data.profile.state || !res.data.profile.district) {
                    setActiveTab('profile');
                } else {
                    setFarmProfile(res.data.profile);
                    fetchEligibility(res.data.profile);
                }
            } else {
                // Pre-fill some data from user profile
                setFarmProfile(prev => ({
                    ...prev,
                    district: user?.address?.district || '',
                }));
                setActiveTab('profile'); // Focus on profile if not set
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
                console.log('No eligible schemes found for this profile.');
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

    const textH = isDark ? 'text-white' : 'text-gray-900';
    const textS = isDark ? 'text-gray-400' : 'text-gray-500';
    const cardBg = isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-gray-100 shadow-sm';

    return (
        <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${isDark ? 'bg-[#050e0a]' : 'bg-[#f0fdf4]'}`}>
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 fade-up">
                    <div>
                        <h1 className={`text-3xl font-extrabold ${textH}`}>Government Schemes 💰</h1>
                        <p className={`${textS} text-sm mt-1`}>Find and apply for agricultural schemes you are eligible for</p>
                    </div>
                    <div className="flex bg-emerald-100/50 p-1 rounded-2xl border border-emerald-200 w-fit">
                        <button
                            onClick={() => setActiveTab('schemes')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'schemes' ? 'bg-emerald-600 text-white shadow-lg' : 'text-emerald-700 hover:bg-emerald-100'}`}
                        >
                            Eligible Schemes
                        </button>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-lg' : 'text-emerald-700 hover:bg-emerald-100'}`}
                        >
                            Farm Details
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm animate-pulse">
                        ⚠️ {error}
                    </div>
                )}

                {/* Tab Content: Eligible Schemes */}
                {activeTab === 'schemes' && (
                    <div className="space-y-6 fade-in">
                        {checking && (
                            <div className="flex flex-col items-center justify-center p-20 text-center animate-pulse">
                                <div className="text-5xl mb-4">🤖</div>
                                <h3 className={`text-lg font-bold ${textH}`}>AI is checking your eligibility...</h3>
                                <p className={`${textS} text-sm`}>Analyzing your farm profile against 100+ schemes</p>
                            </div>
                        )}

                        {!checking && eligibleSchemes.length === 0 && (
                            <div className={`p-10 text-center rounded-3xl border ${cardBg}`}>
                                <div className="text-6xl mb-4">🚜</div>
                                <h3 className={`text-xl font-bold ${textH}`}>No schemes found yet</h3>
                                <p className={`${textS} mt-2 max-w-md mx-auto`}>Fill in your farm details to see which government schemes you can benefit from.</p>
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className="mt-6 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all"
                                >
                                    Enter Farm Details
                                </button>
                            </div>
                        )}

                        {!checking && eligibleSchemes.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {eligibleSchemes.map((scheme) => (
                                    <div
                                        key={scheme.id}
                                        className={`group relative flex flex-col p-6 rounded-3xl border transition-all hover:-translate-y-2 hover:shadow-2xl ${cardBg}`}
                                    >
                                        <div className="absolute -top-3 -right-3 w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center text-xl shadow-md border border-emerald-200">
                                            {scheme.icon || '📄'}
                                        </div>

                                        <div className="mb-4">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${scheme.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {scheme.priority} Priority
                                            </span>
                                        </div>

                                        <h3 className={`font-extrabold text-lg leading-tight mb-2 ${textH}`}>{scheme.name}</h3>
                                        <p className={`text-sm ${textS} line-clamp-2 mb-4`}>{scheme.description}</p>

                                        <div className="mt-auto space-y-3">
                                            <div className="flex items-center gap-2 bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                                                <span className="text-xl">⭐</span>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] uppercase font-bold text-emerald-700">Estimated Benefit</p>
                                                    <p className="text-xs font-bold text-emerald-900 truncate">{scheme.estimatedBenefit}</p>
                                                </div>
                                            </div>

                                            <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                                                <p className="text-[10px] uppercase font-bold text-blue-700 mb-1">AI Recommendation</p>
                                                <p className="text-xs text-blue-900 leading-relaxed italic">{scheme.guidance}</p>
                                            </div>

                                            <button
                                                onClick={() => setSelectedScheme(scheme)}
                                                className="w-full bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 hover:text-white py-3 rounded-2xl text-sm font-bold transition-all border border-emerald-600/20"
                                            >
                                                Details & Apply →
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab Content: Farm Details Form */}
                {activeTab === 'profile' && (
                    <form onSubmit={handleProfileSubmit} className={`p-6 sm:p-8 rounded-3xl border fade-in ${cardBg}`}>
                        <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${textH}`}>
                            🚜 Update Farm Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Location */}
                            <div className="space-y-2">
                                <label className={`text-sm font-bold ${textS}`}>State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={farmProfile.state}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Maharashtra"
                                    className="kk-input"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={`text-sm font-bold ${textS}`}>District</label>
                                <input
                                    type="text"
                                    name="district"
                                    value={farmProfile.district}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Nashik"
                                    className="kk-input"
                                    required
                                />
                            </div>

                            {/* Land Info */}
                            <div className="space-y-2">
                                <label className={`text-sm font-bold ${textS}`}>Land Size</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        name="landSize"
                                        value={farmProfile.landSize}
                                        onChange={handleInputChange}
                                        placeholder="Size"
                                        className="kk-input flex-[3] min-w-[120px] pr-8 [appearance:auto]"
                                        required
                                        min="0"
                                        step="0.1"
                                    />
                                    <select
                                        name="landUnit"
                                        value={farmProfile.landUnit}
                                        onChange={handleInputChange}
                                        className="kk-input flex-1 w-32"
                                    >
                                        <option value="acres">Acres</option>
                                        <option value="hectares">Hectares</option>
                                        <option value="guntha">Guntha</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className={`text-sm font-bold ${textS}`}>Farmer Category</label>
                                <select
                                    name="farmerCategory"
                                    value={farmProfile.farmerCategory}
                                    onChange={handleInputChange}
                                    className="kk-input"
                                >
                                    <option value="marginal">Marginal (less than 1 hectare)</option>
                                    <option value="small">Small (1-2 hectares)</option>
                                    <option value="medium">Medium (2-10 hectares)</option>
                                    <option value="large">Large (more than 10 hectares)</option>
                                </select>
                            </div>

                            {/* Irrigation and Organic */}
                            <div className="space-y-2">
                                <label className={`text-sm font-bold ${textS}`}>Irrigation Type</label>
                                <select
                                    name="irrigationType"
                                    value={farmProfile.irrigationType}
                                    onChange={handleInputChange}
                                    className="kk-input"
                                >
                                    <option value="rainfed">Rainfed</option>
                                    <option value="canal">Canal</option>
                                    <option value="borewell">Borewell</option>
                                    <option value="drip">Drip Irrigation</option>
                                    <option value="sprinkler">Sprinkler</option>
                                    <option value="mixed">Mixed</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className={`text-sm font-bold ${textS}`}>Annual Agriculture Income (₹)</label>
                                <input
                                    type="number"
                                    name="annualIncome"
                                    value={farmProfile.annualIncome}
                                    onChange={handleInputChange}
                                    placeholder="Rough yearly income"
                                    className="kk-input pr-8 [appearance:auto]"
                                    min="0"
                                    step="1000"
                                />
                            </div>

                            {/* Checkboxes */}
                            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-emerald-100 mt-4">
                                <label className="flex items-center gap-3 p-3 rounded-2xl border border-emerald-100 cursor-pointer hover:bg-emerald-50 transition-all">
                                    <input
                                        type="checkbox"
                                        name="isOrganicFarm"
                                        checked={farmProfile.isOrganicFarm}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 accent-emerald-600"
                                    />
                                    <span className={`text-sm font-medium ${textH}`}>Organic Farm</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 rounded-2xl border border-emerald-100 cursor-pointer hover:bg-emerald-50 transition-all">
                                    <input
                                        type="checkbox"
                                        name="hasSoilHealthCard"
                                        checked={farmProfile.hasSoilHealthCard}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 accent-emerald-600"
                                    />
                                    <span className={`text-sm font-medium ${textH}`}>Has Soil Health Card</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 rounded-2xl border border-emerald-100 cursor-pointer hover:bg-emerald-50 transition-all">
                                    <input
                                        type="checkbox"
                                        name="hasKisanCreditCard"
                                        checked={farmProfile.hasKisanCreditCard}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 accent-emerald-600"
                                    />
                                    <span className={`text-sm font-medium ${textH}`}>Has Kisan Credit Card (KCC)</span>
                                </label>
                            </div>
                        </div>

                        <div className="mt-10 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => setActiveTab('schemes')}
                                className="px-8 py-3 rounded-2xl font-bold border border-emerald-200 text-emerald-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-10 py-3 rounded-2xl font-bold bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save & Check Eligibility →'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Scheme Detail Modal */}
                {selectedScheme && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm shadow-2xl overflow-y-auto">
                        <div className={`relative w-full max-w-2xl rounded-3xl overflow-hidden animate-kk-fade-up ${isDark ? 'bg-[#0f172a] border border-white/10' : 'bg-white'}`}>

                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                                    {selectedScheme.icon}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-extrabold text-white leading-tight">{selectedScheme.name}</h2>
                                    <span className="text-emerald-100 text-xs font-bold uppercase tracking-widest">{selectedScheme.category}</span>
                                </div>
                                <button
                                    onClick={() => setSelectedScheme(null)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div>
                                    <h4 className={`text-sm font-extrabold uppercase tracking-wider mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Description</h4>
                                    <p className={`text-sm leading-relaxed ${textS}`}>{selectedScheme.description}</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                        <h4 className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Key Benefit</h4>
                                        <p className="text-sm font-extrabold text-emerald-900">{selectedScheme.estimatedBenefit}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                                        <h4 className="text-[10px] font-bold text-amber-700 uppercase mb-1">Deadline</h4>
                                        <p className="text-sm font-extrabold text-amber-900">{selectedScheme.deadline}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className={`text-sm font-extrabold uppercase tracking-wider mb-3 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Required Documents</h4>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {selectedScheme.requiredDocuments.map((doc, i) => (
                                            <li key={i} className={`flex items-start gap-2 text-xs p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'} ${textS}`}>
                                                <span className="text-emerald-500">✓</span> {doc}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
                                    <h4 className="text-xs font-bold text-blue-700 uppercase mb-2 flex items-center gap-2">🤖 Personalized AI Advice</h4>
                                    <p className="text-sm text-blue-900 leading-relaxed italic">{selectedScheme.guidance}</p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
                                    <a
                                        href={selectedScheme.applyLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 text-center bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        🚀 Apply Now Online
                                    </a>
                                    <button
                                        onClick={() => setSelectedScheme(null)}
                                        className="flex-1 py-4 rounded-2xl font-bold border border-gray-200 hover:bg-gray-50 transition-all text-sm"
                                    >
                                        Maybe Later
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default GovernmentSchemes;
