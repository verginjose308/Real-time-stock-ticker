class SessionStorageService {
  // Temporary data storage (cleared when browser closes)
  setItem(key, value) {
    sessionStorage.setItem(`stock_tracker_${key}`, JSON.stringify(value));
  }

  getItem(key) {
    const item = sessionStorage.getItem(`stock_tracker_${key}`);
    return item ? JSON.parse(item) : null;
  }

  removeItem(key) {
    sessionStorage.removeItem(`stock_tracker_${key}`);
  }

  // Search results cache
  setSearchResults(query, results) {
    this.setItem(`search_${query}`, {
      data: results,
      timestamp: Date.now()
    });
  }

  getSearchResults(query) {
    const cached = this.getItem(`search_${query}`);
    if (!cached) return null;

    const isExpired = (Date.now() - cached.timestamp) > (2 * 60 * 1000); // 2 minutes
    return isExpired ? null : cached.data;
  }

  // Form data persistence
  setFormData(formName, data) {
    this.setItem(`form_${formName}`, data);
  }

  getFormData(formName) {
    return this.getItem(`form_${formName}`);
  }

  clearFormData(formName) {
    this.removeItem(`form_${formName}`);
  }

  // Clear all session data
  clearAll() {
    sessionStorage.clear();
  }
}

export default new SessionStorageService();