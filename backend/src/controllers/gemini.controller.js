import asyncHandler from "express-async-handler";
import { getCropDiseaseInfo, chatWithAI, getCropManagementInfo, getWeatherCropImpact, getMarketPrices } from "../services/gemini.service.js";
import User from "../models/user.model.js";

/**
 * POST /api/v1/disease-info/crop-info
 * Body: { cropName, diseaseName, language }
 */
export const fetchCropDiseaseInfo = asyncHandler(async (req, res) => {
    const { cropName, diseaseName, language = "en" } = req.body;

    if (!cropName || !diseaseName) {
        res.status(400);
        throw new Error("cropName and diseaseName are required.");
    }

    const info = await getCropDiseaseInfo(cropName, diseaseName, language);
    res.json({ success: true, info });
});

/**
 * POST /api/v1/disease-info/chat
 * Body: { messages: [{role, content}], context?: string, language?: string }
 */
export const chatbot = asyncHandler(async (req, res) => {
    const { messages, context = "", language = "en" } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400);
        throw new Error("messages array is required.");
    }

    const reply = await chatWithAI(messages, context, language);
    res.json({ success: true, reply });
});

/**
 * POST /api/v1/disease-info/crop-management
 * Body: { cropName, area, areaUnit, language }
 */
export const cropManagement = asyncHandler(async (req, res) => {
    const { cropName, area, areaUnit = "acres", language = "en" } = req.body;

    if (!cropName || !area) {
        res.status(400);
        throw new Error("cropName and area are required.");
    }

    const info = await getCropManagementInfo(cropName, parseFloat(area), areaUnit, language);
    res.json({ success: true, info });
});

/**
 * POST /api/v1/disease-info/weather-crop-impact
 * Body: { cropName, currentWeather, dailyForecast, language }
 */
export const weatherCropImpact = asyncHandler(async (req, res) => {
    const { cropName, currentWeather, dailyForecast, language = "en" } = req.body;

    if (!cropName || !currentWeather || !dailyForecast) {
        res.status(400);
        throw new Error("cropName, currentWeather, and dailyForecast are required.");
    }

    const impact = await getWeatherCropImpact(cropName, currentWeather, dailyForecast, language);
    res.json({ success: true, impact });
});

/**
 * POST /api/v1/disease-info/market-prices
 * Body: { commodity, district?, state? }
 * Uses user's profile district/state if not provided.
 */
export const marketPrices = asyncHandler(async (req, res) => {
    const { commodity, district: bodyDistrict, state: bodyState } = req.body;

    if (!commodity) {
        res.status(400);
        throw new Error("commodity is required.");
    }

    // Use profile location if caller didn't pass one
    let district = bodyDistrict;
    let state = bodyState;
    if (!district || !state) {
        const user = await User.findById(req.user._id).lean();
        district = district || user?.address?.district || "Nashik";
        state = state || "Maharashtra"; // default
    }

    const data = await getMarketPrices(commodity, district, state);
    res.json({ success: true, data });
});
