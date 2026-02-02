import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

/**
 * Generate JWT token for user
 * @param {Object} user - User object with id, username, and role
 * @returns {String} JWT token
 */
export const generateToken = (user) => {
  const payload = {
    userId: user._id.toString(),
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiry,
  });
};

/**
 * Verify and decode JWT token
 * @param {String} token - JWT token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};
