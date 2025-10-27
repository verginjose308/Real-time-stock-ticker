import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
  // Basic stock information
  symbol: {
    type: String,
    required: [true, 'Stock symbol is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  
  exchange: {
    type: String,
    required: true,
    enum: ['NASDAQ', 'NYSE', 'AMEX', 'OTHER'],
    default: 'NASDAQ'
  },
  
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Current price data (updated frequently)
  currentPrice: {
    price: {
      type: Number,
      required: true,
      min: 0
    },
    change: {
      type: Number,
      default: 0
    },
    changePercent: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // Daily trading data (based on your design: Open, High, Low, Volume)
  dailyData: {
    open: {
      type: Number,
      min: 0
    },
    high: {
      type: Number,
      min: 0
    },
    low: {
      type: Number,
      min: 0
    },
    close: {
      type: Number,
      min: 0
    },
    volume: {
      type: Number,
      min: 0
    },
    previousClose: {
      type: Number,
      min: 0
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  
  // Historical data summary
  historicalSummary: {
    week52High: {
      type: Number,
      min: 0
    },
    week52Low: {
      type: Number,
      min: 0
    },
    marketCap: {
      type: Number,
      min: 0
    },
    peRatio: {
      type: Number
    },
    dividendYield: {
      type: Number,
      min: 0
    },
    avgVolume: {
      type: Number,
      min: 0
    }
  },
  
  // Company information
  companyInfo: {
    sector: {
      type: String,
      trim: true
    },
    industry: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    CEO: {
      type: String,
      trim: true
    },
    employees: {
      type: Number,
      min: 0
    },
    country: {
      type: String,
      default: 'USA'
    }
  },
  
  // Financial metrics
  financials: {
    eps: {
      type: Number
    },
    revenue: {
      type: Number,
      min: 0
    },
    profitMargin: {
      type: Number
    },
    debtToEquity: {
      type: Number,
      min: 0
    }
  },
  
  // News and updates
  latestNews: [{
    headline: {
      type: String,
      required: true
    },
    source: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    summary: {
      type: String,
      maxlength: [500, 'Summary cannot exceed 500 characters']
    },
    publishedAt: {
      type: Date,
      required: true
    },
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral'
    }
  }],
  
  // Price alerts statistics
  alertStats: {
    totalAlerts: {
      type: Number,
      default: 0,
      min: 0
    },
    priceUpAlerts: {
      type: Number,
      default: 0,
      min: 0
    },
    priceDownAlerts: {
      type: Number,
      default: 0,
      min: 0
    },
    lastAlertTriggered: {
      type: Date,
      default: null
    }
  },
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  
  dataSource: {
    type: String,
    default: 'alpha_vantage' // or 'yahoo_finance', 'iex_cloud', etc.
  },
  
  lastFullUpdate: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
stockSchema.index({ symbol: 1 });
stockSchema.index({ 'companyInfo.sector': 1 });
stockSchema.index({ 'companyInfo.industry': 1 });
stockSchema.index({ 'currentPrice.price': 1 });
stockSchema.index({ 'currentPrice.changePercent': 1 });
stockSchema.index({ 'historicalSummary.marketCap': -1 });
stockSchema.index({ 'dailyData.volume': -1 });
stockSchema.index({ 'dailyData.date': -1 });

// Virtual for formatted price change
stockSchema.virtual('formattedChange').get(function() {
  const change = this.currentPrice.change;
  const changePercent = this.currentPrice.changePercent;
  
  return {
    absolute: change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2),
    percent: changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`,
    isPositive: change >= 0
  };
});

// Virtual for market status
stockSchema.virtual('marketStatus').get(function() {
  const now = new Date();
  const lastUpdate = this.currentPrice.lastUpdated;
  const diffMinutes = (now - lastUpdate) / (1000 * 60);
  
  if (diffMinutes > 60) return 'closed';
  if (diffMinutes > 5) return 'delayed';
  return 'live';
});

// Virtual for day range percentage
stockSchema.virtual('dailyRangePercent').get(function() {
  if (!this.dailyData.high || !this.dailyData.low) return null;
  
  const current = this.currentPrice.price;
  const low = this.dailyData.low;
  const high = this.dailyData.high;
  const range = high - low;
  
  if (range === 0) return 50; // Avoid division by zero
  
  return ((current - low) / range) * 100;
});

// Static method to find stocks by symbol (case insensitive)
stockSchema.statics.findBySymbol = function(symbol) {
  return this.findOne({ symbol: symbol.toUpperCase() });
};

// Static method to find multiple stocks by symbols
stockSchema.statics.findBySymbols = function(symbols) {
  const upperSymbols = symbols.map(sym => sym.toUpperCase());
  return this.find({ symbol: { $in: upperSymbols } });
};

// Static method to search stocks by company name or symbol
stockSchema.statics.searchStocks = function(query, limit = 10) {
  const regex = new RegExp(query, 'i');
  return this.find({
    $or: [
      { symbol: regex },
      { companyName: regex },
      { 'companyInfo.sector': regex },
      { 'companyInfo.industry': regex }
    ],
    isActive: true
  })
  .limit(limit)
  .sort({ 'historicalSummary.marketCap': -1 });
};

// Static method to get top gainers
stockSchema.statics.getTopGainers = function(limit = 10) {
  return this.find({
    'currentPrice.changePercent': { $gt: 0 },
    isActive: true
  })
  .sort({ 'currentPrice.changePercent': -1 })
  .limit(limit);
};

// Static method to get top losers
stockSchema.statics.getTopLosers = function(limit = 10) {
  return this.find({
    'currentPrice.changePercent': { $lt: 0 },
    isActive: true
  })
  .sort({ 'currentPrice.changePercent': 1 })
  .limit(limit);
};

// Static method to get most active stocks
stockSchema.statics.getMostActive = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'dailyData.volume': -1 })
    .limit(limit);
};

// Static method to update stock prices in bulk
stockSchema.statics.updateBulkPrices = async function(priceUpdates) {
  const bulkOps = priceUpdates.map(update => ({
    updateOne: {
      filter: { symbol: update.symbol },
      update: {
        $set: {
          'currentPrice.price': update.price,
          'currentPrice.change': update.change,
          'currentPrice.changePercent': update.changePercent,
          'currentPrice.lastUpdated': new Date()
        }
      }
    }
  }));

  return this.bulkWrite(bulkOps);
};

// Instance method to update daily data
stockSchema.methods.updateDailyData = function(dailyData) {
  this.dailyData = { ...this.dailyData, ...dailyData };
  return this.save();
};

// Instance method to update current price
stockSchema.methods.updateCurrentPrice = function(priceData) {
  this.currentPrice = {
    price: priceData.price,
    change: priceData.change,
    changePercent: priceData.changePercent,
    lastUpdated: new Date()
  };
  return this.save();
};

// Instance method to add news article
stockSchema.methods.addNews = function(newsData) {
  // Keep only latest 20 news articles
  if (this.latestNews.length >= 20) {
    this.latestNews.pop();
  }
  
  this.latestNews.unshift({
    headline: newsData.headline,
    source: newsData.source,
    url: newsData.url,
    summary: newsData.summary,
    publishedAt: newsData.publishedAt || new Date(),
    sentiment: newsData.sentiment || 'neutral'
  });
  
  return this.save();
};

// Instance method to get formatted stock data for frontend
stockSchema.methods.toStockJSON = function() {
  const stockObject = this.toObject();
  
  // Add virtuals and formatted data
  stockObject.formattedChange = this.formattedChange;
  stockObject.marketStatus = this.marketStatus;
  stockObject.dailyRangePercent = this.dailyRangePercent;
  
  return stockObject;
};

// Instance method to check if price reached a target
stockSchema.methods.checkPriceTarget = function(targetPrice, condition = 'above') {
  const currentPrice = this.currentPrice.price;
  
  if (condition === 'above') {
    return currentPrice >= targetPrice;
  } else if (condition === 'below') {
    return currentPrice <= targetPrice;
  }
  
  return false;
};

// Middleware to update lastFullUpdate timestamp
stockSchema.pre('save', function(next) {
  if (this.isModified('currentPrice') || this.isModified('dailyData')) {
    this.lastFullUpdate = new Date();
  }
  next();
});

const Stock = mongoose.model('Stock', stockSchema);

export default Stock;