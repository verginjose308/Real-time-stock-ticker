// Authentication configuration
const authConfig = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_fallback_jwt_secret_key_here_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'stock-tracker-api',
    audience: process.env.JWT_AUDIENCE || 'stock-tracker-users',
    
    // Refresh token configuration
    refreshToken: {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      secret: process.env.JWT_REFRESH_SECRET || 'your_fallback_refresh_secret_change_in_production'
    }
  },

  // Password configuration
  password: {
    minLength: 6,
    maxLength: 128,
    requireSpecialChar: true,
    requireNumbers: true,
    requireUppercase: true,
    requireLowercase: true,
    
    // Password reset
    resetTokenExpires: 60 * 60 * 1000, // 1 hour in milliseconds
    maxLoginAttempts: 5,
    lockTime: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
  },

  // Session configuration
  session: {
    cookie: {
      name: 'stock_tracker_token',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: process.env.COOKIE_DOMAIN || 'localhost'
    }
  },

  // OAuth configuration (for future social logins)
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/api/auth/facebook/callback'
    }
  },

  // Security headers
  security: {
    bcryptRounds: 12,
    tokenBlacklistEnabled: true,
    requireEmailVerification: process.env.NODE_ENV === 'production',
    maxSessionsPerUser: 5
  }
};

// Get auth config
export const getAuthConfig = () => {
  return authConfig;
};

// Validate JWT secret (warn if using default in production)
export const validateAuthConfig = () => {
  const config = getAuthConfig();
  
  if (process.env.NODE_ENV === 'production') {
    const defaultSecrets = [
      'your_fallback_jwt_secret_key_here_change_in_production',
      'your_fallback_refresh_secret_change_in_production'
    ];

    if (defaultSecrets.includes(config.jwt.secret)) {
      console.warn('⚠️  WARNING: Using default JWT secret in production!');
      console.warn('   Please set JWT_SECRET environment variable.');
    }

    if (defaultSecrets.includes(config.jwt.refreshToken.secret)) {
      console.warn('⚠️  WARNING: Using default refresh token secret in production!');
      console.warn('   Please set JWT_REFRESH_SECRET environment variable.');
    }
  }

  return true;
};

// Password validation rules
export const validatePassword = (password) => {
  const config = getAuthConfig().password;
  const errors = [];

  if (password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters long`);
  }

  if (password.length > config.maxLength) {
    errors.push(`Password cannot exceed ${config.maxLength} characters`);
  }

  if (config.requireUppercase && !/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (config.requireLowercase && !/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (config.requireNumbers && !/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (config.requireSpecialChar && !/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Token configuration helpers
export const tokenConfig = {
  getAccessTokenConfig: () => ({
    secret: authConfig.jwt.secret,
    expiresIn: authConfig.jwt.expiresIn,
    issuer: authConfig.jwt.issuer,
    audience: authConfig.jwt.audience
  }),

  getRefreshTokenConfig: () => ({
    secret: authConfig.jwt.refreshToken.secret,
    expiresIn: authConfig.jwt.refreshToken.expiresIn,
    issuer: authConfig.jwt.issuer,
    audience: authConfig.jwt.audience
  }),

  getCookieConfig: () => authConfig.session.cookie
};

export default {
  getAuthConfig,
  validateAuthConfig,
  validatePassword,
  tokenConfig
};