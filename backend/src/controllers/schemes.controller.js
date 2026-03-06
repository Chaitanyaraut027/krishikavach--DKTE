import asyncHandler from 'express-async-handler';
import FarmProfile from '../models/farmProfile.model.js';
import { checkEligibilityWithAI, SCHEMES_DATABASE } from '../services/schemes.service.js';
import { getEligibleSchemes } from '../services/gemini.service.js';
import User from '../models/user.model.js';

// ── GET /api/v1/schemes/profile  ──────────────────────────────────────────
export const getFarmProfile = asyncHandler(async (req, res) => {
    const profile = await FarmProfile.findOne({ user: req.user._id });
    res.json({ profile: profile || null });
});

// ── POST /api/v1/schemes/profile  ─────────────────────────────────────────
export const saveFarmProfile = asyncHandler(async (req, res) => {
    const {
        state, district, crops, landSize, landUnit,
        farmerCategory, irrigationType, isOrganicFarm,
        hasSoilHealthCard, hasKisanCreditCard,
        annualIncome, bankAccountLinked, aadhaarLinked,
    } = req.body;

    const profile = await FarmProfile.findOneAndUpdate(
        { user: req.user._id },
        {
            user: req.user._id,
            state, district, crops, landSize, landUnit,
            farmerCategory, irrigationType, isOrganicFarm,
            hasSoilHealthCard, hasKisanCreditCard,
            annualIncome, bankAccountLinked, aadhaarLinked,
        },
        { upsert: true, new: true, runValidators: true }
    );

    res.json({ message: 'Farm profile saved successfully.', profile });
});

// ── POST /api/v1/schemes/check-eligibility  ───────────────────────────────
export const checkEligibility = asyncHandler(async (req, res) => {
    const { farmProfile: inlineProfile, language = 'en' } = req.body;

    // Use provided profile or fetch from DB
    let profile = inlineProfile;
    if (!profile) {
        const saved = await FarmProfile.findOne({ user: req.user._id });
        if (!saved) {
            return res.status(400).json({
                message: 'Please fill in your farm details first before checking eligibility.',
            });
        }
        profile = saved.toObject();
    }

    const eligibleSchemes = await checkEligibilityWithAI(profile, language);
    console.log('Returning eligible schemes to frontend:', eligibleSchemes.length);
    res.json({ schemes: eligibleSchemes, total: eligibleSchemes.length });
});

// ── POST /api/v1/schemes/eligibility  ─────────────────────────────────────
export const checkEligibilityLegacy = asyncHandler(async (req, res) => {
    const { category, landSize, landUnit = 'acres', state: bodyState, crop, additionalInfo } = req.body;

    // Use profile location if caller didn't pass one
    let state = bodyState;
    if (!state) {
        const user = await User.findById(req.user._id).lean();
        state = user?.address?.state || "Maharashtra";
    }

    if (!category || !landSize || !crop || !state) {
        res.status(400);
        throw new Error('category, landSize, crop, and state are required.');
    }

    const data = await getEligibleSchemes(state, crop, landSize, landUnit, category, additionalInfo);

    res.json({ success: true, data });
});

// ── GET /api/v1/schemes/all  ──────────────────────────────────────────────
export const getAllSchemes = asyncHandler(async (req, res) => {
    res.json({ schemes: SCHEMES_DATABASE });
});
