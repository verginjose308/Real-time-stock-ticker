import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment configuration
const environmentConfig = {
  // Application environment
  nodeEnv: process.env.NODE_ENV || 'development',

  // Server configuration
  server: {
    port: parseInt(process.env.PORT) || 5000,
    host: process.env.HOST || 'localhost',
    protocol: process.env.PROTOCOL || 'http'
  },

  // Application configuration
  app: {
    name: process.env.APP_NAME || 'Stock Tracker API',
    version: process.env.APP_VERSION || '1.0.0',
    description: process.env.APP_DESCRIPTION || 'A comprehensive stock tracking and alert system',
    contactEmail: process.env.CONTACT_EMAIL || 'support@stocktracker.com',
    supportEmail: process.env.SUPPORT_EMAIL || 'help@stocktracker.com'
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: {
      enabled: process.env.LOG_TO_FILE === 'true',
      path: process.env.LOG_PATH || 'logs',
      maxSize: process.env.LOG_MAX_SIZE || '10m',
      maxFiles: process.env.LOG_MAX_FILES || '7d'
    },
    console: {
      enabled: process.env.LOG_TO_CONSOLE !== 'false'
    }
  },

  // Feature flags
  features: {
    registration: process.env.ENABLE_REGISTRATION !== 'false',
    emailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
    socialLogin: process.env.ENABLE_SOCIAL_LOGIN === 'true',
    premiumFeatures: process.env.ENABLE_PREMIUM_FEATURES === 'true',
    realTimeData: process.env.ENABLE_REAL_TIME_DATA === 'true',
    alerts: process.env.ENABLE_ALERTS !== 'false',
    watchlist: process.env.ENABLE_WATCHLIST !== 'false'
  },

  // Performance configuration
  performance: {
    cacheEnabled: process.env.CACHE_ENABLED !== 'false',
    compressionEnabled: process.env.COMPRESSION_ENABLED === 'true',
    queryTimeout: parseInt(process.env.QUERY_TIMEOUT) || 30000,
    maxRequestBodySize: process.env.MAX_REQUEST_BODY_SIZE || '10mb'
  },

  // Monitoring configuration
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT) || 9090,
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000
  }
};

// Get environment configuration
export const getEnvironmentConfig = () => {
  return environmentConfig;
};

// Check if environment is production
export const isProduction = () => {
  return environmentConfig.nodeEnv === 'production';
};

// Check if environment is development
export const isDevelopment = () => {
  return environmentConfig.nodeEnv === 'development';
};

// Check if environment is test
export const isTest = () => {
  return environmentConfig.nodeEnv === 'test';
};

// Validate environment configuration
export const validateEnvironment = () => {
  const config = getEnvironmentConfig();
  const warnings = [];
  const errors = [];

  // Required environment variables
  const requiredVars = [
    'JWT_SECRET',
    'MONGODB_URI'
  ];

  if (isProduction()) {
    requiredVars.push('CLIENT_URL');
  }

  // Check required variables
  requiredVars.forEach(variable => {
    if (!process.env[variable]) {
      errors.push(`Required environment variable ${variable} is not set`);
    }
  });

  // Check for common misconfigurations
  if (isProduction()) {
    if (process.env.JWT_SECRET === 'your_fallback_jwt_secret_key_here_change_in_production') {
      warnings.push('Using default JWT secret in production');
    }

    if (!process.env.CLIENT_URL) {
      warnings.push('CLIENT_URL not set in production');
    }
  }

  // Validate port
  const port = config.server.port;
  if (port < 1 || port > 65535) {
    errors.push(`Invalid port number: ${port}`);
  }

  return {
    isValid: errors.length === 0,
    isProduction: isProduction(),
    isDevelopment: isDevelopment(),
    isTest: isTest(),
    warnings,
    errors
  };
};

// Get server URL
export const getServerUrl = () => {
  const config = getEnvironmentConfig().server;
  return `${config.protocol}://${config.host}:${config.port}`;
};

// Environment utility functions
export const envUtils = {
  // Get environment variable with fallback
  get: (key, defaultValue = null) => {
    return process.env[key] || defaultValue;
  },

  // Get boolean environment variable
  getBoolean: (key, defaultValue = false) => {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value === 'true' || value === '1';
  },

  // Get number environment variable
  getNumber: (key, defaultValue = 0) => {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    const num = parseInt(value);
    return isNaN(num) ? defaultValue : num;
  },

  // Get array from environment variable
  getArray: (key, defaultValue = []) => {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.split(',').map(item => item.trim());
  }
};

// Export for easy access
export const {
  nodeEnv,
  server,
  app,
  logging,
  features,
  performance,
  monitoring
} = environmentConfig;

export default {
  getEnvironmentConfig,
  isProduction,
  isDevelopment,
  isTest,
  validateEnvironment,
  getServerUrl,
  envUtils,
  nodeEnv,
  server,
  app,
  logging,
  features,
  performance,
  monitoring
};