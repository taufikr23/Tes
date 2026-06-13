import express from 'express';
import { 
  getProfiles, 
  getMyProfile, 
  updateMyProfile, 
  updateProfileRole,
  changePassword,
  getActivityLogs,
  deleteAccount,
  updateLastLogin
} from '../controllers/profileController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticate, getProfiles);
router.get('/me', authenticate, getMyProfile);
router.put('/me', authenticate, updateMyProfile);
router.put('/:id/role', authenticate, authorize('admin'), updateProfileRole);
router.post('/change-password', authenticate, changePassword);
router.get('/activity-logs', authenticate, getActivityLogs);
router.post('/delete-account', authenticate, deleteAccount);
router.post('/last-login', authenticate, updateLastLogin);

export default router;