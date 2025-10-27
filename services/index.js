export * from './api';
export * from './storage';
export * from './utils';

// Service initialization and configuration
export const initServices = async (config = {}) => {
  const { apiBaseUrl, storageType = 'local' } = config;
  
  // Configure API base URL if provided
  if (apiBaseUrl) {
    // This would typically set a base configuration for API services
    console.log(`Services initialized with API base: ${apiBaseUrl}`);
  }
  
  // Initialize storage service
  console.log(`Storage service initialized with: ${storageType}`);
  
  return {
    api: {
      auth: await import('./api/authservice'),
      stock: await import('./api/stockservice'),
      watchlist: await import('./api/watchlistservice'),
      alert: await import('./api/alertservice'),
      notification: await import('./api/notificationservice')
    },
    storage: await import('./storage'),
    utils: await import('./utils')
  };
};