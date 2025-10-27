class LocalStorageService {
  // Token management
  setToken(token) {
    localStorage.setItem('stock_tracker_token', token);
  }

  getToken() {
    return localStorage.getItem('stock_tracker_token');
  }

  clearToken() {
    localStorage.removeItem('stock_tracker_token');
  }

  // User management
  setUser(user) {
    localStorage.setItem('stock_tracker_user', JSON.stringify(user));
  }

  getUser() {
    const user = localStorage.getItem('stock_tracker_user');
    return user ? JSON.parse(user) : null;
  }

  clearUser() {
    localStorage.removeItem('stock_tracker_user');
  }

  // Watchlist cache
  setWatchlistCache(watchlist) {
    localStorage.setItem('stock_tracker_watchlist_cache', JSON.stringify({
      data: watchlist,
      timestamp: Date.now()
    }));
  }

  getWatchlistCache() {
    const cache = localStorage.getItem('stock_tracker_watchlist_cache');
    if (!cache) return null;

    const parsed = JSON.parse(cache);
    const isExpired = (Date.now() - parsed.timestamp) > (5 * 60 * 1000); // 5 minutes

    return isExpired ? null : parsed.data;
  }

  clearWatchlistCache() {
    localStorage.removeItem('stock_tracker_watchlist_cache');
  }

  // Recent searches
  setRecentSearches(searches) {
    localStorage.setItem('stock_tracker_recent_searches', JSON.stringify(searches));
  }

  getRecentSearches() {
    const searches = localStorage.getItem('stock_tracker_recent_searches');
    return searches ? JSON.parse(searches) : [];
  }

  addRecentSearch(search) {
    const searches = this.getRecentSearches();
    const filtered = searches.filter(s => s.symbol !== search.symbol);
    const updated = [search, ...filtered].slice(0, 10); // Keep only 10 most recent
    this.setRecentSearches(updated);
  }

  clearRecentSearches() {
    localStorage.removeItem('stock_tracker_recent_searches');
  }

  // Theme preferences
  setTheme(theme) {
    localStorage.setItem('stock_tracker_theme', theme);
  }

  getTheme() {
    return localStorage.getItem('stock_tracker_theme') || 'light';
  }

  // Clear all application data
  clearAll() {
    const theme = this.getTheme(); // Preserve theme
    localStorage.clear();
    this.setTheme(theme); // Restore theme
  }
}

export default new LocalStorageService();