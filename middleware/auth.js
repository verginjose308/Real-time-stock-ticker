import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Auth middleware to protect routes
export const auth = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user no longer exists'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    req.user = user;
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Continue without user if token is invalid
        console.warn('Optional auth - invalid token:', error.message);
      }
    }

    next();
  } catch (error) {
    // Continue without user for optional auth
    next();
  }
};

// Admin role middleware
export const requireAdmin = async (req, res, next) => {
  try {
    await auth(req, res, () => {}); // First check if user is authenticated

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has admin role (you can extend your User model for this)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('Require admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in admin authentication'
    });
  }
};

// Premium user middleware
export const requirePremium = async (req, res, next) => {
  try {
    await auth(req, res, () => {}); // First check if user is authenticated

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has premium subscription
    if (req.user.subscription.plan === 'free') {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required for this feature'
      });
    }

    next();
  } catch (error) {
    console.error('Require premium error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in premium check'
    });
  }
};

// Ownership check middleware
export const checkOwnership = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const document = await model.findById(req.params[paramName]);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check if the current user owns the resource
      if (document.user.toString() !== req.user.id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - you do not own this resource'
        });
      }

      req.document = document;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in ownership check'
      });
    }
  };
};