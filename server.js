import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';

// Import configuration
import { 
  initializeConfig,
  connectDatabase,
  getCorsConfig,
  securityHeaders,
  getEnvironmentConfig
} from './config/index.js';

// Import middleware
import {
  errorHandler,
  notFound,
  requestLogger,
  errorLogger,
  securityLogger,
  performanceLogger,
  apiLimiter,
  authLimiter
} from './middleware/index.js';

// Import routes
import authRoutes from './routes/auth.js';
import stockRoutes from './routes/stocks.js';
import watchlistRoutes from './routes/watchlist.js';
import alertRoutes from './routes/alerts.js';
import notificationRoutes from './routes/notifications.js';

// Initialize configuration
initializeConfig();

const app = express();
const envConfig = getEnvironmentConfig();

// Security middleware
app.use(securityLogger);
app.use(helmet({
  contentSecurityPolicy: {
    directives: securityHeaders.csp
  },
  ...securityHeaders.headers
}));

// Compression
if (envConfig.performance.compressionEnabled) {
  app.use(compression());
}

// CORS
app.use(cors(getCorsConfig()));

// Basic middleware
app.use(express.json({ limit: envConfig.performance.maxRequestBodySize }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging middleware
app.use(requestLogger);
app.use(performanceLogger);

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const healthCheck = {
    success: true,
    message: 'Stock Tracker API is running',
    timestamp: new Date().toISOString(),
    environment: envConfig.nodeEnv,
    version: envConfig.app.version,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'connected' // You can add actual database health check
  };

  res.json(healthCheck);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use(notFound);

// Error logging
app.use(errorLogger);

// Error handling (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start listening
    const server = app.listen(envConfig.server.port, envConfig.server.host, () => {
      console.log('\n🚀 Stock Tracker API Server Started');
      console.log('=====================================');
      console.log(`📱 Application: ${envConfig.app.name} v${envConfig.app.version}`);
      console.log(`🌍 Environment: ${envConfig.nodeEnv}`);
      console.log(`📍 Server: ${envConfig.server.protocol}://${envConfig.server.host}:${envConfig.server.port}`);
      console.log(`⏰ Started: ${new Date().toLocaleString()}`);
      console.log('=====================================\n');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('✅ HTTP server closed');
        
        // Close database connection
        await closeDatabase();
        
        console.log('✅ Database connections closed');
        console.log('👋 Graceful shutdown completed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Listen for shutdown signals
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();