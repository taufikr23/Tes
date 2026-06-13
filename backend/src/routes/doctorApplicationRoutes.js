import express from 'express';
import { 
  createApplication, 
  getAllApplications, 
  getMyApplications, 
  approveApplication, 
  rejectApplication 
} from '../controllers/doctorApplicationController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Pasien: buat pengajuan
router.post('/', authenticate, authorize('pasien'), createApplication);

// Pasien: lihat pengajuannya sendiri
router.get('/my/:userId', authenticate, getMyApplications);

// Admin: lihat semua pengajuan
router.get('/', authenticate, authorize('admin'), getAllApplications);

// Admin: approve/reject
router.put('/:id/approve', authenticate, authorize('admin'), approveApplication);
router.put('/:id/reject', authenticate, authorize('admin'), rejectApplication);

export default router;