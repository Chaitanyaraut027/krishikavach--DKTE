import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Landmark,
  Search,
  FileText,
  IndianRupee,
  CalendarClock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ScrollText,
  MapPin,
  Wheat,
  Users,
  Ruler,
  Play,
  Youtube,
  BookOpen,
} from 'lucide-react';
import { schemesAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const CATEGORIES_BASE = [
  { value: 'General', label: 'General' },
  { value: 'SC', label: 'SC (Scheduled Caste)' },
  { value: 'ST', label: 'ST (Scheduled Tribe)' },
  { value: 'OBC', label: 'OBC (Other Backward Class)' },
  { value: 'Small/Marginal', label: 'Small / Marginal Farmer' },
  { value: 'Women', label: 'Women Farmer' },
];

const CROPS = [
  'Rice', 'Wheat', 'Maize', 'Sugarcane', 'Cotton', 'Soybean',
  'Groundnut', 'Banana', 'Chilli', 'Tomato', 'Onion', 'Potato',
  'Turmeric', 'Cauliflower', 'Radish', 'Mango', 'Grapes',
  'Jowar (Sorghum)', 'Bajra (Pearl Millet)', 'Pulses',
];

export default function Schemes() {
  const { t, lang } = useLanguage();

  // Translate category labels
  const CATEGORIES = CATEGORIES_BASE.map(c => ({ ...c, label: t(c.label) }));

  // Form state
  const [state, setState] = useState('');
  const [crop, setCrop] = useState('');
  const [landSize, setLandSize] = useState('');
  const [category, setCategory] = useState('');

  // Results state
  const [schemes, setSchemes] = useState([]);
  const [aiGuidance, setAiGuidance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // Video state
  const [videos, setVideos] = useState([]);
  const [howToVideos, setHowToVideos] = useState([]);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState(null); // fallback: search embed

  // Detail modal
  const [selectedScheme, setSelectedScheme] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!state || !crop || !landSize || !category) {
      setError(t('Please fill all fields.'));
      return;
    }
    setLoading(true);
    setError('');
    setSchemes([]);
    setAiGuidance('');
    setVideos([]);
    setHowToVideos([]);
    setSearched(false);
    try {
      const res = await schemesAPI.checkEligibility({ state, crop, landSize: Number(landSize), category, language: lang });
      const data = res.data?.data || res.data;
      setSchemes(data.schemes || []);
      setAiGuidance(data.aiGuidance || '');
      setVideos(data.videos || []);
      setHowToVideos(data.howToVideos || []);
      setSearched(true);
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to fetch schemes. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 md:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200">
            <Landmark className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              {t('Government Schemes')}
            </h1>
            <p className="text-gray-500 text-sm">
              {t('Find eligible central & state schemes for your farm')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search Form */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 md:p-8 mb-8"
      >
        <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
          <Search className="w-5 h-5 text-emerald-600" />
          {t('Enter Your Details')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* State */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-500" />
              {t('State')}
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-800"
            >
              <option value="">{t('Select your state')}</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Crop */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Wheat className="w-4 h-4 text-amber-500" />
              {t('Primary Crop')}
            </label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-800"
            >
              <option value="">{t('Select your crop')}</option>
              {CROPS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Land Size */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Ruler className="w-4 h-4 text-blue-500" />
              {t('Land Size (acres)')}
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={landSize}
              onChange={(e) => setLandSize(e.target.value)}
              placeholder={t('e.g. 2.5')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-800"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-500" />
              {t('Category')}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-800"
            >
              <option value="">{t('Select category')}</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full md:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('Finding Schemes...')}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {t('Find Eligible Schemes')}
            </>
          )}
        </button>
      </motion.form>

      {/* AI Guidance */}
      {aiGuidance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto mb-6"
        >
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-emerald-800 mb-1">{t('AI Guidance')}</h3>
                <p className="text-emerald-700 text-sm leading-relaxed">{aiGuidance}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {searched && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-5xl mx-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-emerald-600" />
              {t('Eligible Schemes')} ({schemes.length})
            </h2>
          </div>

          {schemes.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
              {t('No schemes found for the given criteria. Try adjusting your inputs.')}
            </div>
          ) : (
            <div className="grid gap-4">
              {schemes.map((scheme, idx) => (
                <SchemeCard
                  key={idx}
                  scheme={scheme}
                  index={idx}
                  onViewDetails={() => setSelectedScheme(scheme)}
                  onPlayVideo={(videoId, title, searchQuery) => {
                    setActiveVideoId(videoId || null);
                    setActiveVideoTitle(title || '');
                    setActiveSearchQuery(searchQuery || null);
                  }}
                  lang={lang}
                  t={t}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── YouTube Video Recommendations (Scheme Videos) ── */}
      {searched && videos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto mt-8"
        >
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                <Youtube className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{t('Recommended Scheme Videos')}</h3>
                <p className="text-xs text-gray-500">{t('Learn about government schemes for your crop & state')}</p>
              </div>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar -mx-2 px-2 snap-x">
              {videos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => { setActiveVideoId(video.id); setActiveVideoTitle(video.title || ''); }}
                  className="flex-shrink-0 w-[240px] overflow-hidden rounded-2xl border border-gray-100 hover:shadow-lg transition-all cursor-pointer group snap-start bg-white"
                >
                  <div className="relative aspect-video bg-gray-900 overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex items-center justify-center transition-all">
                      <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl scale-0 group-hover:scale-100 transition-all">
                        <Play className="w-5 h-5" fill="currentColor" />
                      </div>
                    </div>
                    {video.duration && (
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {video.duration}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h5 className="text-[11px] font-bold text-gray-800 line-clamp-2 leading-tight mb-1 group-hover:text-red-600 transition-colors">
                      {video.title}
                    </h5>
                    <div className="flex items-center justify-between text-[9px] text-gray-500 font-bold">
                      <span className="truncate">{video.channel}</span>
                      {video.views != null && <span>{video.views.toLocaleString()} {t('views')}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── YouTube Video Recommendations (How-To Apply) ── */}
      {searched && howToVideos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-5xl mx-auto mt-6"
        >
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{t('How to Apply for Schemes')}</h3>
                <p className="text-xs text-gray-500">{t('Step-by-step guides to help you apply')}</p>
              </div>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar -mx-2 px-2 snap-x">
              {howToVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => { setActiveVideoId(video.id); setActiveVideoTitle(video.title || ''); }}
                  className="flex-shrink-0 w-[240px] overflow-hidden rounded-2xl border border-gray-100 hover:shadow-lg transition-all cursor-pointer group snap-start bg-white"
                >
                  <div className="relative aspect-video bg-gray-900 overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex items-center justify-center transition-all">
                      <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl scale-0 group-hover:scale-100 transition-all">
                        <Play className="w-5 h-5" fill="currentColor" />
                      </div>
                    </div>
                    {video.duration && (
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {video.duration}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h5 className="text-[11px] font-bold text-gray-800 line-clamp-2 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
                      {video.title}
                    </h5>
                    <div className="flex items-center justify-between text-[9px] text-gray-500 font-bold">
                      <span className="truncate">{video.channel}</span>
                      {video.views != null && <span>{video.views.toLocaleString()} {t('views')}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Scheme Detail Modal */}
      <AnimatePresence>
        {selectedScheme && (
          <SchemeModal
            scheme={selectedScheme}
            onClose={() => setSelectedScheme(null)}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* ── Video Player Modal ── */}
      <AnimatePresence>
        {(activeVideoId || activeSearchQuery) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-4 bg-black/95 backdrop-blur-lg"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveVideoId(null);
                setActiveVideoTitle('');
                setActiveSearchQuery(null);
              }
            }}
          >
            {/* Header bar */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-600 rounded-lg">
                  <Youtube className="w-4 h-4 text-white" />
                </div>
                {activeVideoTitle && (
                  <span className="text-white text-sm font-semibold line-clamp-1 max-w-xs md:max-w-xl">
                    {activeVideoTitle}
                  </span>
                )}
              </div>
              <button
                onClick={() => { setActiveVideoId(null); setActiveVideoTitle(''); setActiveSearchQuery(null); }}
                className="p-2 bg-white/10 hover:bg-white/25 rounded-full text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Player */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            >
              <iframe
                key={activeVideoId || activeSearchQuery}
                width="100%"
                height="100%"
                src={
                  activeVideoId
                    ? `https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0&modestbranding=1`
                    : `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(activeSearchQuery)}&autoplay=1&rel=0&modestbranding=1`
                }
                title={activeVideoTitle || 'How to Apply'}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </motion.div>
            <p className="text-white/40 text-xs mt-3">Click outside or press ✕ to close</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Scheme Card ─── */
function SchemeCard({ scheme, index, onViewDetails, onPlayVideo, lang, t }) {
  const [expanded, setExpanded] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);

  const handleHowToApply = async () => {
    setLoadingVideo(true);
    const searchFallback = `how to apply ${scheme.schemeName} scheme India step by step`;
    try {
      const res = await schemesAPI.getHowToApplyVideo({ schemeName: scheme.schemeName, language: lang });
      const data = res.data;
      if (data.video?.id) {
        // API returned a specific video — play it in the modal
        onPlayVideo(data.video.id, data.video.title || `How to Apply – ${scheme.schemeName}`, null);
      } else if (data.videos?.length > 0) {
        // First item from list
        const vid = data.videos[0];
        onPlayVideo(vid.id, vid.title || `How to Apply – ${scheme.schemeName}`, null);
      } else {
        // No valid video ID — use YouTube search embed (stays on-site, no new tab)
        onPlayVideo(null, `How to Apply – ${scheme.schemeName}`, searchFallback);
      }
    } catch {
      // Error — use YouTube search embed as fallback (stays on-site)
      onPlayVideo(null, `How to Apply – ${scheme.schemeName}`, searchFallback);
    } finally {
      setLoadingVideo(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-gray-100 overflow-hidden transition-shadow"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${scheme.level === 'Central'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'
                  }`}
              >
                {scheme.level}
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {scheme.schemeName}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {scheme.briefDescription}
            </p>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <IndianRupee className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="truncate">{scheme.estimatedBenefit}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <CalendarClock className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="truncate">{scheme.deadline}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{t('Eligible')}</span>
          </div>
        </div>

        {/* Expandable */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm text-emerald-600 font-semibold flex items-center gap-1 hover:text-emerald-700"
        >
          {expanded ? (
            <><ChevronUp className="w-4 h-4" /> {t('Show Less')}</>
          ) : (
            <><ChevronDown className="w-4 h-4" /> {t('Why You Qualify')}</>
          )}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-sm text-emerald-800">
                {scheme.eligibilityReason}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-t border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={onViewDetails}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <FileText className="w-4 h-4" />
            {t('View Details')}
          </button>
          <button
            onClick={handleHowToApply}
            disabled={loadingVideo}
            className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5 disabled:opacity-50"
          >
            {loadingVideo ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {t('How to Apply')}
          </button>
        </div>
        {scheme.applyLink && (
          <a
            href={scheme.applyLink.startsWith('http') ? scheme.applyLink : `https://${scheme.applyLink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <ExternalLink className="w-4 h-4" />
            {t('Apply Now')}
          </a>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Scheme Detail Modal ─── */
function SchemeModal({ scheme, onClose, t }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 rounded-t-3xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-600" />
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${scheme.level === 'Central'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-amber-100 text-amber-700'
                }`}
            >
              {scheme.level}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <h2 className="text-xl font-bold text-gray-900">{scheme.schemeName}</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{scheme.briefDescription}</p>

          {/* Benefit */}
          <div className="p-4 rounded-2xl bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="w-5 h-5 text-green-600" />
              <span className="font-bold text-green-800">{t('Estimated Benefit')}</span>
            </div>
            <p className="text-green-700 text-sm">{scheme.estimatedBenefit}</p>
          </div>

          {/* Eligibility */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-emerald-800">{t('Why You Qualify')}</span>
            </div>
            <p className="text-emerald-700 text-sm">{scheme.eligibilityReason}</p>
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <CalendarClock className="w-4 h-4 text-blue-500" />
            <span className="font-semibold">{t('Deadline')}:</span>
            <span>{scheme.deadline}</span>
          </div>

          {/* Documents */}
          {scheme.requiredDocuments?.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-gray-500" />
                {t('Required Documents')}
              </h4>
              <ul className="space-y-1.5">
                {scheme.requiredDocuments.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Apply */}
          {scheme.applyLink && (
            <a
              href={scheme.applyLink.startsWith('http') ? scheme.applyLink : `https://${scheme.applyLink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              <span className="flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" />
                {t('Apply on Official Website')}
              </span>
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
