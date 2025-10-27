import express from 'express';
import {
  getStock,
  searchStocks,
  getBatchStocks,
  getTopGainers,
  getTopLosers,
  getMostActive
} from '../controllers/stockController.js';
import { auth, optionalAuth } from '../middleware/auth.js';

// Validation middleware
const validateStockSymbol = (req, res, next) => {
  const { symbol } = req.params;
  if (!symbol) return res.status(400).json({ success: false, message: 'Stock symbol required' });
  next();
};

const validateSearchQuery = (req, res, next) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.status(400).json({ success: false, message: 'Valid search query required' });
  next();
};

const router = express.Router();

// Public routes
router.get('/search', validateSearchQuery, searchStocks);
router.get('/batch/:symbols', getBatchStocks);
router.get('/market/gainers', getTopGainers);
router.get('/market/losers', getTopLosers);
router.get('/market/active', getMostActive);

// Public routes with optional auth
router.get('/:symbol', optionalAuth, validateStockSymbol, getStock);

export default router;