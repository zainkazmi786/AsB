import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Login controller
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username (case-insensitive)
    const user = await User.findOne({ 
      username: username.toLowerCase().trim() 
    });

    // Generic error message to prevent user enumeration
    const invalidCredentialsMessage = 'صارف نام یا پاس ورڈ غلط ہے';

    if (!user) {
      return res.status(401).json({
        success: false,
        message: invalidCredentialsMessage,
        error: 'INVALID_CREDENTIALS',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'آپ کا اکاؤنٹ غیر فعال ہے',
        error: 'USER_INACTIVE',
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: invalidCredentialsMessage,
        error: 'INVALID_CREDENTIALS',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'کامیابی سے لاگ ان ہو گیا',
      data: {
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'لاگ ان میں خرابی ہوئی',
      error: 'LOGIN_ERROR',
    });
  }
};

/**
 * Verify token controller
 * POST /api/auth/verify
 */
export const verifyToken = async (req, res) => {
  try {
    // User is already attached by authMiddleware
    const user = req.user;

    res.status(200).json({
      success: true,
      message: 'ٹوکن درست ہے',
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'ٹوکن کی تصدیق میں خرابی',
      error: 'VERIFY_ERROR',
    });
  }
};
