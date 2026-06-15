import express from 'express';
import { 
  getDoctors, 
  getDoctorById, 
  getDoctorByUserId,
  createDoctor, 
  updateDoctor, 
  deleteDoctor, 
  checkStock 
} from '../controllers/doctorController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticate, getDoctors);
router.get('/me', authenticate, getDoctorByUserId);
router.get('/:id', authenticate, getDoctorById);
router.post('/', authenticate, authorize('admin'), createDoctor);
router.put('/:id', authenticate, updateDoctor);
router.delete('/:id', authenticate, authorize('admin'), deleteDoctor);
router.post('/check-stock', authenticate, checkStock);

export default router;