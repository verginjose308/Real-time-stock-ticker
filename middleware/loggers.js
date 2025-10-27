import winston from 'winston';

// Create logger instance
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'stock-tracker-api' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If we're not in production, log to the console too
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// HTTP request logger middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous'
    });
  });

  next();
};

// Error logger middleware
export const errorLogger = (err, req, res, next) => {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id || 'anonymous'
  });

  next(err);
};

// Security logger for suspicious activities
export const securityLogger = (req, res, next) => {
  const suspiciousActivities = [
    // Add patterns that might indicate suspicious activity
    'password',
    'admin',
    'script',
    '<script>',
    '../'
  ];

  const url = req.originalUrl.toLowerCase();
  const body = JSON.stringify(req.body).toLowerCase();

  const isSuspicious = suspiciousActivities.some(pattern => 
    url.includes(pattern) || body.includes(pattern)
  );

  if (isSuspicious) {
    logger.warn('Suspicious activity detected', {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body
    });
  }

  next();
};

// Performance logger
export const performanceLogger = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds

    if (duration > 1000) { // Log slow requests (over 1 second)
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration.toFixed(2)}ms`,
        ip: req.ip,
        userId: req.user?.id || 'anonymous'
      });
    }
  });

  next();
};