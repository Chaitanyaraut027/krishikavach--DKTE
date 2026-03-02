import { useState, useRef, useEffect } from 'react';
import { diseaseReportAPI, geminiAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useChatbot } from '../context/ChatbotContext';

// ── Supported crops for the new YOLO model ─────────────────────────────────
const CROPS = [
  {
    id: 'Banana',
    icon: '🍌',
    color: 'from-yellow-400 to-amber-500',
    bgLight: 'from-yellow-50 to-amber-50',
    border: 'border-yellow-300',
    shadow: 'shadow-yellow-200',
    emoji: '🍌',
  },
  {
    id: 'Chilli',
    icon: '🌶️',
    color: 'from-red-500 to-rose-600',
    bgLight: 'from-red-50 to-rose-50',
    border: 'border-red-300',
    shadow: 'shadow-red-200',
    emoji: '🌶️',
  },
  {
    id: 'Radish',
    icon: '🌱',
    color: 'from-pink-400 to-fuchsia-500',
    bgLight: 'from-pink-50 to-fuchsia-50',
    border: 'border-pink-300',
    shadow: 'shadow-pink-200',
    emoji: '🌱',
  },
  {
    id: 'Groundnut',
    icon: '🥜',
    color: 'from-amber-600 to-orange-600',
    bgLight: 'from-amber-50 to-orange-50',
    border: 'border-amber-300',
    shadow: 'shadow-amber-200',
    emoji: '🥜',
  },
  {
    id: 'Cauliflower',
    icon: '🥦',
    color: 'from-green-500 to-emerald-600',
    bgLight: 'from-green-50 to-emerald-50',
    border: 'border-green-300',
    shadow: 'shadow-green-200',
    emoji: '🥦',
  },
];

// ── Friendly names for YOLO class labels ──────────────────────────────────
const CLASS_LABELS = {
  // Banana
  banana_bract_mosaic_virus: 'Bract Mosaic Virus',
  banana_cordana: 'Cordana Leaf Spot',
  banana_healthy: 'Healthy',
  banana_insectpest: 'Insect Pest Damage',
  banana_moko: 'Moko Disease',
  banana_panama: 'Panama Wilt',
  banana_pestalotiopsis: 'Pestalotiopsis Leaf Spot',
  banana_sigatoka: 'Sigatoka',
  banana_yb_sigatoka: 'Yellow Sigatoka',
  // Cauliflower
  cauliflower_Blackrot: 'Black Rot',
  cauliflower_bacterial_spot_rot: 'Bacterial Spot Rot',
  cauliflower_downy_mildew: 'Downy Mildew',
  cauliflower_healthy: 'Healthy',
  // Chilli
  chilli_anthracnose: 'Anthracnose',
  chilli_healthy: 'Healthy',
  chilli_leafcurl: 'Leaf Curl',
  chilli_leafspot: 'Leaf Spot',
  chilli_whitefly: 'Whitefly Infestation',
  chilli_yellowish: 'Yellowing',
  // Groundnut
  groundnut_early_leaf_spot: 'Early Leaf Spot',
  groundnut_early_rust: 'Early Rust',
  groundnut_healthy: 'Healthy',
  groundnut_late_leaf_spot: 'Late Leaf Spot',
  groundnut_nutrition_deficiency: 'Nutrition Deficiency',
  groundnut_rust: 'Rust',
  // Radish
  radish_black_leaf_spot: 'Black Leaf Spot',
  radish_downey_mildew: 'Downy Mildew',
  radish_flea_beetle: 'Flea Beetle Damage',
  radish_healthy: 'Healthy',
  radish_mosaic: 'Mosaic Virus',
};

/** Convert a raw YOLO class name to a friendly readable label */
const friendlyLabel = (rawClass) => CLASS_LABELS[rawClass] || rawClass
  .replace(/^(banana|chilli|radish|groundnut|cauliflower)_/i, '')
  .split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

/** A prediction is "healthy" if the YOLO class ends with _healthy */
const isHealthyClass = (rawClass) =>
  typeof rawClass === 'string' && rawClass.toLowerCase().endsWith('_healthy');

const DiseaseDetection = ({ onDetectionComplete }) => {
  const { t, lang } = useLanguage();
  const { setDiseaseContext, openChatbot } = useChatbot();
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState('');
  const [mlOffline, setMlOffline] = useState(false);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [showPreviousTests, setShowPreviousTests] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  // ── Gemini AI info state ────────────────────────────────────────────────────
  const [geminiInfo, setGeminiInfo] = useState(null);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Load previous reports
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const res = await diseaseReportAPI.getReports();
      setReports(res.data || []);
    } catch {
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleCropSelect = (crop) => {
    setSelectedCrop(crop);
    setSelectedImage(null);
    setImagePreview(null);
    setPredictionResult(null);
    setError('');
    setMlOffline(false);
    setGeminiInfo(null);
    setGeminiError('');
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError(t('Image size should be less than 10MB'));
      return;
    }
    setSelectedImage(file);
    setError('');
    setPredictionResult(null);
    setMlOffline(false);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDetect = async () => {
    if (!selectedCrop || !selectedImage) return;
    setIsPredicting(true);
    setError('');
    setMlOffline(false);
    setPredictionResult(null);

    try {
      const response = await diseaseReportAPI.detectDisease(selectedCrop.id, selectedImage);
      const data = response.data;
      const report = data.report;
      const rawClass = report.prediction; // e.g. 'banana_sigatoka'
      const displayName = friendlyLabel(rawClass);
      const healthy = isHealthyClass(rawClass);
      const result = {
        cropName: report.cropName,
        prediction: displayName,   // human-readable
        rawClass,                  // original YOLO class
        confidence: report.confidence,
        imageURL: report.imageURL,
        reportId: report._id,
        isHealthy: healthy,
      };
      setPredictionResult(result);
      fetchReports(); // refresh history
      if (onDetectionComplete) onDetectionComplete(report);

      // ── Auto-fetch Gemini info (skip if image is unprocessable) ──
      const isInvalid = report.confidence < 50 || report.confidence === 100;
      if (!isInvalid) {
        setGeminiLoading(true);
        setGeminiInfo(null);
        setGeminiError('');
        try {
          const gemRes = await geminiAPI.getCropDiseaseInfo(
            report.cropName,
            displayName,
            lang
          );
          setGeminiInfo(gemRes.data.info);
          // ── Push disease context into global chatbot ──
          setDiseaseContext(
            `Crop: ${report.cropName}, Detected disease: ${displayName}, Confidence: ${report.confidence}%`
          );
        } catch {
          setGeminiError('Could not load AI crop info. Please try again.');
        } finally {
          setGeminiLoading(false);
        }
      }
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.error === 'ML_SERVER_OFFLINE' || err.message?.includes('ECONNREFUSED')) {
        setMlOffline(true);
      } else {
        setError(errData?.message || err.message || t('Detection failed. Please try again.'));
      }
    } finally {
      setIsPredicting(false);
    }
  };

  const handleDeleteReport = async (id) => {
    try {
      setDeletingId(id);
      await diseaseReportAPI.deleteReport(id);
      setReports(prev => prev.filter(r => r._id !== id));
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  };

  const handleReset = () => {
    setSelectedCrop(null);
    setSelectedImage(null);
    setImagePreview(null);
    setPredictionResult(null);
    setError('');
    setMlOffline(false);
    setGeminiInfo(null);
    setGeminiError('');
    setDiseaseContext(''); // clear chatbot disease context
  };

  const cropInfo = selectedCrop && CROPS.find(c => c.id === selectedCrop.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 md:p-8">
      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin360 { to { transform:rotate(360deg); } }
        @keyframes pulse-ring { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.05); opacity:.85; } }
        .fade-up { animation: fadeSlideUp 0.4s ease both; }
        .spin { animation: spin360 0.9s linear infinite; }
        .crop-card { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .crop-card:hover { transform: translateY(-6px) scale(1.03); }
        .crop-card.selected { transform: translateY(-4px) scale(1.04); }
      `}</style>

      <div className="max-w-4xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="text-center mb-10 fade-up">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-2xl shadow-lg mb-4">
            <span className="text-2xl">🔬</span>
            <h1 className="text-2xl font-extrabold tracking-tight">{t('Crop Disease Detection')}</h1>
          </div>
          <p className="text-gray-600 text-base mt-2">
            {t('Select a crop and upload a photo to detect diseases using AI')}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-4 py-2 rounded-full">
            <span>🌾</span>
            {t('5 crops supported')}: Banana · Chilli · Radish · Groundnut · Cauliflower
          </div>
        </div>

        {/* ── STEP 1: Crop Selection ──────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8 mb-6 fade-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow">1</div>
            <h2 className="text-lg font-bold text-gray-900">{t('Select Your Crop')}</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {CROPS.map((crop) => {
              const isSelected = selectedCrop?.id === crop.id;
              return (
                <button
                  key={crop.id}
                  onClick={() => handleCropSelect(crop)}
                  className={`crop-card flex flex-col items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer focus:outline-none ${isSelected
                    ? `selected bg-gradient-to-br ${crop.bgLight} ${crop.border} shadow-lg ${crop.shadow}`
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-white'
                    }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-md bg-gradient-to-br ${crop.color}`}>
                    {crop.emoji}
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-bold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                      {t(crop.id)}
                    </p>
                    {isSelected && (
                      <span className="inline-block mt-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        ✓ {t('Selected')}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── STEP 2: Image Upload (shown after crop selection) ──────── */}
        {selectedCrop && (
          <div className={`bg-white rounded-3xl shadow-xl border-2 ${cropInfo?.border || 'border-green-200'} p-6 md:p-8 mb-6 fade-up`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow">2</div>
              <h2 className="text-lg font-bold text-gray-900">
                {t('Upload')} {t(selectedCrop.id)} {t('Image')}
              </h2>
              <span className="text-2xl">{selectedCrop.emoji}</span>
            </div>

            {!imagePreview ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Upload from gallery */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed hover:shadow-lg transition-all duration-200 bg-gradient-to-br ${cropInfo?.bgLight} ${cropInfo?.border} hover:scale-[1.02]`}
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cropInfo?.color} flex items-center justify-center shadow-lg`}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-800">{t('Upload from Gallery')}</p>
                    <p className="text-sm text-gray-500 mt-1">{t('JPG, PNG up to 10MB')}</p>
                  </div>
                </button>

                {/* Take photo with camera */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className={`group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:scale-[1.02]`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-800">{t('Take a Photo')}</p>
                    <p className="text-sm text-gray-500 mt-1">{t('Use your camera directly')}</p>
                  </div>
                </button>
              </div>
            ) : (
              /* Image preview + detect button */
              <div className="fade-up">
                <div className="relative rounded-2xl overflow-hidden shadow-lg mb-4 max-h-80 flex items-center justify-center bg-gray-900">
                  <img
                    src={imagePreview}
                    alt="Selected"
                    className="max-h-80 w-full object-contain"
                  />
                  <button
                    onClick={() => { setSelectedImage(null); setImagePreview(null); setPredictionResult(null); setError(''); }}
                    className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold transition-colors shadow"
                  >
                    ×
                  </button>
                </div>

                {/* ML Offline warning */}
                {mlOffline && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 fade-up">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <p className="font-bold text-red-800">{t('ML Server is Offline')}</p>
                        <p className="text-sm text-red-700 mt-1">
                          {t('Please start the ML server by running')}{' '}
                          <code className="bg-red-100 px-2 py-0.5 rounded font-mono text-xs">
                            cd crop_project &amp;&amp; python app.py
                          </code>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* General error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 fade-up">
                    <p className="text-red-800 font-semibold text-sm">⚠️ {error}</p>
                  </div>
                )}

                <button
                  onClick={handleDetect}
                  disabled={isPredicting}
                  className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-3 ${isPredicting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : `bg-gradient-to-r ${cropInfo?.color || 'from-green-500 to-emerald-600'} hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`
                    }`}
                >
                  {isPredicting ? (
                    <>
                      <svg className="spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t('Detecting Disease...')}
                    </>
                  ) : (
                    <>
                      <span>🔬</span>
                      {t('Detect Disease')}
                    </>
                  )}
                </button>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
          </div>
        )}

        {/* ── STEP 3: Results ────────────────────────────────────────── */}
        {predictionResult && (
          <div className={`bg-white rounded-3xl shadow-xl border-2 ${predictionResult.isHealthy ? 'border-green-400' : 'border-red-300'} p-6 md:p-8 mb-6 fade-up`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-8 h-8 text-white rounded-full flex items-center justify-center font-bold text-sm shadow ${predictionResult.isHealthy ? 'bg-green-500' : 'bg-red-500'}`}>
                {predictionResult.isHealthy ? '✓' : '!'}
              </div>
              <h2 className="text-lg font-bold text-gray-900">{t('Detection Result')}</h2>
            </div>

            <div className={`rounded-2xl p-6 mb-4 ${predictionResult.isHealthy ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200' : 'bg-gradient-to-br from-red-50 to-orange-50 border border-red-200'}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl">{selectedCrop?.emoji || '🌿'}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('Crop')}</p>
                  <p className="text-xl font-bold text-gray-900">{t(predictionResult.cropName)}</p>
                </div>
              </div>

              {/* Detection grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Disease/Status */}
                <div className={`p-4 rounded-xl ${(predictionResult.confidence < 50 || predictionResult.confidence === 100)
                  ? 'bg-gray-100'
                  : predictionResult.isHealthy ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                    {t('Detection')}
                  </p>
                  {(predictionResult.confidence < 50 || predictionResult.confidence === 100) ? (
                    <p className="text-xl font-extrabold text-gray-500">
                      🚫 {t('Not Detected')}
                    </p>
                  ) : (
                    <p className={`text-xl font-extrabold ${predictionResult.isHealthy ? 'text-green-800' : 'text-red-800'}`}>
                      {predictionResult.isHealthy ? '✅' : '🔴'} {t(predictionResult.prediction)}
                    </p>
                  )}
                </div>

                {/* Confidence */}
                <div className="p-4 rounded-xl bg-blue-50">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                    {t('Confidence')}
                  </p>
                  <p className="text-xl font-extrabold text-blue-800">
                    {predictionResult.confidence}%
                  </p>
                  <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(predictionResult.confidence, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Advisory – only for valid disease detections */}
              {!predictionResult.isHealthy
                && predictionResult.confidence >= 50
                && predictionResult.confidence !== 100
                && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl fade-up">
                    <p className="font-bold text-amber-900 flex items-center gap-2">
                      <span>💡</span> {t('Advisory')}
                    </p>
                    <p className="text-sm text-amber-800 mt-1">
                      {t('Please consult an agronomist or apply appropriate treatment for')} {t(predictionResult.prediction)}.
                    </p>
                  </div>
                )}

              {/* ── Invalid-image alert (confidence < 50 or exactly 100) ── */}
              {(predictionResult.confidence < 50 || predictionResult.confidence === 100) && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-400 rounded-xl fade-up flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">🚫</span>
                  <div>
                    <p className="font-bold text-red-800 text-sm">
                      {t('⚠️ Invalid or Unprocessable Image')}
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      {t('The uploaded image could not be processed reliably by the AI. Please upload a clear, well-lit photo of the crop leaf or plant for an accurate result.')}
                    </p>
                  </div>
                </div>
              )}

              {/* ── AI disclaimer – always shown ─────────────────────────── */}
              <div className="mt-4 p-4 bg-orange-50 border border-orange-300 rounded-xl fade-up flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">⚠️</span>
                <div>
                  <p className="font-bold text-orange-900 text-sm">
                    {t('AI Result Disclaimer')}
                  </p>
                  <p className="text-sm text-orange-800 mt-1">
                    {t('This prediction is generated by an AI model and may not always be accurate. Please verify the disease name and recommended treatment with a certified agronomist or agriculture expert before taking any action.')}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleReset}
                className="flex-1 min-w-[140px] py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                {t('Check Another Crop')}
              </button>
              <button
                onClick={() => setShowPreviousTests(true)}
                className="flex-1 min-w-[140px] py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>📋</span>{t('View All Reports')}
              </button>
            </div>
          </div>
        )}

        {/* ── Gemini AI Crop Info Panel ────────────────────────────────── */}
        {(geminiLoading || geminiInfo || geminiError) && (
          <div className="bg-white rounded-3xl shadow-xl border-2 border-purple-200 p-6 md:p-8 mb-6 fade-up">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-full flex items-center justify-center shadow text-lg">✨</div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t('AI Crop Information')}</h2>
                <p className="text-xs text-purple-600 font-medium">AI-powered crop disease insights</p>
              </div>
            </div>

            {/* Loading state */}
            {geminiLoading && (
              <div className="flex flex-col items-center justify-center py-10 gap-3 fade-up">
                <svg className="spin w-14 h-14 text-purple-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-purple-700 font-semibold text-sm">{t('Fetching AI crop information...')}</p>
                <p className="text-gray-400 text-xs">{t('This may take a few seconds')}</p>
              </div>
            )}

            {/* Error state */}
            {geminiError && !geminiLoading && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm fade-up">
                ⚠️ {geminiError}
              </div>
            )}

            {/* Info content */}
            {geminiInfo && !geminiLoading && (() => {
              const severityColors = {
                High: 'bg-red-100 text-red-800 border-red-300',
                Medium: 'bg-amber-100 text-amber-800 border-amber-300',
                Low: 'bg-green-100 text-green-800 border-green-300',
                None: 'bg-blue-100 text-blue-800 border-blue-300',
              };
              const sev = geminiInfo.severity || 'None';
              const sections = [
                { key: 'symptoms', label: '🔍 ' + t('Symptoms'), color: 'bg-red-50 border-red-200', dot: 'bg-red-400', items: geminiInfo.symptoms },
                { key: 'causes', label: '🦠 ' + t('Causes'), color: 'bg-orange-50 border-orange-200', dot: 'bg-orange-400', items: geminiInfo.causes },
                { key: 'whyCausesDisease', label: '❓ Why Does This Cause Disease?', color: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500', items: geminiInfo.whyCausesDisease },
                { key: 'treatment', label: '💊 ' + t('Treatment'), color: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500', items: geminiInfo.treatment },
                { key: 'prevention', label: '🛡️ ' + t('Prevention'), color: 'bg-green-50 border-green-200', dot: 'bg-green-500', items: geminiInfo.prevention },
                { key: 'naturalRemedies', label: '🌿 ' + t('Natural Remedies'), color: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', items: geminiInfo.naturalRemedies },
              ].filter(s => s.items && s.items.length > 0);
              return (
                <div className="space-y-5 fade-up">
                  {/* Title + severity badge */}
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-extrabold text-gray-900">{geminiInfo.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{geminiInfo.summary}</p>
                    </div>
                    {sev !== 'None' && (
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${severityColors[sev] || severityColors.None} flex-shrink-0`}>
                        {t('Severity')}: {sev}
                      </span>
                    )}
                  </div>

                  {/* Info sections */}
                  {sections.map(section => (
                    <div key={section.key} className={`rounded-2xl border p-4 ${section.color}`}>
                      <p className="font-bold text-gray-800 mb-3 text-sm">{section.label}</p>
                      <ul className="space-y-2">
                        {section.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className={`w-1.5 h-1.5 ${section.dot} rounded-full mt-1.5 flex-shrink-0`} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {/* Ask AI Button */}
                  <button
                    onClick={() =>
                      openChatbot(
                        `Tell me everything about ${predictionResult?.prediction || 'this disease'} in ${predictionResult?.cropName || 'this crop'} — causes, how to treat it, prevent it, and any organic remedies I can use.`
                      )
                    }
                    className="w-full mt-2 py-3.5 px-6 rounded-2xl font-bold text-sm text-white
                      bg-gradient-to-r from-violet-600 to-indigo-700
                      hover:from-violet-500 hover:to-indigo-600
                      shadow-lg hover:shadow-violet-300/60 hover:scale-[1.02] active:scale-[0.98]
                      transition-all duration-200 flex items-center justify-center gap-2.5"
                  >
                    <span className="text-lg">🌱</span>
                    <span>Ask AI Assistant about this Disease</span>
                    <span className="text-lg">→</span>
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    ✨ AI-powered analysis · Ask any follow-up question
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Previous Reports Toggle ─────────────────────────────────── */}
        {!predictionResult && (
          <div className="text-center mb-4">
            <button
              onClick={() => setShowPreviousTests(prev => !prev)}
              className="inline-flex items-center gap-2 text-green-700 font-semibold hover:text-green-900 underline underline-offset-4 transition-colors text-sm"
            >
              <span>📋</span>
              {showPreviousTests ? t('Hide Previous Reports') : t('View Previous Reports')}
              {reports.length > 0 && (
                <span className="bg-green-600 text-white text-xs rounded-full px-2 py-0.5 no-underline">
                  {reports.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* ── Previous Reports List ───────────────────────────────────── */}
        {showPreviousTests && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 fade-up">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <span>📋</span> {t('Disease Detection History')}
            </h3>

            {loadingReports ? (
              <div className="flex items-center justify-center py-10">
                <svg className="spin w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="ml-3 text-gray-500">{t('Loading reports...')}</span>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-3">🌿</div>
                <p className="text-gray-500">{t('No reports yet. Detect your first crop disease above!')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => {
                  const isHealthy = report.prediction?.toLowerCase().includes('healthy');
                  const cropMeta = CROPS.find(c => c.id?.toLowerCase() === report.cropName?.toLowerCase());
                  return (
                    <div
                      key={report._id}
                      className={`flex gap-4 items-start p-4 rounded-2xl border ${isHealthy ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                    >
                      {/* Crop image */}
                      {report.imageURL && (
                        <img
                          src={report.imageURL}
                          alt={report.cropName}
                          className="w-16 h-16 rounded-xl object-cover shadow flex-shrink-0"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{cropMeta?.emoji || '🌿'}</span>
                          <span className="font-bold text-gray-900">{t(report.cropName)}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isHealthy ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                            {isHealthy ? t('Healthy') : t('Disease Detected')}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{report.prediction}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500">
                            {t('Confidence')}: <strong>{report.confidence}%</strong>
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteReport(report._id)}
                        disabled={deletingId === report._id}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 flex-shrink-0"
                        title={t('Delete report')}
                      >
                        {deletingId === report._id ? (
                          <svg className="spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiseaseDetection;
