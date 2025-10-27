import mongoose from 'mongoose';
import { logger } from '../middleware/logger.js';

// Database connection configuration
const databaseConfig = {
  // Development database
  development: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/stocktracker_dev',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
    }
  },

  // Production database
  production: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 50,
      minPoolSize: 10,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority'
    }
  },

  // Test database
  test: {
    uri: process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/stocktracker_test',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      maxPoolSize: 5,
    }
  }
};

// Get database config based on environment
export const getDatabaseConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return databaseConfig[env];
};

// Database connection function
export const connectDatabase = async () => {
  try {
    const config = getDatabaseConfig();
    
    if (!config.uri) {
      throw new Error('MongoDB URI is not defined');
    }

    // Connection event handlers
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Close connection on app termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

    // Connect to MongoDB
    await mongoose.connect(config.uri, config.options);
    
    logger.info(`Connected to MongoDB: ${mongoose.connection.name}`);
    logger.info(`MongoDB Host: ${mongoose.connection.host}`);
    logger.info(`MongoDB Port: ${mongoose.connection.port}`);

    return mongoose.connection;

  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Database health check
export const checkDatabaseHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      status: state === 1 ? 'healthy' : 'unhealthy',
      state: states[state],
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

// Close database connection
export const closeDatabase = async () => {
  try {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
};

// Database utilities
export const databaseUtils = {
  // Check if connection is established
  isConnected: () => mongoose.connection.readyState === 1,

  // Get connection stats
  getStats: () => ({
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    models: Object.keys(mongoose.connection.models),
    collections: Object.keys(mongoose.connection.collections)
  }),

  // Drop database (for testing)
  dropDatabase: async () => {
    if (process.env.NODE_ENV === 'test') {
      await mongoose.connection.dropDatabase();
      logger.info('Test database dropped');
    } else {
      throw new Error('Database drop only allowed in test environment');
    }
  }
};

export default {
  getDatabaseConfig,
  connectDatabase,
  checkDatabaseHealth,
  closeDatabase,
  databaseUtils
};