import axios from 'axios';
import { storage } from '../storage/index.js';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      storage.clearToken();
      storage.clearUser();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

class AuthService {
  // Register new user
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        storage.setToken(token);
        storage.setUser(user);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Login user
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        storage.setToken(token);
        storage.setUser(user);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update user preferences
  async updatePreferences(preferences) {
    try {
      const response = await api.put('/auth/preferences', preferences);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await api.put('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Refresh token
  async refreshToken() {
    try {
      const response = await api.post('/auth/refresh-token');
      
      if (response.data.success) {
        const { token } = response.data.data;
        storage.setToken(token);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Reset password
  async resetPassword(resetData) {
    try {
      const response = await api.post('/auth/reset-password', resetData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete account
  async deleteAccount(password) {
    try {
      const response = await api.delete('/auth/account', { data: { password } });
      
      if (response.data.success) {
        this.logout();
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Logout user
  logout() {
    storage.clearToken();
    storage.clearUser();
    window.location.href = '/login';
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!storage.getToken();
  }

  // Get current user from storage
  getCurrentUserFromStorage() {
    return storage.getUser();
  }

  // Error handler
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || 'An error occurred',
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // Request made but no response received
      return {
        message: 'Network error. Please check your connection.',
        status: 0
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'An unexpected error occurred',
        status: -1
      };
    }
  }
}

export default new AuthService();