import express from 'express';
import { 
  createConsultationPayment, 
  getDoctorPayments,
  getAllConsultationPayments, 
  verifyConsultationPayment
} from '../controllers/consultationPaymentController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Pasien: buat pembayaran
router.post('/', authenticate, createConsultationPayment);

// Dokter: lihat pembayaran yang masuk ke mereka
router.get('/doctor', authenticate, authorize('dokter'), getDoctorPayments);

// Admin: lihat semua pembayaran
router.get('/admin/all', authenticate, authorize('admin'), getAllConsultationPayments);

// Admin: verifikasi pembayaran
router.put('/:id/verify', authenticate, authorize('admin'), verifyConsultationPayment);

export default router;