import asyncHandler from 'express-async-handler';
import FarmProfile from '../models/farmProfile.model.js';
import { checkEligibilityWithAI, SCHEMES_DATABASE } from '../services/schemes.service.js';

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

// ── GET /api/v1/schemes/all  ──────────────────────────────────────────────
export const getAllSchemes = asyncHandler(async (req, res) => {
    res.json({ schemes: SCHEMES_DATABASE });
});
