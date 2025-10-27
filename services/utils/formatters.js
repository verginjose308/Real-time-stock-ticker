// Currency formatting
export const formatCurrency = (value, currency = 'USD') => {
  if (value === null || value === undefined) return '-';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Percentage formatting
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined) return '-';
  
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};

// Large number formatting (for volume, market cap)
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '-';
  
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(2) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toString();
};

// Date formatting
export const formatDate = (date, includeTime = false) => {
  if (!date) return '-';
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return new Date(date).toLocaleDateString('en-US', options);
};

// Relative time formatting (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  if (!date) return '-';
  
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDate(date);
};

// Stock symbol formatting
export const formatSymbol = (symbol) => {
  if (!symbol) return '';
  return symbol.toUpperCase().trim();
};

// Price change color determination
export const getPriceChangeColor = (change) => {
  if (change > 0) return 'positive';
  if (change < 0) return 'negative';
  return 'neutral';
};

// Alert condition formatting
export const formatAlertCondition = (condition) => {
  const conditions = {
    'PRICE_ABOVE': `Price above $${condition.targetValue}`,
    'PRICE_BELOW': `Price below $${condition.targetValue}`,
    'PRICE_PERCENT_UP': `Price up ${condition.targetValue}%`,
    'PRICE_PERCENT_DOWN': `Price down ${condition.targetValue}%`,
    'VOLUME_ABOVE': `Volume above ${formatNumber(condition.targetValue)}`,
    'VOLUME_BELOW': `Volume below ${formatNumber(condition.targetValue)}`
  };
  
  return conditions[condition.type] || condition.type;
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
};