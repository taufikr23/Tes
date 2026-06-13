import express from 'express';
import { getDailyReport, getMonthlyReport, getTopMedicines } from '../controllers/reportController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/daily', authenticate, authorize('admin'), getDailyReport);
router.get('/monthly', authenticate, authorize('admin'), getMonthlyReport);
router.get('/top-medicines', authenticate, authorize('admin'), getTopMedicines);

export default router;