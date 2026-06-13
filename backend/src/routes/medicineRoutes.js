import express from 'express';
import { getMedicines, getMedicineById, createMedicine, updateMedicine, deleteMedicine, checkStock } from '../controllers/medicineController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticate, getMedicines);
router.get('/:id', authenticate, getMedicineById);
router.post('/', authenticate, authorize('admin'), createMedicine);
router.put('/:id', authenticate, authorize('admin'), updateMedicine);
router.delete('/:id', authenticate, authorize('admin'), deleteMedicine);
router.post('/check-stock', authenticate, checkStock);

export default router;