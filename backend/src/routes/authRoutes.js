import express from 'express';
import { login, verifyToken } from '../controllers/authController.js';
import { validate, loginSchema } from '../utils/validation.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', validate(loginSchema), login);

// Protected routes
router.post('/verify', authMiddleware, verifyToken);

export default router;
