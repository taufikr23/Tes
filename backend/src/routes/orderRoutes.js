import express from 'express';
import { createOrder, getOrdersByUser, getOrderById, updateOrderStatus } from '../controllers/orderController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticate, createOrder);
router.get('/user/:userId', authenticate, getOrdersByUser);
router.get('/:id', authenticate, getOrderById);
router.put('/:id/status', authenticate, updateOrderStatus);

export default router;