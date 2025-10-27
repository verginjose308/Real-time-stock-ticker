// Export all configuration modules
export * from './database.js';
export * from './auth.js';
export * from './stockApi.js';
export * from './cors.js';
export * from './environment.js';

// Configuration initialization
import { validateEnvironment } from './environment.js';
import { validateAuthConfig } from './auth.js';
import { validateApiConfig } from './stockApi.js';
import { validateCorsConfig } from './cors.js';

// Initialize and validate all configurations
export const initializeConfig = () => {
  console.log('🔧 Initializing application configuration...');

  // Validate environment
  const envValidation = validateEnvironment();
  if (!envValidation.isValid) {
    console.error('❌ Environment validation failed:');
    envValidation.errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }

  // Validate other configurations
  validateAuthConfig();
  validateCorsConfig();
  
  const apiValidation = validateApiConfig();
  if (!apiValidation.isValid) {
    console.error('❌ API configuration validation failed:');
    apiValidation.errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }

  // Show warnings
  if (envValidation.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    envValidation.warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  if (apiValidation.warnings.length > 0) {
    console.warn('⚠️  API configuration warnings:');
    apiValidation.warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  console.log('✅ Configuration initialized successfully');
  console.log(`🌍 Environment: ${envValidation.isProduction ? 'production' : envValidation.isDevelopment ? 'development' : 'test'}`);
  console.log(`🚀 Server: ${getServerUrl()}`);
};

// Re-export for convenience
import { getServerUrl } from './environment.js';
export { getServerUrl };