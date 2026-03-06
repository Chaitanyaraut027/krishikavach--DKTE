import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
    getFarmProfile,
    saveFarmProfile,
    checkEligibility,
    checkEligibilityLegacy,
    getAllSchemes,
} from '../controllers/schemes.controller.js';

const router = express.Router();

router.get('/all', protect, getAllSchemes);
router.get('/profile', protect, getFarmProfile);
router.post('/profile', protect, saveFarmProfile);
router.post('/check-eligibility', protect, checkEligibility);
router.post('/eligibility', protect, checkEligibilityLegacy);

export default router;
