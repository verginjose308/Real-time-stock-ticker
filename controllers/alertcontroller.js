import Alert from '../models/Alert.js';
import Stock from '../models/Stock.js';
import User from '../models/User.js';

// @desc    Get user's alerts
// @route   GET /api/alerts
export const getAlerts = async (req, res) => {
  try {
    const { 
      status, 
      type, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { user: req.user.id };
    
    if (status && status !== 'ALL') {
      query.status = status;
    }
    
    if (type) {
      query['condition.type'] = type;
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get alerts with population
    const alerts = await Alert.find(query)
      .populate('stock', 'symbol companyName currentPrice dailyData')
      .populate('user', 'username email profile.firstName profile.lastName')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Alert.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    // Format response data
    const formattedAlerts = alerts.map(alert => ({
      id: alert._id,
      name: alert.name,
      description: alert.description,
      stock: alert.stock ? {
        symbol: alert.stock.symbol,
        companyName: alert.stock.companyName,
        currentPrice: alert.stock.currentPrice
      } : { symbol: alert.stockSymbol },
      condition: {
        type: alert.condition.type,
        targetValue: alert.condition.targetValue,
        description: getConditionDescription(alert.condition.type, alert.condition.targetValue)
      },
      status: alert.status,
      priority: alert.priority,
      isActive: alert.isActive,
      triggeredAt: alert.triggeredAt,
      triggerCount: alert.triggerCount,
      notification: alert.notification,
      category: alert.category,
      tags: alert.tags,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt
    }));

    res.json({
      success: true,
      data: {
        alerts: formattedAlerts,
        pagination: {
          current: pageNum,
          total: totalPages,
          count: alerts.length,
          totalRecords: total,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        },
        summary: {
          total,
          active: await Alert.countDocuments({ ...query, status: 'ACTIVE' }),
          triggered: await Alert.countDocuments({ ...query, status: 'TRIGGERED' })
        }
      }
    });

  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching alerts'
    });
  }
};

// @desc    Create new alert
// @route   POST /api/alerts
export const createAlert = async (req, res) => {
  try {
    const {
      stockSymbol,
      name,
      description,
      condition,
      priority = 'MEDIUM',
      notification = {},
      category = 'PRICE_MOVEMENT',
      tags = [],
      startDate,
      endDate
    } = req.body;

    // Check if stock exists
    const stock = await Stock.findBySymbol(stockSymbol);
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Stock not found: ${stockSymbol}`
      });
    }

    // Check user's alert limit
    const user = await User.findById(req.user.id);
    const userAlertCount = await Alert.countDocuments({ 
      user: req.user.id, 
      status: { $in: ['ACTIVE', 'TRIGGERED'] } 
    });

    if (userAlertCount >= user.subscription.features.maxAlerts) {
      return res.status(400).json({
        success: false,
        message: `Alert limit reached. Maximum ${user.subscription.features.maxAlerts} alerts allowed.`
      });
    }

    // Create alert
    const alert = new Alert({
      user: req.user.id,
      stock: stock._id,
      stockSymbol: stockSymbol.toUpperCase(),
      name,
      description,
      condition: {
        type: condition.type,
        targetValue: condition.targetValue,
        parameters: condition.parameters || {}
      },
      priority,
      notification: {
        types: notification.types || ['IN_APP'],
        frequency: notification.frequency || 'ONCE',
        maxSends: notification.maxSends || 1,
        cooldownMinutes: notification.cooldownMinutes || 0,
        messageTemplate: notification.messageTemplate
      },
      category,
      tags,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      expiresAt: endDate ? new Date(endDate) : null
    });

    await alert.save();

    // Populate for response
    await alert.populate('stock', 'symbol companyName currentPrice');
    await alert.populate('user', 'username profile.firstName profile.lastName');

    const alertData = alert.toObject();
    alertData.conditionDescription = alert.conditionDescription;
    alertData.canTriggerAgain = alert.canTriggerAgain;

    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: {
        alert: alertData,
        limits: {
          current: userAlertCount + 1,
          max: user.subscription.features.maxAlerts,
          remaining: Math.max(0, user.subscription.features.maxAlerts - (userAlertCount + 1))
        }
      }
    });

  } catch (error) {
    console.error('Create alert error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating alert'
    });
  }
};

// @desc    Update alert
// @route   PUT /api/alerts/:id
export const updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      condition,
      priority,
      notification,
      category,
      tags,
      startDate,
      endDate
    } = req.body;

    const alert = await Alert.findOne({
      _id: id,
      user: req.user.id
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    // Only allow updates for active or disabled alerts
    if (alert.status === 'TRIGGERED' && !req.body.force) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update triggered alert. Reset it first or use force flag.'
      });
    }

    // Update fields
    if (name !== undefined) alert.name = name;
    if (description !== undefined) alert.description = description;
    if (priority !== undefined) alert.priority = priority;
    if (category !== undefined) alert.category = category;
    if (tags !== undefined) alert.tags = tags;
    if (startDate !== undefined) alert.startDate = new Date(startDate);
    if (endDate !== undefined) {
      alert.endDate = new Date(endDate);
      alert.expiresAt = new Date(endDate);
    }

    // Update condition if provided
    if (condition) {
      if (condition.type) alert.condition.type = condition.type;
      if (condition.targetValue) alert.condition.targetValue = condition.targetValue;
      if (condition.parameters) alert.condition.parameters = condition.parameters;
    }

    // Update notification settings if provided
    if (notification) {
      if (notification.types) alert.notification.types = notification.types;
      if (notification.frequency) alert.notification.frequency = notification.frequency;
      if (notification.maxSends) alert.notification.maxSends = notification.maxSends;
      if (notification.cooldownMinutes) alert.notification.cooldownMinutes = notification.cooldownMinutes;
      if (notification.messageTemplate) alert.notification.messageTemplate = notification.messageTemplate;
    }

    await alert.save();

    await alert.populate('stock', 'symbol companyName currentPrice');
    await alert.populate('user', 'username profile.firstName profile.lastName');

    const alertData = alert.toObject();
    alertData.conditionDescription = alert.conditionDescription;
    alertData.canTriggerAgain = alert.canTriggerAgain;
    alertData.isExpired = alert.isExpired;

    res.json({
      success: true,
      message: 'Alert updated successfully',
      data: {
        alert: alertData
      }
    });

  } catch (error) {
    console.error('Update alert error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating alert'
    });
  }
};

// @desc    Delete alert
// @route   DELETE /api/alerts/:id
export const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findOneAndDelete({
      _id: id,
      user: req.user.id
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      message: 'Alert deleted successfully',
      data: {
        deletedAlert: {
          id: alert._id,
          name: alert.name,
          symbol: alert.stockSymbol
        }
      }
    });

  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting alert'
    });
  }
};

// @desc    Reset alert (make it active again)
// @route   POST /api/alerts/:id/reset
export const resetAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findOne({
      _id: id,
      user: req.user.id
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    await alert.reset();

    res.json({
      success: true,
      message: 'Alert reset successfully',
      data: {
        alert: {
          id: alert._id,
          name: alert.name,
          status: alert.status,
          triggerCount: alert.triggerCount
        }
      }
    });

  } catch (error) {
    console.error('Reset alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting alert'
    });
  }
};

// Helper function to generate condition description
function getConditionDescription(type, targetValue) {
  const descriptions = {
    'PRICE_ABOVE': `Price above $${targetValue}`,
    'PRICE_BELOW': `Price below $${targetValue}`,
    'PRICE_PERCENT_UP': `Price up ${targetValue}%`,
    'PRICE_PERCENT_DOWN': `Price down ${targetValue}%`,
    'VOLUME_ABOVE': `Volume above ${formatNumber(targetValue)}`,
    'VOLUME_BELOW': `Volume below ${formatNumber(targetValue)}`,
    'PRICE_CHANGE_UP': `Price change up $${targetValue}`,
    'PRICE_CHANGE_DOWN': `Price change down $${targetValue}`
  };

  return descriptions[type] || 'Custom condition';
}

// Helper function to format large numbers
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}