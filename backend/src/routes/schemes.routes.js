import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { checkEligibility, getHowToApplyVideo } from '../controllers/schemes.controller.js';

const router = Router();

// POST /api/v1/schemes/eligibility
router.post('/eligibility', protect, checkEligibility);

// POST /api/v1/schemes/how-to-apply
router.post('/how-to-apply', protect, getHowToApplyVideo);

export default router;
