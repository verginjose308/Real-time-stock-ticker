import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  // User who created the alert
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  
  // Stock associated with the alert
  stock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
    required: [true, 'Stock reference is required'],
    index: true
  },
  
  stockSymbol: {
    type: String,
    required: [true, 'Stock symbol is required'],
    uppercase: true,
    trim: true,
    index: true
  },
  
  // Alert configuration
  name: {
    type: String,
    required: [true, 'Alert name is required'],
    trim: true,
    maxlength: [100, 'Alert name cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Alert conditions
  condition: {
    type: {
      type: String,
      required: true,
      enum: [
        'PRICE_ABOVE', 
        'PRICE_BELOW', 
        'PRICE_PERCENT_UP', 
        'PRICE_PERCENT_DOWN',
        'VOLUME_ABOVE',
        'VOLUME_BELOW',
        'PRICE_CHANGE_UP',
        'PRICE_CHANGE_DOWN'
      ],
      default: 'PRICE_ABOVE'
    },
    
    // Target value for the condition
    targetValue: {
      type: Number,
      required: [true, 'Target value is required']
    },
    
    // Current value when alert was triggered (for tracking)
    currentValue: {
      type: Number,
      default: null
    },
    
    // Additional parameters for complex conditions
    parameters: {
      timeFrame: {
        type: String,
        enum: ['1h', '4h', '1d', '1w', '1m'],
        default: '1d'
      },
      comparisonType: {
        type: String,
        enum: ['absolute', 'percentage'],
        default: 'absolute'
      }
    }
  },
  
  // Alert status and execution
  status: {
    type: String,
    enum: ['ACTIVE', 'TRIGGERED', 'CANCELLED', 'EXPIRED', 'DISABLED'],
    default: 'ACTIVE',
    index: true
  },
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  
  // Notification settings
  notification: {
    types: [{
      type: String,
      enum: ['EMAIL', 'PUSH', 'SMS', 'IN_APP'],
      default: 'IN_APP'
    }],
    
    frequency: {
      type: String,
      enum: ['ONCE', 'EVERY_HOUR', 'EVERY_DAY', 'EVERY_TIME'],
      default: 'ONCE'
    },
    
    lastSent: {
      type: Date,
      default: null
    },
    
    sendCount: {
      type: Number,
      default: 0,
      min: 0
    },
    
    maxSends: {
      type: Number,
      default: 1,
      min: 1
    },
    
    cooldownMinutes: {
      type: Number,
      default: 0,
      min: 0
    },
    
    messageTemplate: {
      type: String,
      maxlength: [500, 'Message template cannot exceed 500 characters']
    }
  },
  
  // Trigger information
  triggeredAt: {
    type: Date,
    default: null
  },
  
  triggerCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  triggerData: {
    priceAtTrigger: {
      type: Number,
      default: null
    },
    volumeAtTrigger: {
      type: Number,
      default: null
    },
    changeAtTrigger: {
      type: Number,
      default: null
    },
    conditionsMet: {
      type: Map,
      of: Boolean,
      default: {}
    }
  },
  
  // Scheduling and expiration
  startDate: {
    type: Date,
    default: Date.now
  },
  
  endDate: {
    type: Date,
    default: null
  },
  
  expiresAt: {
    type: Date,
    default: null,
    index: true
  },
  
  // Alert categories and tags
  category: {
    type: String,
    enum: [
      'PRICE_MOVEMENT',
      'VOLUME_SPIKE', 
      'TECHNICAL_BREAKOUT',
      'SUPPORT_RESISTANCE',
      'NEWS_EVENT',
      'EARNINGS',
      'DIVIDEND',
      'CUSTOM'
    ],
    default: 'PRICE_MOVEMENT'
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  // User preferences for this alert
  userPreferences: {
    snoozeUntil: {
      type: Date,
      default: null
    },
    
    isMuted: {
      type: Boolean,
      default: false
    },
    
    customSound: {
      type: String,
      default: null
    },
    
    vibration: {
      type: Boolean,
      default: true
    }
  },
  
  // Analytics and tracking
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  lastViewed: {
    type: Date,
    default: null
  },
  
  // System fields
  createdBy: {
    type: String,
    enum: ['USER', 'SYSTEM', 'RECOMMENDATION'],
    default: 'USER'
  },
  
  version: {
    type: Number,
    default: 1
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
alertSchema.index({ user: 1, stock: 1 });
alertSchema.index({ user: 1, status: 1 });
alertSchema.index({ user: 1, isActive: 1 });
alertSchema.index({ stockSymbol: 1, status: 1 });
alertSchema.index({ status: 1, expiresAt: 1 });
alertSchema.index({ 'condition.type': 1, isActive: 1 });
alertSchema.index({ triggeredAt: -1 });
alertSchema.index({ createdAt: -1 });

// Virtual for checking if alert is expired
alertSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
});

// Virtual for checking if alert can be triggered again
alertSchema.virtual('canTriggerAgain').get(function() {
  if (this.status !== 'ACTIVE') return false;
  if (this.isExpired) return false;
  if (this.notification.sendCount >= this.notification.maxSends) return false;
  if (this.userPreferences.snoozeUntil && this.userPreferences.snoozeUntil > new Date()) return false;
  
  // Check cooldown period
  if (this.notification.lastSent && this.notification.cooldownMinutes > 0) {
    const cooldownMs = this.notification.cooldownMinutes * 60 * 1000;
    return (new Date() - this.notification.lastSent) > cooldownMs;
  }
  
  return true;
});

// Virtual for formatted condition description
alertSchema.virtual('conditionDescription').get(function() {
  const conditions = {
    'PRICE_ABOVE': `Price above $${this.condition.targetValue}`,
    'PRICE_BELOW': `Price below $${this.condition.targetValue}`,
    'PRICE_PERCENT_UP': `Price up ${this.condition.targetValue}%`,
    'PRICE_PERCENT_DOWN': `Price down ${this.condition.targetValue}%`,
    'VOLUME_ABOVE': `Volume above ${this.formatNumber(this.condition.targetValue)}`,
    'VOLUME_BELOW': `Volume below ${this.formatNumber(this.condition.targetValue)}`,
    'PRICE_CHANGE_UP': `Price change up $${this.condition.targetValue}`,
    'PRICE_CHANGE_DOWN': `Price change down $${this.condition.targetValue}`
  };
  
  return conditions[this.condition.type] || 'Custom condition';
});

// Virtual for next possible trigger time
alertSchema.virtual('nextTriggerTime').get(function() {
  if (!this.notification.lastSent || this.notification.cooldownMinutes === 0) {
    return new Date();
  }
  
  const nextTime = new Date(this.notification.lastSent);
  nextTime.setMinutes(nextTime.getMinutes() + this.notification.cooldownMinutes);
  return nextTime;
});

// Static method to find active alerts for a user
alertSchema.statics.findActiveByUser = function(userId) {
  return this.find({
    user: userId,
    isActive: true,
    status: 'ACTIVE',
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  })
  .populate('stock', 'symbol companyName currentPrice dailyData')
  .sort({ priority: -1, createdAt: -1 });
};

// Static method to find alerts by stock symbol
alertSchema.statics.findByStockSymbol = function(symbol, options = {}) {
  const query = { stockSymbol: symbol.toUpperCase() };
  
  if (options.activeOnly) {
    query.isActive = true;
    query.status = 'ACTIVE';
  }
  
  if (options.userId) {
    query.user = options.userId;
  }
  
  return this.find(query)
    .populate('user', 'username email profile.firstName profile.lastName')
    .populate('stock', 'symbol companyName currentPrice')
    .sort({ createdAt: -1 });
};

// Static method to find alerts that need to be checked
alertSchema.statics.findAlertsToCheck = function(limit = 100) {
  return this.find({
    isActive: true,
    status: 'ACTIVE',
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ],
    $or: [
      { 'notification.lastSent': null },
      { 
        'notification.lastSent': { 
          $lt: new Date(Date.now() - (this.notification.cooldownMinutes * 60 * 1000)) 
        } 
      }
    ]
  })
  .populate('stock', 'symbol currentPrice dailyData historicalSummary')
  .populate('user', 'username email preferences.notifications')
  .limit(limit);
};

// Static method to get triggered alerts for a user
alertSchema.statics.findTriggeredByUser = function(userId, limit = 50) {
  return this.find({
    user: userId,
    status: 'TRIGGERED'
  })
  .populate('stock', 'symbol companyName currentPrice')
  .sort({ triggeredAt: -1 })
  .limit(limit);
};

// Static method to check and trigger alerts for a stock
alertSchema.statics.checkStockAlerts = async function(stock, currentPrice, volume) {
  const alerts = await this.find({
    stockSymbol: stock.symbol,
    isActive: true,
    status: 'ACTIVE',
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  }).populate('user', 'username email preferences');

  const triggeredAlerts = [];

  for (const alert of alerts) {
    const shouldTrigger = await alert.checkConditions(currentPrice, volume);
    
    if (shouldTrigger && alert.canTriggerAgain) {
      await alert.trigger(currentPrice, volume);
      triggeredAlerts.push(alert);
    }
  }

  return triggeredAlerts;
};

// Instance method to check if alert conditions are met
alertSchema.methods.checkConditions = function(currentPrice, volume = null) {
  const target = this.condition.targetValue;
  const stock = this.stock;
  
  if (!stock || !stock.currentPrice) return false;

  switch (this.condition.type) {
    case 'PRICE_ABOVE':
      return currentPrice >= target;
      
    case 'PRICE_BELOW':
      return currentPrice <= target;
      
    case 'PRICE_PERCENT_UP':
      const percentUp = ((currentPrice - stock.dailyData.previousClose) / stock.dailyData.previousClose) * 100;
      return percentUp >= target;
      
    case 'PRICE_PERCENT_DOWN':
      const percentDown = ((stock.dailyData.previousClose - currentPrice) / stock.dailyData.previousClose) * 100;
      return percentDown >= target;
      
    case 'VOLUME_ABOVE':
      return volume && volume >= target;
      
    case 'VOLUME_BELOW':
      return volume && volume <= target;
      
    case 'PRICE_CHANGE_UP':
      const changeUp = currentPrice - stock.dailyData.previousClose;
      return changeUp >= target;
      
    case 'PRICE_CHANGE_DOWN':
      const changeDown = stock.dailyData.previousClose - currentPrice;
      return changeDown >= target;
      
    default:
      return false;
  }
};

// Instance method to trigger the alert
alertSchema.methods.trigger = async function(currentPrice, volume = null) {
  this.status = 'TRIGGERED';
  this.triggeredAt = new Date();
  this.triggerCount += 1;
  
  // Store trigger data
  this.triggerData = {
    priceAtTrigger: currentPrice,
    volumeAtTrigger: volume,
    changeAtTrigger: this.stock?.currentPrice?.change || 0,
    conditionsMet: new Map([[this.condition.type, true]])
  };
  
  // Update notification tracking
  this.notification.lastSent = new Date();
  this.notification.sendCount += 1;
  
  // Check if alert should be deactivated
  if (this.notification.sendCount >= this.notification.maxSends) {
    this.isActive = false;
  }
  
  await this.save();
  
  // Emit event or trigger notification here
  this.emit('alertTriggered', this);
  
  return this;
};

// Instance method to reset alert
alertSchema.methods.reset = function() {
  this.status = 'ACTIVE';
  this.triggeredAt = null;
  this.triggerData = {};
  this.notification.sendCount = 0;
  this.notification.lastSent = null;
  
  return this.save();
};

// Instance method to snooze alert
alertSchema.methods.snooze = function(minutes = 60) {
  this.userPreferences.snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
  return this.save();
};

// Instance method to cancel alert
alertSchema.methods.cancel = function() {
  this.status = 'CANCELLED';
  this.isActive = false;
  return this.save();
};

// Instance method to enable alert
alertSchema.methods.enable = function() {
  this.status = 'ACTIVE';
  this.isActive = true;
  return this.save();
};

// Instance method to disable alert
alertSchema.methods.disable = function() {
  this.status = 'DISABLED';
  this.isActive = false;
  return this.save();
};

// Instance method to get formatted alert message
alertSchema.methods.getNotificationMessage = function() {
  const stockName = this.stock?.companyName || this.stockSymbol;
  const currentPrice = this.triggerData.priceAtTrigger || this.stock?.currentPrice?.price;
  
  const baseMessage = `Alert: ${this.name}`;
  const conditionMessage = this.conditionDescription;
  const priceMessage = `Current price: $${currentPrice?.toFixed(2) || 'N/A'}`;
  
  return `${baseMessage}\n${conditionMessage}\n${priceMessage}`;
};

// Instance method to log view
alertSchema.methods.logView = function() {
  this.viewCount += 1;
  this.lastViewed = new Date();
  return this.save();
};

// Helper method to format large numbers
alertSchema.methods.formatNumber = function(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Middleware to update stockSymbol when stock is populated
alertSchema.pre('save', function(next) {
  if (this.stock && this.stock.symbol && !this.stockSymbol) {
    this.stockSymbol = this.stock.symbol;
  }
  next();
});

// Middleware to update expiresAt based on endDate
alertSchema.pre('save', function(next) {
  if (this.endDate && !this.expiresAt) {
    this.expiresAt = this.endDate;
  }
  next();
});

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;