import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'دسترس کے لیے لاگ ان ضروری ہے',
        error: 'NO_TOKEN',
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'دسترس کے لیے لاگ ان ضروری ہے',
        error: 'NO_TOKEN',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      if (error.message === 'Token expired') {
        return res.status(401).json({
          success: false,
          message: 'ٹوکن کی میعاد ختم ہو گئی ہے',
          error: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'غلط ٹوکن',
        error: 'INVALID_TOKEN',
      });
    }

    // Find user and check if active
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'صارف نہیں ملا',
        error: 'USER_NOT_FOUND',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'آپ کا اکاؤنٹ غیر فعال ہے',
        error: 'USER_INACTIVE',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'دسترس کی تصدیق میں خرابی',
      error: 'AUTH_ERROR',
    });
  }
};
