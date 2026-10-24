import { Router } from 'express';
import { getMe, googleSignIn, logout } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.post('/google', authLimiter, googleSignIn);
router.get('/me', requireAuth, getMe);
router.post('/logout', logout);

export default router;
