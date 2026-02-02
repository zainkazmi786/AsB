/**
 * Role-based access control middleware
 * Must be used after authMiddleware
 * @param {Array<String>} allowedRoles - Array of allowed roles
 */
export const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user is attached (authMiddleware should be called first)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'دسترس کے لیے لاگ ان ضروری ہے',
        error: 'NO_USER',
      });
    }

    // Check if user role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'آپ کو اس عمل کی اجازت نہیں ہے',
        error: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    next();
  };
};
