/**
 * AI service — uses Google Gemini 1.5 Pro API.
 * GEMINI_API_KEY in .env must be your Google AI key.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

const LANGUAGE_NAMES = {
  en: "English",
  hi: "Hindi (हिंदी)",
  mr: "Marathi (मराठी)",
  hinglish: "Hinglish",
};

const createClient = (userApiKey = null) => {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No Gemini API key found. Please configure it in your profile.");
  return new GoogleGenerativeAI(apiKey);
};

const stripFences = (text) =>
  text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

const DEVANAGARI_DIGIT_MAP = {
  '\u0966': '0', '\u0967': '1', '\u0968': '2', '\u0969': '3', '\u096a': '4',
  '\u096b': '5', '\u096c': '6', '\u096d': '7', '\u096e': '8', '\u096f': '9',
};

const normalizeAndParseJSON = (raw) => {
  let text = stripFences(raw);
  text = text.replace(/[\u0966-\u096f]/g, (ch) => DEVANAGARI_DIGIT_MAP[ch] || ch);

  try {
    return JSON.parse(text);
  } catch (_) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error(`Unable to parse JSON from Gemini response: ${text.slice(0, 200)}`);
  }
};

const PROJECT_KNOWLEDGE = `
Krishi Kavach is an AI-powered agricultural platform for Indian farmers.
Features: Disease detection (Tri-Model Ensemble), Weather impact analysis, Market prices, Govt schemes, and Agronomist consultation.
Infrastructure: Node.js Backend, React Frontend, Python ML Server (FastAPI).
AI Providers: Gemini 1.5 Pro (Primary Advisory), YOLOv8/EfficientNet/MobileNet (ML Detection).
`;

/**
 * 1. STRUCTURED DISEASE ADVISORY (Gemini 1.5 Pro)
 */
export const getCropDiseaseInfo = async (cropName, diseaseName, language = "en", userApiKey = null) => {
  const genAI = createClient(userApiKey);
  const model = genAI.getGenerativeModel({ model: "nano-banana-pro-preview" });
  const langName = LANGUAGE_NAMES[language] || "English";
  const isHealthy = diseaseName?.toLowerCase().includes("healthy");

  const prompt = isHealthy
    ? `Agricultural Advisor: ${cropName} is HEALTHY. Provide care tips in ${langName}.
Return JSON: { "title", "summary", "symptoms": [], "causes": [], "treatment": [], "prevention": [], "severity": "None", "naturalRemedies": [], "yieldImpact", "yieldRecoveryTips": [] }`
    : `Agricultural Pathologist: ${diseaseName} in ${cropName}. 
Provide detailed advisory in ${langName} using this structure:
Return JSON:
{
  "title": "${diseaseName} in ${cropName}",
  "summary": "Impact and urgency in ${langName}",
  "symptoms": ["Visible sign 1", "Visible sign 2", "Visible sign 3"],
  "causes": ["Root pathogen", "Environmental factors"],
  "treatment": ["Step-by-step chemical treatment", "Biological/Organic treatment"],
  "prevention": ["Future-proofing step 1", "Future-proofing step 2"],
  "severity": "Low/Medium/High",
  "naturalRemedies": ["Organic remedy details"],
  "yieldImpact": "Percentage loss if untreated",
  "yieldRecoveryTips": ["How to boost yield post-recovery"]
}
CRITICAL: Use standard numbers (0-9). Language: ${langName}.`;

  const result = await model.generateContent(prompt);
  return normalizeAndParseJSON(result.response.text());
};

/**
 * 2. GLOBAL CHATBOT
 */
export const chatWithAI = async (messages, pageContext = "", language = "en", userApiKey = null) => {
  const genAI = createClient(userApiKey);
  const model = genAI.getGenerativeModel({ model: "nano-banana-pro-preview" });
  const langName = LANGUAGE_NAMES[language] || "English";

  const systemPrompt = `You are Krishi Kavach AI. Respond in ${langName}. Scope: Farming and Krishi Kavach app. Knowledge: ${PROJECT_KNOWLEDGE}. Context: ${pageContext}`;

  const chat = model.startChat({
    history: messages.slice(0, -1).map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
  });

  const lastMsg = messages[messages.length - 1].content;
  const result = await chat.sendMessage([{ text: systemPrompt }, { text: lastMsg }]);
  return result.response.text().trim();
};

/**
 * 3. CROP MANAGEMENT
 */
export const getCropManagementInfo = async (cropName, area, areaUnit, language = "en", userApiKey = null) => {
  const genAI = createClient(userApiKey);
  const model = genAI.getGenerativeModel({ model: "nano-banana-pro-preview" });
  const langName = LANGUAGE_NAMES[language] || "English";

  const prompt = `Agricultural consultant: Guide for ${cropName} on ${area} ${areaUnit} in ${langName}. 
Return JSON with full management lifecycle (Soil, Seed, Sowing, Irrigation, Fertilizers, Pest, Harvest, Cost/Profit).`;

  const result = await model.generateContent(prompt);
  return normalizeAndParseJSON(result.response.text());
};

/**
 * 4. WEATHER IMPACT
 */
export const getWeatherCropImpact = async (cropName, currentWeather, dailyForecast, language = "en", userApiKey = null) => {
  const genAI = createClient(userApiKey);
  const model = genAI.getGenerativeModel({ model: "nano-banana-pro-preview" });
  const langName = LANGUAGE_NAMES[language] || "English";

  const prompt = `Meteorologist: Impact of weather on ${cropName} in ${langName}.
Current: ${JSON.stringify(currentWeather)}. Forecast: ${JSON.stringify(dailyForecast)}.
Return JSON with detailed score, impacts, and weekly advisory.`;

  const result = await model.generateContent(prompt);
  return normalizeAndParseJSON(result.response.text());
};

/**
 * 5. MARKET PRICES
 */
export const getMarketPrices = async (commodity, district = "Nashik", state = "Maharashtra", userApiKey = null) => {
  const genAI = createClient(userApiKey);
  const model = genAI.getGenerativeModel({ model: "nano-banana-pro-preview" });

  const prompt = `Market Analyst: realistic commodity prices for ${commodity} in ${district}, ${state}.
Return JSON: summary, trend, trendPercent, localMarkets[], majorMarkets[], priceHistory[30 days].`;

  const result = await model.generateContent(prompt);
  return normalizeAndParseJSON(result.response.text());
};

/**
 * 6. SEED & YIELD
 */
export const getSeedAndYieldAdvice = async (farmInfo, language = "en", userApiKey = null) => {
  const genAI = createClient(userApiKey);
  const model = genAI.getGenerativeModel({ model: "nano-banana-pro-preview" });
  const langName = LANGUAGE_NAMES[language] || "English";

  const prompt = `Consultant: Seed/Yield for ${JSON.stringify(farmInfo)} in ${langName}.
Return JSON: seedRecommendations[], yieldAnalysis, marketContext.`;

  const result = await model.generateContent(prompt);
  return normalizeAndParseJSON(result.response.text());
};

/**
 * 7. GOVT SCHEMES
 */
export const getRecommendedSchemes = async (user, language = "en", userApiKey = null) => {
  const genAI = createClient(userApiKey);
  const model = genAI.getGenerativeModel({ model: "nano-banana-pro-preview" });
  const langName = LANGUAGE_NAMES[language] || "English";

  const prompt = `Govt Advisor: top 5 schemes for farmer ${user.fullName} in ${user.address?.district}.
Return JSON: array of recommendations with benefits, eligibility, and links.`;

  const result = await model.generateContent(prompt);
  return normalizeAndParseJSON(result.response.text());
};
