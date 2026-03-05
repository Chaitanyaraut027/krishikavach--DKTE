import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
];

const STORAGE_KEY = 'appLanguage';

// ── Static overrides — these are NEVER sent to the API ────────────────────
// Key: "en::targetLang::string"
// This prevents API quota warnings and ensures correct native terms.
const STATIC_TRANSLATIONS = {
    // Hindi overrides
    'hi::Agronomist': 'कृषि विशेषज्ञ',
    'hi::Agronomists': 'कृषि विशेषज्ञ',
    'hi::Farmer': 'किसान',
    'hi::Admin': 'व्यवस्थापक',
    'hi::My Crops': 'मेरी फसलें',
    'hi::Disease Reports': 'रोग रिपोर्ट',
    'hi::Market': 'बाजार',
    'hi::Market Prices': 'बाजार भाव',
    'hi::Crop Management': 'फसल प्रबंधन',
    'hi::Crop Guide': 'फसल गाइड',
    'hi::Select Your Crop': 'अपनी फसल चुनें',
    'hi::Enter Your Land Area': 'अपनी भूमि का क्षेत्र दर्ज करें',
    'hi::Get AI Crop Management Guide': 'AI फसल प्रबंधन गाइड पाएं',
    'hi::Add Crop': 'फसल जोड़ें',
    'hi::Crop Name': 'फसल का नाम',
    'hi::Area': 'क्षेत्र',
    'hi::Unit': 'इकाई',
    'hi::Planting Date': 'बीजाई की तारीख',
    'hi::No crops added yet.': 'अभी तक कोई फसल नहीं जोड़ी गई।',
    'hi::Go to Crop Guide': 'फसल गाइड पर जाएं',
    'hi::See Crop Guide': 'फसल गाइड देखें',
    'hi::View My Crops': 'मेरी फसलें देखें',
    'hi::Farm Intelligence': 'खेत बुद्धिमत्ता',
    'hi::Crop Impact': 'फसल प्रभाव',
    'hi::Weather Impact on Your Crop': 'आपकी फसल पर मौसम का प्रभाव',
    'hi::7-Day Forecast': '7-दिवसीय पूर्वानुमान',
    'hi::Add New Crop': 'नई फसल जोड़ें',
    'hi::Add Your First Crop': 'अपनी पहली फसल जोड़ें',
    'hi::Your Crops': 'आपकी फसलें',
    'hi::Immediate Actions': 'तुरंत कार्रवाई',
    'hi::Key Risks This Week': 'इस सप्ताह के मुख्य जोखिम',
    'hi::7-Day Crop Advisory': '7-दिवसीय फसल सलाह',
    'hi::Tap to See Prices': 'कीमतें देखने के लिए टैप करें',
    'hi::Find Prices for Any Commodity': 'किसी भी जिंस के लिए कीमतें खोजें',
    'hi::Get Prices': 'कीमतें पाएं',
    'hi::Market Trends': 'बाजार रुझान',
    'hi::Govt Schemes': 'सरकारी योजनाएं',
    'hi::Search Any Commodity': 'कोई भी जिंस खोजें',
    // Marathi overrides
    'mr::Agronomist': 'कृषी तज्ज्ञ',
    'mr::Agronomists': 'कृषी तज्ज्ञ',
    'mr::agronomist': 'कृषी तज्ज्ञ',
    'mr::Agronomists in Your District': 'तुमच्या जिल्ह्यातील कृषी तज्ज्ञ',
    'mr::Connect with verified agronomists available in your district for quick advice':
        'त्वरित सल्ल्यासाठी तुमच्या जिल्ह्यातील सत्यापित कृषी तज्ज्ञांशी संपर्क साधा',
    'mr::Farmer': 'शेतकरी',
    'mr::Admin': 'प्रशासक',
    'mr::Dashboard': 'डॅशबोर्ड',
    'mr::My Crops': 'माझी पिके',
    'mr::Disease Reports': 'रोग अहवाल',
    'mr::Weather': 'हवामान',
    'mr::Market': 'बाजार',
    'mr::Profile': 'प्रोफाइल',
    'mr::Market Prices': 'बाजार भाव',
    'mr::Crop Management': 'पीक व्यवस्थापन',
    'mr::Crop Guide': 'पीक मार्गदर्शिका',
    'mr::Select Your Crop': 'तुमचे पीक निवडा',
    'mr::Enter Your Land Area': 'तुमच्या जमिनीचे क्षेत्र प्रविष्ट करा',
    'mr::Get AI Crop Management Guide': 'AI पीक व्यवस्थापन मार्गदर्शिका मिळवा',
    'mr::Add Crop': 'पीक जोडा',
    'mr::Crop Name': 'पिकाचे नाव',
    'mr::Area': 'क्षेत्र',
    'mr::Unit': 'एकक',
    'mr::Planting Date': 'लागवड तारीख',
    'mr::No crops added yet.': 'अद्याप कोणतेही पीक जोडले नाही.',
    'mr::Go to Crop Guide': 'पीक मार्गदर्शिकेकडे जा',
    'mr::See Crop Guide': 'पीक मार्गदर्शिका पहा',
    'mr::View My Crops': 'माझी पिके पहा',
    'mr::Farm Intelligence': 'शेत बुद्धिमत्ता',
    'mr::Crop Impact': 'पीक परिणाम',
    'mr::Weather Impact on Your Crop': 'तुमच्या पिकावर हवामानाचा परिणाम',
    'mr::7-Day Forecast': '7-दिवसीय अंदाज',
    'mr::Add New Crop': 'नवीन पीक जोडा',
    'mr::Add Your First Crop': 'तुमचे पहिले पीक जोडा',
    'mr::Your Crops': 'तुमची पिके',
    'mr::Immediate Actions': 'तात्काळ कृती',
    'mr::Key Risks This Week': 'या आठवड्यातील मुख्य धोके',
    'mr::7-Day Crop Advisory': '7-दिवसीय पीक सल्ला',
    'mr::Tap to See Prices': 'किंमती पाहण्यासाठी टॅप करा',
    'mr::Find Prices for Any Commodity': 'कोणत्याही वस्तूसाठी किंमती शोधा',
    'mr::Get Prices': 'किंमती मिळवा',
    'mr::Market Trends': 'बाजार ट्रेंड',
    'mr::Govt Schemes': 'सरकारी योजना',
    'mr::Search Any Commodity': 'कोणतीही वस्तू शोधा',
    // Government Schemes overrides
    'hi::How to Apply': 'आवेदन कैसे करें',
    'hi::Government Schemes': 'सरकारी योजनाएं',
    'hi::Eligible Schemes': 'पात्र योजनाएं',
    'hi::Recommended Scheme Videos': 'सरकारी योजना वीडियो',
    'hi::How to Apply for Schemes': 'योजनाओं के लिए आवेदन कैसे करें',
    'hi::Step-by-step guides to help you apply': 'आवेदन करने में मदद के लिए चरण-दर-चरण मार्गदर्शिका',
    'hi::View Details': 'विवरण देखें',
    'hi::Apply Now': 'अभी आवेदन करें',
    'hi::Why You Qualify': 'आप पात्र क्यों हैं',
    'hi::Show Less': 'कम दिखाएं',
    'hi::Eligible': 'पात्र',
    'mr::How to Apply': 'अर्ज कसा करावा',
    'mr::Government Schemes': 'सरकारी योजना',
    'mr::Eligible Schemes': 'पात्र योजना',
    'mr::Recommended Scheme Videos': 'सरकारी योजना व्हिडिओ',
    'mr::How to Apply for Schemes': 'योजनांसाठी अर्ज कसा करावा',
    'mr::Step-by-step guides to help you apply': 'अर्ज करण्यासाठी चरण-दर-चरण मार्गदर्शन',
    'mr::View Details': 'तपशील पहा',
    'mr::Apply Now': 'आत्ता अर्ज करा',
    'mr::Why You Qualify': 'तुम्ही पात्र का आहात',
    'mr::Show Less': 'कमी दाखवा',
    'mr::Eligible': 'पात्र',
    // Schemes form & misc
    'hi::Find eligible central & state schemes for your farm': 'अपने खेत के लिए पात्र केंद्रीय और राज्य योजनाएं खोजें',
    'hi::Enter Your Details': 'अपना विवरण दर्ज करें',
    'hi::State': 'राज्य',
    'hi::Select your state': 'अपना राज्य चुनें',
    'hi::Primary Crop': 'मुख्य फसल',
    'hi::Select your crop': 'अपनी फसल चुनें',
    'hi::Land Size (acres)': 'भूमि का आकार (एकड़)',
    'hi::Category': 'श्रेणी',
    'hi::Select category': 'श्रेणी चुनें',
    'hi::Find Eligible Schemes': 'पात्र योजनाएं खोजें',
    'hi::Finding Schemes...': 'योजनाएं खोज रहे हैं...',
    'hi::AI Guidance': 'AI मार्गदर्शन',
    'hi::Please fill all fields.': 'कृपया सभी फ़ील्ड भरें।',
    'hi::Failed to fetch schemes. Please try again.': 'योजनाएं प्राप्त करने में विफल। कृपया पुनः प्रयास करें।',
    'hi::Deadline': 'समय सीमा',
    'hi::Required Documents': 'आवश्यक दस्तावेज़',
    'hi::Apply on Official Website': 'आधिकारिक वेबसाइट पर आवेदन करें',
    'hi::Estimated Benefit': 'अनुमानित लाभ',
    'hi::Close': 'बंद करें',
    'hi::Learn about government schemes for your crop & state': 'अपनी फसल और राज्य के लिए सरकारी योजनाओं के बारे में जानें',
    'hi::General': 'सामान्य',
    'hi::SC (Scheduled Caste)': 'SC (अनुसूचित जाति)',
    'hi::ST (Scheduled Tribe)': 'ST (अनुसूचित जनजाति)',
    'hi::OBC (Other Backward Class)': 'OBC (अन्य पिछड़ा वर्ग)',
    'hi::Small / Marginal Farmer': 'लघु / सीमांत किसान',
    'hi::Women Farmer': 'महिला किसान',
    'hi::e.g. 2.5': 'जैसे 2.5',
    'hi::views': 'व्यूज़',
    // Soil Types
    'hi::Black Soil': 'काली मिट्टी',
    'hi::Alluvial Soil': 'जलोढ़ मिट्टी',
    'hi::Red Soil': 'लाल मिट्टी',
    'hi::Laterite Soil': 'लैटराइट मिट्टी',
    'hi::Sandy Soil': 'रेतीली मिट्टी',
    'hi::Clayey Soil': 'चिकनी मिट्टी',
    'hi::Loamy Soil': 'दोमट मिट्टी',
    'hi::Saline Soil': 'खारी मिट्टी',
    'hi::Peaty Soil': 'पीट मिट्टी',
    'hi::Mountain Soil': 'पर्वतीय मिट्टी',
    'hi::Desert Soil': 'रेगिस्तानी मिट्टी',
    'hi::Select Soil Type': 'मिट्टी का प्रकार चुनें',
    // Irrigation
    'hi::Drip Irrigation': 'ड्रिप सिंचाई (टपक सिंचाई)',
    'hi::Sprinkler': 'फव्वारा सिंचाई',
    'hi::Borewell': 'बोरवेल',
    'hi::Canal': 'नहर',
    'hi::Rain-fed': 'वर्षा आधारित',
    'hi::Well': 'कुआं',
    'hi::Tank / Pond': 'टैंक / तालाब',
    'hi::Select Irrigation': 'सिंचाई का प्रकार चुनें',
    'hi::Please fill in all basic information': 'कृपया सभी बुनियादी जानकारी भरें',
    'hi::Next Step': 'अगला कदम',
    'hi::Back': 'पीछे',
    'hi::Save My Information': 'मेरी जानकारी सहेजें',
    'hi::Get Recommendations': 'सिफारिशें प्राप्त करें',
    'hi::Complete Your Profile': 'अपनी प्रोफाइल पूरी करें',
    'hi::Tell us about your farm for smarter AI recommendations': 'बेहतर AI सिफारिशों के लिए हमें अपने खेत के बारे में बताएं',
    'hi::Total Farm Area': 'कुल कृषि क्षेत्र',
    'hi::Farming Experience (Years)': 'खेती का अनुभव (वर्ष)',
    'hi::What do you grow primarily?': 'आप मुख्य रूप से क्या उगाते हैं?',
    'hi::Current Farming Stage': 'वर्तमान खेती का चरण',
    'hi::Recommended Seeds': 'अनुशंसित बीज',
    'hi::Yield Insights': 'उपज अंतर्दृष्टि',
    'hi::Benchmark Expectation': 'बेंचमार्क अपेक्षा',
    'hi::Please select at least one crop': 'कृपया कम से कम एक फसल चुनें',

    'mr::Find eligible central & state schemes for your farm': 'तुमच्या शेतासाठी पात्र केंद्रीय आणि राज्य योजना शोधा',
    'mr::Enter Your Details': 'तुमचा तपशील प्रविष्ट करा',
    'mr::State': 'राज्य',
    'mr::Select your state': 'तुमचे राज्य निवडा',
    'mr::Primary Crop': 'मुख्य पीक',
    'mr::Select your crop': 'तुमचे पीक निवडा',
    'mr::Land Size (acres)': 'जमिनीचा आकार (एकर)',
    'mr::Category': 'प्रवर्ग',
    'mr::Select category': 'प्रवर्ग निवडा',
    'mr::Find Eligible Schemes': 'पात्र योजना शोधा',
    'mr::Finding Schemes...': 'योजना शोधत आहे...',
    'mr::AI Guidance': 'AI मार्गदर्शन',
    'mr::Please fill all fields.': 'कृपया सर्व फील्ड भरा.',
    'mr::Failed to fetch schemes. Please try again.': 'योजना मिळवण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.',
    'mr::Deadline': 'अंतिम मुदत',
    'mr::Required Documents': 'आवश्यक कागदपत्रे',
    'mr::Apply on Official Website': 'अधिकृत वेबसाइटवर अर्ज करा',
    'mr::Estimated Benefit': 'अंदाजित लाभ',
    'mr::Close': 'बंद करा',
    'mr::Learn about government schemes for your crop & state': 'तुमच्या पिकासाठी आणि राज्यासाठी सरकारी योजनांबद्दल जाणून घ्या',
    'mr::General': 'सामान्य',
    'mr::SC (Scheduled Caste)': 'SC (अनुसूचित जाती)',
    'mr::ST (Scheduled Tribe)': 'ST (अनुसूचित जमाती)',
    'mr::OBC (Other Backward Class)': 'OBC (इतर मागासवर्ग)',
    'mr::Small / Marginal Farmer': 'लहान / अत्यल्प भूधारक शेतकरी',
    'mr::Women Farmer': 'महिला शेतकरी',
    'mr::e.g. 2.5': 'उदा. 2.5',
    'mr::views': 'व्ह्यूज',
    // Soil Types
    'mr::Black Soil': 'काळी माती',
    'mr::Alluvial Soil': 'गाळाची माती',
    'mr::Red Soil': 'लाल माती',
    'mr::Laterite Soil': 'जांभी माती',
    'mr::Sandy Soil': 'रेताड माती',
    'mr::Clayey Soil': 'चिकन माती',
    'mr::Loamy Soil': 'लोमी (दुमट) माती',
    'mr::Saline Soil': 'खारवट माती',
    'mr::Peaty Soil': 'पीटी (कुजलेली) माती',
    'mr::Mountain Soil': 'पर्वतीय माती',
    'mr::Desert Soil': 'वाळवंटी माती',
    'mr::Select Soil Type': 'मातीचा प्रकार निवडा',
    // Irrigation
    'mr::Drip Irrigation': 'ठिबक सिंचन',
    'mr::Sprinkler': 'तुषार सिंचन',
    'mr::Borewell': 'बोअरवेल',
    'mr::Canal': 'कालवा',
    'mr::Rain-fed': 'जिरायती (पावसावर आधारित)',
    'mr::Well': 'विहीर',
    'mr::Tank / Pond': 'तलाव / शेततळे',
    'mr::Select Irrigation': 'सिंचनाचा प्रकार निवडा',
    'mr::Please fill in all basic information': 'कृपया सर्व मूलभूत माहिती भरा',
    'mr::Next Step': 'पुढील पायरी',
    'mr::Back': 'मागे',
    'mr::Save My Information': 'माझी माहिती जतन करा',
    'mr::Get Recommendations': 'शिफारसी मिळवा',
    'mr::Complete Your Profile': 'तुमची प्रोफाइल पूर्ण करा',
    'mr::Tell us about your farm for smarter AI recommendations': 'स्मार्ट AI शिफारसींसाठी आम्हाला तुमच्या शेतीबद्दल सांगा',
    'mr::Total Farm Area': 'एकूण शेती क्षेत्र',
    'mr::Farming Experience (Years)': 'शेतीचा अनुभव (वर्षे)',
    'mr::What do you grow primarily?': 'तुम्ही प्रामुख्याने काय पिकवता?',
    'mr::Current Farming Stage': 'सध्याची शेतीची पायरी',
    'mr::Recommended Seeds': 'शिफारस केलेले बियाणे',
    'mr::Yield Insights': 'उत्पन्न अंतर्दृष्टी',
    'mr::Benchmark Expectation': 'बेंचमार्क अपेक्षा',
    'mr::Please select at least one crop': 'कृपया किमान एक पीक निवडा',
};

// MyMemory free API — 500 chars/request limit
const MYMEMORY_LIMIT = 490;

// ── Cache helpers ──────────────────────────────────────────────────────────
const CACHE_VERSION = 'v2'; // bump this to clear all old cached translations
const CACHE_KEY = `translationCache_${CACHE_VERSION}`;

const getCache = () => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); }
    catch { return {}; }
};
const saveCache = (cache) => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); }
    catch { }
};

// Clear any old cache versions silently
try {
    ['translationCache', 'translationCache_v1'].forEach(k => {
        if (localStorage.getItem(k)) localStorage.removeItem(k);
    });
} catch { }


const translationCache = getCache();

/**
 * Translate a single string via MyMemory API.
 * - Returns static override if available.
 * - Returns original text if lang='en', text is empty, or text exceeds 490 chars.
 * - Strips MyMemory warning/error responses and falls back to original text.
 */
const translateText = async (text, targetLang) => {
    if (!text || targetLang === 'en') return text;
    // Skip very long strings — they exceed MyMemory's limit and generate warnings
    if (text.length > MYMEMORY_LIMIT) return text;

    // Check static overrides first
    const staticKey = `${targetLang}::${text}`;
    if (STATIC_TRANSLATIONS[staticKey]) return STATIC_TRANSLATIONS[staticKey];

    // Check in-memory + localStorage cache
    const cacheKey = `${targetLang}::${text}`;
    if (translationCache[cacheKey]) return translationCache[cacheKey];

    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
        const res = await fetch(url);
        const json = await res.json();
        const translated = json?.responseData?.translatedText;
        const responseStatus = json?.responseStatus;

        // MyMemory returns 206 or warning text when quota is hit.
        // Detect these cases and fall back to original text.
        if (
            !translated ||
            responseStatus === 206 ||
            (typeof translated === 'string' && (
                translated.toUpperCase().includes('MYMEMORY WARNING') ||
                translated.toUpperCase().includes('QUERY LENGTH') ||
                translated.toUpperCase().includes('USAGE LIMIT') ||
                translated.toUpperCase().includes('YOU USED FREE') ||
                translated.toUpperCase().includes('PLEASE SELECT') ||
                translated === text // no-op translation
            ))
        ) {
            return text;
        }

        translationCache[cacheKey] = translated;
        saveCache(translationCache);
        return translated;
    } catch {
        return text;
    }
};

// ── Context ────────────────────────────────────────────────────────────────
const LanguageContext = createContext(null);

export const useLanguage = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
    return ctx;
};

export const LanguageProvider = ({ children }) => {
    const storedLang = localStorage.getItem(STORAGE_KEY) || null;
    const [lang, setLang] = useState(storedLang || 'en');

    const needsLanguageSelect = sessionStorage.getItem('showLanguageSelectOnce') === 'true';
    const [hasChosen, setHasChosen] = useState(!needsLanguageSelect);

    const [translations, setTranslations] = useState({});
    const [translating, setTranslating] = useState(false);

    const batchTranslate = useCallback(async (strings, targetLang) => {
        if (targetLang === 'en') {
            const map = {};
            strings.forEach(s => { map[s] = s; });
            return map;
        }
        // Filter out strings that are too long for MyMemory
        const translatable = strings.filter(s => s && s.length <= MYMEMORY_LIMIT);
        const results = await Promise.all(translatable.map(s => translateText(s, targetLang)));
        const map = {};
        translatable.forEach((s, i) => { map[s] = results[i]; });
        // Long strings fall back to English (original text)
        strings.filter(s => s && s.length > MYMEMORY_LIMIT).forEach(s => { map[s] = s; });
        return map;
    }, []);

    /**
     * t(text) — returns translated text synchronously.
     * Checks static overrides first, then the translations map.
     */
    const t = useCallback((text) => {
        if (!text) return '';
        if (lang === 'en') return text;
        // Check static overrides first (instant, no API hit)
        const staticKey = `${lang}::${text}`;
        if (STATIC_TRANSLATIONS[staticKey]) return STATIC_TRANSLATIONS[staticKey];
        return translations[text] || text;
    }, [lang, translations]);

    const selectLanguage = useCallback((code) => {
        localStorage.setItem(STORAGE_KEY, code);
        sessionStorage.removeItem('showLanguageSelectOnce');
        setLang(code);
        setHasChosen(true);
    }, []);

    // ── UI strings to pre-translate (all under 490 chars) ─────────────────
    const UI_STRINGS = [
        // Navbar
        'Dashboard', 'Profile', 'Logout', 'Crops', 'Disease Reports',
        'Weather', 'Advisories', 'Farmers', 'Agronomists',
        // Home
        'Crop Disease Detection',
        'Choose Your Role', 'Farmer', 'Agronomist', 'Admin',
        'Manage your crops, track diseases, and get expert agricultural advice',
        'Help farmers with your expertise and manage agricultural consultations',
        'Manage the platform, verify users, and oversee system operations',
        'Get Started', 'Go to Dashboard',
        'Crop Management', 'Track and manage your crops efficiently',
        'Weather Forecast', 'Get accurate weather predictions for your farm',
        'Expert Advice', 'Connect with verified agronomists in your area',
        // Login
        'Sign in to your account',
        'Mobile Number', 'Password', 'Sign In', 'Signing in...',
        "Don't have an account?", 'Register',
        // Register
        'Create Your Account',
        'Full Name', 'Role', 'Qualification', 'Experience (Years)',
        'ID Proof Document', 'ID proof is required for agronomist registration.',
        'Registering...', 'Already have an account?',
        'Select Your Location (Required)',
        'Selected Location', 'Detecting district & taluka…', 'District', 'Taluka',
        'Mobile number is required', 'Mobile number must be exactly 10 digits',
        // Profile
        'Profile', 'Location', 'Change Password', 'Update Profile',
        'Full Name', 'Mobile Number', 'Language', 'Upload Photo', 'Delete Photo',
        'Profile Photo', 'Profile updated successfully', 'Password changed successfully',
        'Photo uploaded successfully', 'Photo deleted successfully',
        'Current Password', 'New Password', 'Confirm New Password',
        'New passwords do not match', 'Failed to fetch profile',
        'Language Settings', 'Save Language', 'Language updated successfully!',
        // Farmer Dashboard
        'Farmer Dashboard', 'Manage your farm, track crops, and get expert advice',
        'Agronomists in Your District',
        'Connect with verified agronomists available in your district for quick advice',
        'No agronomists available in your district.',
        'Check back later or contact support.', 'Please Update Your Location',
        'Update Location',
        // Location
        'Update Your Location',
        'Use My Current Location', 'Detecting Location...', 'Update Location',
        'Updating...', 'Selected Location', 'Detecting address...',
        'Location updated successfully! Redirecting to dashboard...',
        // Location Alert Modal
        'Keep your location up to date for every session',
        'Why set your location?', 'Weather forecasts',
        'Find agronomists', 'Connect with experts in your district',
        'Local advisories', 'Receive farming tips for your area',
        'Reminder:', 'Update Location Now', 'Skip',
        // Unauthorized
        'Unauthorized Access', "You don't have permission to access this page.", 'Go Home',
        // Weather
        'Farm Weather Information',
        'Refresh Weather', 'Refreshing...', '7-Day Weather Forecast', 'Today', 'Tomorrow',
        'Humidity', 'Wind Speed', 'Precipitation', 'Updated', 'Feels like', 'chance',
        // Disease Detection
        'Select a crop and upload a photo to detect diseases using AI',
        '5 crops supported',
        'Select Your Crop', 'Selected', 'Upload', 'Image',
        'Upload from Gallery', 'JPG, PNG up to 10MB',
        'Take a Photo', 'Use your camera directly',
        'Detecting Disease...', 'Detect Disease',
        'Image size should be less than 10MB',
        'Detection failed. Please try again.',
        'ML Server is Offline',
        'Please start the ML server by running',
        'Detection Result', 'Crop', 'Detection', 'Confidence', 'Advisory',
        'Please consult an agronomist or apply appropriate treatment for',
        'Check Another Crop', 'View All Reports',
        'View Previous Reports', 'Hide Previous Reports',
        'Disease Detection History', 'Loading reports...',
        'No reports yet. Detect your first crop disease above!',
        'Healthy', 'Disease Detected', 'Delete report',
        'AI Result Disclaimer', 'AI Crop Information',
        'Fetching AI crop information...', 'This may take a few seconds',
        'Symptoms', 'Causes', 'Treatment', 'Prevention', 'Natural Remedies', 'Severity',
        // Crop names
        'Banana', 'Chilli', 'Radish', 'Groundnut', 'Cauliflower',
        // Market
        'Market Prices', 'My Crops & Prices', 'Search commodity...',
        'Market Trends', 'Govt Schemes',
        // Crops page
        'Crop Management', 'Select any crop, enter your land area, and get a complete AI-powered management guide',
        'Crop Guide', 'My Crops', 'Select Your Crop', 'OR type your crop', 'Type any crop name',
        'Selected', 'Enter Your Land Area', 'Enter area', 'Get AI Crop Management Guide',
        'Generating Management Guide...', 'View My Crops', 'Cancel', 'Add Crop',
        'Crop Name', 'Variety', 'Planting Date', 'Area', 'Unit', 'Add Crop to My List',
        'No crops added yet.', 'Generate a crop guide above — it saves automatically!',
        'Go to Crop Guide', 'See Crop Guide',
        // Weather page
        'Farm Intelligence', 'Crop Impact', 'Select a crop from your farm to see real-time weather impact analysis',
        "Fetching your farm's weather data…", 'Wind', 'Feels Like', 'Refresh', '7-Day Forecast',
        'Weather Impact on Your Crop', "Choose a crop from your farm to analyse how today's weather affects it",
        'Add New Crop', 'Add Crop for Weather Analysis', 'Add Crop & Save to Crop Management',
        'This crop will also appear in your', 'section',
        'No crops in your farm yet', 'Add your first crop above to analyse weather impact',
        'Add Your First Crop', 'Your Crops', 'tap to select for analysis',
        'Analyse Weather Impact on', 'Select a crop above to analyse',
        'Immediate Actions', 'Key Risks This Week', '7-Day Crop Advisory',
        // Market page extra
        'Tap to See Prices', 'No crops added yet', 'Add crops in', 'to see live market prices here.',
        'Showing', 'Price', 'Search Any Commodity', 'Find Prices for Any Commodity', 'Get Prices',
        'Adding…',
        // Government Schemes page
        'Government Schemes', 'Find government schemes you are eligible for',
        'Select State', 'Primary Crop', 'Land Size (acres)', 'Farmer Category',
        'Enter crop name', 'e.g. 5', 'General', 'SC/ST', 'OBC', 'Small/Marginal',
        'Search Eligible Schemes', 'Searching schemes...',
        'Please fill all fields.',
        'No schemes found for the given criteria. Try adjusting your inputs.',
        'AI Guidance', 'Eligible Schemes', 'Eligible',
        'View Details', 'Apply Now', 'How to Apply', 'Why You Qualify', 'Show Less',
        'Recommended Scheme Videos', 'Learn about government schemes for your crop & state',
        'How to Apply for Schemes', 'Step-by-step guides to help you apply',
        'Scheme Details', 'Description', 'Why You Are Eligible', 'Estimated Benefit',
        'Application Deadline', 'Required Documents', 'Apply Online', 'Close',
        'views',
        // Schemes form & categories
        'Find eligible central & state schemes for your farm',
        'Enter Your Details', 'State', 'Select your state',
        'Primary Crop', 'Select your crop', 'Land Size (acres)', 'Category', 'Select category',
        'Find Eligible Schemes', 'Finding Schemes...', 'AI Guidance',
        'Please fill all fields.', 'Failed to fetch schemes. Please try again.',
        'Deadline', 'Apply on Official Website', 'e.g. 2.5',
        'General', 'SC (Scheduled Caste)', 'ST (Scheduled Tribe)',
        'OBC (Other Backward Class)', 'Small / Marginal Farmer', 'Women Farmer',
        // Soil Types
        'Black Soil', 'Alluvial Soil', 'Red Soil', 'Laterite Soil', 'Sandy Soil',
        'Clayey Soil', 'Loamy Soil', 'Saline Soil', 'Peaty Soil', 'Mountain Soil', 'Desert Soil',
        'Select Soil Type',
        // Irrigation Types
        'Well', 'Tank / Pond', 'Select Irrigation',
        'Please fill in all basic information', 'Next Step', 'Back', 'Save My Information',
        'Get Recommendations', 'Complete Your Profile', 'Tell us about your farm for smarter AI recommendations',
        'Total Farm Area', 'Farming Experience (Years)', 'What do you grow primarily?',
        'Current Farming Stage', 'Recommended Seeds', 'Yield Insights', 'Benchmark Expectation',
        'Please select at least one crop',
    ];

    useEffect(() => {
        if (lang === 'en') {
            setTranslations({});
            return;
        }
        setTranslating(true);
        batchTranslate(UI_STRINGS, lang).then(map => {
            setTranslations(map);
            setTranslating(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lang]);

    return (
        <LanguageContext.Provider value={{
            lang,
            hasChosen,
            t,
            translating,
            selectLanguage,
            SUPPORTED_LANGUAGES,
        }}>
            {children}
        </LanguageContext.Provider>
    );
};
