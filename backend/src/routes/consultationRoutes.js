import express from 'express';
import { 
  createConsultation, 
  getConsultationsByUser, 
  getConsultationsByDoctor,
  getConsultationById,
  updateConsultation, 
  addPrescription 
} from '../controllers/consultationController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticate, authorize('pasien'), createConsultation);
router.get('/user/:userId', authenticate, getConsultationsByUser);
router.get('/doctor/:doctorId', authenticate, authorize('dokter'), getConsultationsByDoctor);
router.get('/:id', authenticate, getConsultationById);
router.put('/:id', authenticate, authorize('dokter'), updateConsultation);
router.post('/prescription', authenticate, authorize('dokter'), addPrescription);

export default router;