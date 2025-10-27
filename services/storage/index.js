// Export all storage services
export { default as localStorage } from './localStorage.js';
export { default as sessionStorage } from './sessionStorage.js';

// Main storage service that combines both
export const storage = {
  // Token management
  setToken: (token) => localStorage.setToken(token),
  getToken: () => localStorage.getToken(),
  clearToken: () => {
    localStorage.clearToken();
    sessionStorage.clearAll();
  },

  // User management
  setUser: (user) => localStorage.setUser(user),
  getUser: () => localStorage.getUser(),
  clearUser: () => localStorage.clearUser(),

  // Combined clear (logout)
  clearAll: () => {
    localStorage.clearAll();
    sessionStorage.clearAll();
  }
};