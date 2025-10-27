import express from 'express';
import {
  register,
  login,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import {
  updateProfile,
  updatePreferences,
  changePassword,
  deleteAccount
} from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';

// Validation middleware (keep these in routes)
const validateRegisterInput = (req, res, next) => {
  const { username, email, password, confirmPassword } = req.body;
  // Validation logic...
  next();
};

const validateLoginInput = (req, res, next) => {
  const { identifier, password } = req.body;
  // Validation logic...
  next();
};

const router = express.Router();

// Public routes
router.post('/register', validateRegisterInput, register);
router.post('/login', validateLoginInput, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', auth, getMe);
router.post('/refresh-token', auth, refreshToken);
router.put('/profile', auth, updateProfile);
router.put('/preferences', auth, updatePreferences);
router.put('/change-password', auth, changePassword);
router.delete('/account', auth, deleteAccount);

export default router;