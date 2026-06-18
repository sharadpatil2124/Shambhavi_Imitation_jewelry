import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// Protect routes - Verify JWT token in Authorization Header
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Decode JWT token payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from DB and attach to req object (excluding password)
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized: User account not found.' });
      }

      if (!req.user.isVerified) {
        return res.status(403).json({ success: false, message: 'Your email address is not verified. Please verify your email.' });
      }

      next();
    } catch (error) {
      console.error(`❌ JWT Auth Middleware Error: ${error.message}`);
      res.status(401).json({ success: false, message: 'Not authorized: Secure session has expired or is invalid.' });
    }
  } else {
    res.status(401).json({ success: false, message: 'Not authorized: No secure authentication token provided.' });
  }
};

// Admin authorization - Check if user is administrator
export const admin = (req, res, next) => {
  if (req.user && (req.user.isAdmin || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied: Administrative privileges required.' });
  }
};
