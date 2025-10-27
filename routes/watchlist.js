import express from 'express';
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlistItem,
  getWatchlistAnalytics,
  bulkAddToWatchlist,
  clearWatchlist,
  reorderWatchlist,
  checkWatchlistItem
} from '../controllers/watchlistController.js';
import { auth } from '../middleware/auth.js';

// Validation middleware
const validateAddToWatchlist = (req, res, next) => {
  const { symbol } = req.body;
  if (!symbol) return res.status(400).json({ success: false, message: 'Stock symbol required' });
  next();
};

const validateWatchlistItem = (req, res, next) => {
  const { symbol } = req.params;
  if (!symbol) return res.status(400).json({ success: false, message: 'Stock symbol required' });
  next();
};

const router = express.Router();

// All routes are protected
router.use(auth);

router.get('/', getWatchlist);
router.get('/analytics', getWatchlistAnalytics);
router.get('/check/:symbol', validateWatchlistItem, checkWatchlistItem);
router.post('/', validateAddToWatchlist, addToWatchlist);
router.post('/bulk', bulkAddToWatchlist);
router.put('/reorder', reorderWatchlist);
router.put('/:symbol', validateWatchlistItem, updateWatchlistItem);
router.delete('/:symbol', validateWatchlistItem, removeFromWatchlist);
router.delete('/', clearWatchlist);

export default router;