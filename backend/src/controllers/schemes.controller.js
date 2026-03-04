import asyncHandler from 'express-async-handler';
import { getEligibleSchemes } from '../services/gemini.service.js';
import User from '../models/user.model.js';

export const checkEligibility = asyncHandler(async (req, res) => {
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
