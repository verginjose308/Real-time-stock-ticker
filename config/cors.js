// CORS configuration
const corsConfig = {
  // Development configuration
  development: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
      'Accept',
      'Origin',
      'Access-Control-Allow-Headers'
    ],
    exposedHeaders: [
      'Content-Range',
      'X-Content-Range',
      'X-Total-Count'
    ],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
  },

  // Production configuration
  production: {
    origin: [
      process.env.CLIENT_URL,
      process.env.ADMIN_URL,
      'https://your-stock-tracker-app.vercel.app',
      'https://your-stock-tracker-admin.vercel.app'
    ].filter(Boolean), // Remove any undefined values
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
      'Accept',
      'Origin'
    ],
    exposedHeaders: [
      'Content-Range',
      'X-Content-Range'
    ],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204
  },

  // Test configuration
  test: {
    origin: '*',
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
};

// Get CORS configuration based on environment
export const getCorsConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return corsConfig[env];
};

// Validate CORS configuration
export const validateCorsConfig = () => {
  const config = getCorsConfig();
  
  if (process.env.NODE_ENV === 'production') {
    if (!config.origin || config.origin.length === 0) {
      console.warn('⚠️  WARNING: No CORS origins configured for production!');
      console.warn('   Please set CLIENT_URL environment variable.');
    }
    
    if (config.origin.includes('http://localhost:3000')) {
      console.warn('⚠️  WARNING: Localhost is included in production CORS origins!');
    }
  }

  return true;
};

// CORS utility functions
export const corsUtils = {
  // Check if origin is allowed
  isOriginAllowed: (origin) => {
    const config = getCorsConfig();
    
    if (config.origin === true || config.origin === '*') {
      return true;
    }

    if (Array.isArray(config.origin)) {
      return config.origin.includes(origin);
    }

    if (typeof config.origin === 'function') {
      return config.origin(origin);
    }

    return false;
  },

  // Get allowed methods as string
  getAllowedMethods: () => {
    const config = getCorsConfig();
    return config.methods.join(', ');
  },

  // Get allowed headers as string
  getAllowedHeaders: () => {
    const config = getCorsConfig();
    return config.allowedHeaders.join(', ');
  }
};

// Security headers configuration
export const securityHeaders = {
  // Content Security Policy
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.alphavantage.co", "https://yahoo-finance127.p.rapidapi.com"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"]
  },

  // Other security headers
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  }
};

export default {
  getCorsConfig,
  validateCorsConfig,
  corsUtils,
  securityHeaders
};