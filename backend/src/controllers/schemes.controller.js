import { getEligibleSchemes } from '../services/gemini.service.js';
import axios from 'axios';
import FormData from 'form-data';

const ML_SERVER_URL = process.env.ML_SERVER_URL || 'http://localhost:8000';
const LANG_MAP = { en: 'English', hi: 'Hindi', mr: 'Marathi' };

/**
 * POST /api/v1/schemes/eligibility
 * Body: { state, crop, landSize, category, language }
 * Returns: { success, data: { schemes, aiGuidance, videos } }
 */
export const checkEligibility = async (req, res) => {
  try {
    const { state, crop, landSize, category, soilType, language = 'en' } = req.body;

    if (!state || !crop || !landSize || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide state, crop, landSize and category.',
      });
    }

    const languageName = LANG_MAP[language] || 'English';

    // Fetch schemes + YouTube videos in parallel
    const results = await Promise.allSettled([
      getEligibleSchemes(
        { state, crop, landSize, category, soilType },
        language,
        req.user?.groqApiKey || null
      ),
      // Scheme application / benefit videos (language-aware query)
      (async () => {
        const SCHEME_QUERIES = {
          English: `${crop} farmer government scheme subsidy ${state} India`,
          Hindi: `${crop} किसान सरकारी योजना सब्सिडी ${state} भारत`,
          Marathi: `${crop} शेतकरी सरकारी योजना अनुदान ${state} भारत`,
        };
        const fd = new FormData();
        fd.append('query', SCHEME_QUERIES[languageName] || SCHEME_QUERIES.English);
        fd.append('language', languageName);
        fd.append('max_duration', '20');
        const mlRes = await axios.post(`${ML_SERVER_URL}/youtube-search`, fd, {
          headers: fd.getHeaders(),
          timeout: 12000,
        });
        return mlRes.data?.success ? mlRes.data.videos : [];
      })(),
      // How-to-apply / benefit-related videos (language-aware query)
      (async () => {
        const HOW_TO_QUERIES = {
          English: `how to apply PM Kisan PMFBY KCC farmer scheme benefits ${state}`,
          Hindi: `PM किसान PMFBY KCC योजना आवेदन कैसे करें ${state}`,
          Marathi: `PM किसान PMFBY KCC योजना अर्ज कसा करावा ${state}`,
        };
        const fd = new FormData();
        fd.append('query', HOW_TO_QUERIES[languageName] || HOW_TO_QUERIES.English);
        fd.append('language', languageName);
        fd.append('max_duration', '20');
        const mlRes = await axios.post(`${ML_SERVER_URL}/youtube-search`, fd, {
          headers: fd.getHeaders(),
          timeout: 12000,
        });
        return mlRes.data?.success ? mlRes.data.videos : [];
      })(),
    ]);

    const schemesData = results[0].status === 'fulfilled' ? results[0].value : { schemes: [], aiGuidance: '' };
    const schemeVideos = results[1].status === 'fulfilled' ? results[1].value : [];
    const howToVideos = results[2].status === 'fulfilled' ? results[2].value : [];

    // Log for debugging
    console.log(`[Schemes] State: ${state}, Crop: ${crop}, Category: ${category}`);
    console.log(`[Scheme Videos]: ${schemeVideos.length} found. Status: ${results[1].status}`);
    console.log(`[How-To Videos]: ${howToVideos.length} found. Status: ${results[2].status}`);

    if (results[0].status === 'rejected') console.error('[Schemes] AI Error:', results[0].reason?.message);
    if (results[1].status === 'rejected') console.error('[Schemes] YouTube Search 1 Error:', results[1].reason?.message);
    if (results[2].status === 'rejected') console.error('[Schemes] YouTube Search 2 Error:', results[2].reason?.message);

    res.json({
      success: true,
      data: {
        ...schemesData,
        videos: schemeVideos,
        howToVideos,
      },
    });
  } catch (error) {
    console.error('[Schemes] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch eligible schemes. Please try again.',
    });
  }
};

/**
 * POST /api/v1/schemes/how-to-apply
 * Body: { schemeName, language }
 * Returns: { success, video } — best YouTube video for applying to a specific scheme
 */
export const getHowToApplyVideo = async (req, res) => {
  try {
    const { schemeName, language = 'en' } = req.body;

    if (!schemeName) {
      return res.status(400).json({ success: false, message: 'schemeName is required.' });
    }

    const languageName = LANG_MAP[language] || 'English';

    const fd = new FormData();
    fd.append('query', `how to apply ${schemeName} scheme India step by step`);
    fd.append('language', languageName);
    fd.append('max_duration', '20');

    const mlRes = await axios.post(`${ML_SERVER_URL}/youtube-search`, fd, {
      headers: fd.getHeaders(),
      timeout: 12000,
    });

    const videos = mlRes.data?.success ? mlRes.data.videos : [];

    console.log(`[How-To-Apply] Scheme: "${schemeName}", Lang: ${languageName}, Videos: ${videos.length}`);

    res.json({ success: true, video: videos[0] || null, videos });
  } catch (error) {
    console.error('[How-To-Apply] Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to find video.' });
  }
};
