import express from 'express';
import {
  getAlerts,
  getAlert,
  createAlert,
  updateAlert,
  deleteAlert,
  triggerAlert,
  resetAlert,
  snoozeAlert,
  toggleAlert,
  getStockAlerts,
  getTriggeredAlerts,
  bulkDeleteAlerts
} from '../controllers/alertController.js';
import { auth } from '../middleware/auth.js';

// Validation middleware
const validateCreateAlert = (req, res, next) => {
  const { stockSymbol, name, condition, targetValue } = req.body;
  if (!stockSymbol || !name || !condition || !targetValue) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }
  next();
};

const validateAlertId = (req, res, next) => {
  const { id } = req.params;
  if (!id || id.length !== 24) {
    return res.status(400).json({ success: false, message: 'Valid alert ID required' });
  }
  next();
};

const router = express.Router();

// All routes are protected
router.use(auth);

// Alert management
router.get('/', getAlerts);
router.get('/history/triggered', getTriggeredAlerts);
router.get('/stock/:symbol', getStockAlerts);
router.get('/:id', validateAlertId, getAlert);
router.post('/', validateCreateAlert, createAlert);
router.put('/:id', validateAlertId, updateAlert);
router.delete('/:id', validateAlertId, deleteAlert);
router.delete('/bulk', bulkDeleteAlerts);

// Alert actions
router.post('/:id/trigger', validateAlertId, triggerAlert);
router.post('/:id/reset', validateAlertId, resetAlert);
router.post('/:id/snooze', validateAlertId, snoozeAlert);
router.post('/:id/toggle', validateAlertId, toggleAlert);

export default router;