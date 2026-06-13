import express from 'express';
import { 
  createPayment, 
  getMyPayments, 
  getAllPayments, 
  verifyPayment,
  getPaymentByOrder
} from '../controllers/paymentController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticate, createPayment);
router.get('/my', authenticate, getMyPayments);
router.get('/order/:orderId', authenticate, getPaymentByOrder);
router.get('/', authenticate, authorize('admin'), getAllPayments);
router.put('/:id/verify', authenticate, authorize('admin'), verifyPayment);

export default router;