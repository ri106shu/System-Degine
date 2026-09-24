import express from 'express';
import { register, login, logout, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { registerSchema, loginSchema } from '../validators/authValidators.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
