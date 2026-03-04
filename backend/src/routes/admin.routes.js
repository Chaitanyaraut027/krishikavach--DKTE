import express from 'express';
import {
  listFarmers,
  listAgronomists,
  deleteFarmer,
  deleteAgronomist,
} from '../controllers/admin.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect, authorizeRoles('admin'));

router.get('/farmers', listFarmers);
router.delete('/farmers/:id', deleteFarmer);

router.get('/agronomists', listAgronomists);
router.delete('/agronomists/:id', deleteAgronomist);

export default router;
