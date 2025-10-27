// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Stock symbol validation
export const validateStockSymbol = (symbol) => {
  if (!symbol || symbol.trim().length === 0) {
    return {
      isValid: false,
      error: 'Stock symbol is required'
    };
  }
  
  if (symbol.length > 10) {
    return {
      isValid: false,
      error: 'Stock symbol is too long'
    };
  }
  
  if (!/^[A-Za-z]+$/.test(symbol)) {
    return {
      isValid: false,
      error: 'Stock symbol can only contain letters'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

// Price validation
export const validatePrice = (price) => {
  if (price === null || price === undefined || price === '') {
    return {
      isValid: false,
      error: 'Price is required'
    };
  }
  
  const numPrice = parseFloat(price);
  if (isNaN(numPrice)) {
    return {
      isValid: false,
      error: 'Price must be a valid number'
    };
  }
  
  if (numPrice < 0) {
    return {
      isValid: false,
      error: 'Price cannot be negative'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

// Alert condition validation
export const validateAlertCondition = (condition) => {
  if (!condition.type) {
    return {
      isValid: false,
      error: 'Condition type is required'
    };
  }
  
  if (condition.targetValue === null || condition.targetValue === undefined || condition.targetValue === '') {
    return {
      isValid: false,
      error: 'Target value is required'
    };
  }
  
  const numValue = parseFloat(condition.targetValue);
  if (isNaN(numValue)) {
    return {
      isValid: false,
      error: 'Target value must be a valid number'
    };
  }
  
  if (numValue < 0) {
    return {
      isValid: false,
      error: 'Target value cannot be negative'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

// Phone number validation
export const validatePhone = (phone) => {
  if (!phone) return { isValid: true, error: null }; // Optional field
  
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  if (!phoneRegex.test(phone)) {
    return {
      isValid: false,
      error: 'Please enter a valid phone number'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

// Form validation helper
export const validateForm = (formData, rules) => {
  const errors = {};
  let isValid = true;

  Object.entries(rules).forEach(([field, rule]) => {
    const value = formData[field];
    
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = rule.required;
      isValid = false;
    } else if (rule.validate && value) {
      const validation = rule.validate(value);
      if (!validation.isValid) {
        errors[field] = validation.error;
        isValid = false;
      }
    } else if (rule.pattern && value && !rule.pattern.test(value)) {
      errors[field] = rule.message || 'Invalid format';
      isValid = false;
    }
  });

  return { isValid, errors };
};