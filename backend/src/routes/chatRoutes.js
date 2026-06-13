import express from 'express';
import { 
  getMessages, 
  sendMessage, 
  markAsRead, 
  getUnreadCount,
  getUnreadCountByConsultation,
  markAsReadByConsultation
} from '../controllers/chatController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:consultationId', authenticate, getMessages);
router.post('/', authenticate, sendMessage);
router.put('/:id/read', authenticate, markAsRead);
router.get('/unread/count', authenticate, getUnreadCount);
router.get('/unread/by-consultation', authenticate, getUnreadCountByConsultation);
router.put('/read/:consultationId', authenticate, markAsReadByConsultation);

export default router;