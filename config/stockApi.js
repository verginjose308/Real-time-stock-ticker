// Stock API configuration for multiple data providers
const stockApiConfig = {
  // Alpha Vantage configuration
  alphaVantage: {
    baseUrl: 'https://www.alphavantage.co/query',
    apiKey: process.env.ALPHA_VANTAGE_API_KEY,
    rateLimit: {
      requestsPerMinute: 5, // Free tier limit
      requestsPerDay: 500   // Free tier limit
    },
    endpoints: {
      quote: 'GLOBAL_QUOTE',
      search: 'SYMBOL_SEARCH',
      overview: 'OVERVIEW',
      intraday: 'TIME_SERIES_INTRADAY',
      daily: 'TIME_SERIES_DAILY',
      weekly: 'TIME_SERIES_WEEKLY',
      monthly: 'TIME_SERIES_MONTHLY'
    }
  },

  // Yahoo Finance configuration (via RapidAPI)
  yahooFinance: {
    baseUrl: 'https://yahoo-finance127.p.rapidapi.com',
    apiKey: process.env.RAPIDAPI_KEY,
    host: 'yahoo-finance127.p.rapidapi.com',
    rateLimit: {
      requestsPerMinute: 10, // RapidAPI free tier
      requestsPerMonth: 500   // RapidAPI free tier
    },
    endpoints: {
      quote: '/quote/',
      search: '/search/',
      history: '/history/',
      insights: '/insights/'
    }
  },

  // IEX Cloud configuration (alternative)
  iexCloud: {
    baseUrl: 'https://cloud.iexapis.com/stable',
    apiKey: process.env.IEX_CLOUD_API_KEY,
    rateLimit: {
      requestsPerMonth: 50000 // Paid service
    },
    endpoints: {
      quote: '/stock/{symbol}/quote',
      company: '/stock/{symbol}/company',
      stats: '/stock/{symbol}/stats',
      news: '/stock/{symbol}/news'
    }
  },

  // Fallback configuration
  fallback: {
    primary: 'alphaVantage',
    secondary: 'yahooFinance',
    tertiary: 'iexCloud'
  },

  // Cache configuration
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes in milliseconds
    maxSize: 1000, // Maximum number of cached items
    checkPeriod: 60 * 1000 // Cleanup interval
  },

  // Request configuration
  request: {
    timeout: 10000, // 10 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
    userAgent: 'StockTracker/1.0 (https://github.com/yourusername/stock-tracker)'
  }
};

// Get API configuration
export const getStockApiConfig = () => {
  return stockApiConfig;
};

// Get active API provider based on availability
export const getActiveApiProvider = () => {
  const config = getStockApiConfig();
  
  // Check which API keys are available
  const availableProviders = [];
  
  if (config.alphaVantage.apiKey) {
    availableProviders.push('alphaVantage');
  }
  
  if (config.yahooFinance.apiKey) {
    availableProviders.push('yahooFinance');
  }
  
  if (config.iexCloud.apiKey) {
    availableProviders.push('iexCloud');
  }

  // Return the first available provider from fallback order
  for (const provider of [config.fallback.primary, config.fallback.secondary, config.fallback.tertiary]) {
    if (availableProviders.includes(provider)) {
      return provider;
    }
  }

  throw new Error('No stock API providers configured. Please set at least one API key.');
};

// Validate API configuration
export const validateApiConfig = () => {
  const config = getStockApiConfig();
  const warnings = [];
  const errors = [];

  // Check for API keys
  if (!config.alphaVantage.apiKey) {
    warnings.push('Alpha Vantage API key not set. Some features may not work.');
  }

  if (!config.yahooFinance.apiKey) {
    warnings.push('Yahoo Finance API key not set. Some features may not work.');
  }

  if (!config.iexCloud.apiKey) {
    warnings.push('IEX Cloud API key not set. Some features may not work.');
  }

  // Check if any API is configured
  if (!config.alphaVantage.apiKey && !config.yahooFinance.apiKey && !config.iexCloud.apiKey) {
    errors.push('No stock API keys configured. Please set at least one API key.');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
};

// Get rate limit for a provider
export const getRateLimit = (provider) => {
  const config = getStockApiConfig();
  return config[provider]?.rateLimit || { requestsPerMinute: 5, requestsPerDay: 100 };
};

// API utility functions
export const apiUtils = {
  // Format symbol for API requests
  formatSymbol: (symbol) => symbol.toUpperCase().trim(),

  // Build API URL
  buildUrl: (provider, endpoint, params = {}) => {
    const config = getStockApiConfig()[provider];
    if (!config) throw new Error(`Unknown provider: ${provider}`);

    let url = config.baseUrl;
    
    if (provider === 'alphaVantage') {
      url += `?function=${config.endpoints[endpoint]}`;
      Object.entries(params).forEach(([key, value]) => {
        url += `&${key}=${value}`;
      });
      url += `&apikey=${config.apiKey}`;
    } else if (provider === 'yahooFinance') {
      url += config.endpoints[endpoint];
      if (params.symbol) {
        url += params.symbol;
      }
    } else if (provider === 'iexCloud') {
      let endpointUrl = config.endpoints[endpoint];
      if (params.symbol) {
        endpointUrl = endpointUrl.replace('{symbol}', params.symbol);
      }
      url += endpointUrl;
      url += `?token=${config.apiKey}`;
    }

    return url;
  },

  // Check if provider is available
  isProviderAvailable: (provider) => {
    const config = getStockApiConfig();
    return !!config[provider]?.apiKey;
  },

  // Get all available providers
  getAvailableProviders: () => {
    const config = getStockApiConfig();
    const providers = [];
    
    if (config.alphaVantage.apiKey) providers.push('alphaVantage');
    if (config.yahooFinance.apiKey) providers.push('yahooFinance');
    if (config.iexCloud.apiKey) providers.push('iexCloud');
    
    return providers;
  }
};

export default {
  getStockApiConfig,
  getActiveApiProvider,
  validateApiConfig,
  getRateLimit,
  apiUtils
};