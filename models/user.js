import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  
 
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    },
    avatar: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    }
  },
  
 
  watchlist: [{
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    customName: {
      type: String,
      trim: true
    },
    targetPrice: {
      type: Number,
      min: 0
    },
    notes: {
      type: String,
      maxlength: [200, 'Notes cannot exceed 200 characters']
    }
  }],
  
  preferences: 
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    currency: {
      type: String,
      default: 'USD'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      priceAlerts: {
        type: Boolean,
        default: true
      },
      newsAlerts: {
        type: Boolean,
        default: true
      }
    },
    defaultView: {
      type: String,
      enum: ['grid', 'list', 'detailed'],
      default: 'grid'
    },
    refreshInterval: {
      type: Number,
      min: 30000, 
      default: 60000 
    }
  },
  

  subscription: {
    plan: {
      type: String,
      enum: ['free', 'premium', 'pro'],
      default: 'free'
    },
    expiresAt: {
      type: Date,
      default: null
    },
    features: {
      maxWatchlistItems: {
        type: Number,
        default: 20
      },
      maxAlerts: {
        type: Number,
        default: 10
      },
      historicalData: {
        type: Boolean,
        default: false
      },
      advancedCharts: {
        type: Boolean,
        default: false
      }
    }
  },
  

  isVerified: {
    type: Boolean,
    default: false
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastLogin: {
    type: Date,
    default: null
  },
  
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  lockUntil: {
    type: Date,
    default: null
  }
  
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'watchlist.symbol': 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('profile.fullName').get(function() {
  return `${this.profile.firstName || ''} ${this.profile.lastName || ''}`.trim() || null;
});

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user can authenticate (not locked)
userSchema.methods.canAuthenticate = function() {
  return this.isActive && !this.isLocked;
};

// Method to increment login attempts
userSchema.methods.incrementLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Otherwise increment
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock the account if we've reached max attempts and it's not locked already
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + (2 * 60 * 60 * 1000) }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts after successful login
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Method to add stock to watchlist
userSchema.methods.addToWatchlist = function(symbol, customName = null, targetPrice = null, notes = null) {
  const existingStock = this.watchlist.find(stock => stock.symbol === symbol.toUpperCase());
  
  if (existingStock) {
    throw new Error('Stock already in watchlist');
  }
  
  // Check watchlist limit based on subscription
  const maxItems = this.subscription.features.maxWatchlistItems;
  if (this.watchlist.length >= maxItems) {
    throw new Error(`Watchlist limit reached. Maximum ${maxItems} stocks allowed.`);
  }
  
  this.watchlist.push({
    symbol: symbol.toUpperCase(),
    customName,
    targetPrice,
    notes,
    addedAt: new Date()
  });
  
  return this.save();
};

// Method to remove stock from watchlist
userSchema.methods.removeFromWatchlist = function(symbol) {
  const initialLength = this.watchlist.length;
  this.watchlist = this.watchlist.filter(stock => stock.symbol !== symbol.toUpperCase());
  
  if (this.watchlist.length === initialLength) {
    throw new Error('Stock not found in watchlist');
  }
  
  return this.save();
};

// Method to check if stock is in watchlist
userSchema.methods.hasInWatchlist = function(symbol) {
  return this.watchlist.some(stock => stock.symbol === symbol.toUpperCase());
};

// Method to update user preferences
userSchema.methods.updatePreferences = function(newPreferences) {
  this.preferences = { ...this.preferences, ...newPreferences };
  return this.save();
};

// Method to get public profile (without sensitive data)
userSchema.methods.toPublicJSON = function() {
  const userObject = this.toObject();
  
  // Remove sensitive information
  delete userObject.password;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  delete userObject.__v;
  
  return userObject;
};

// Static method to find by email or username
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  });
};

// Static method to get users with expiring subscriptions
userSchema.statics.findExpiringSubscriptions = function(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  
  return this.find({
    'subscription.expiresAt': {
      $lte: date,
      $gt: new Date() 
    },
    'subscription.plan': { $ne: 'free' }
  });
};

const User = mongoose.model('User', userSchema);

export default User;