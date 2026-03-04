import express from 'express';
import { checkEligibility } from '../controllers/schemes.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/eligibility', protect, checkEligibility);

export default router;
