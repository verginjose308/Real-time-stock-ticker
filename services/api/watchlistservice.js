import axios from 'axios';

class WatchlistService {
  // Get user's watchlist
  async getWatchlist() {
    try {
      const response = await axios.get('/api/watchlist');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Add stock to watchlist
  async addToWatchlist(stockData) {
    try {
      const response = await axios.post('/api/watchlist', stockData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Remove stock from watchlist
  async removeFromWatchlist(symbol) {
    try {
      const response = await axios.delete(`/api/watchlist/${symbol}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update watchlist item
  async updateWatchlistItem(symbol, updateData) {
    try {
      const response = await axios.put(`/api/watchlist/${symbol}`, updateData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Check if stock is in watchlist
  async checkInWatchlist(symbol) {
    try {
      const response = await axios.get(`/api/watchlist/check/${symbol}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get watchlist analytics
  async getWatchlistAnalytics() {
    try {
      const response = await axios.get('/api/watchlist/analytics');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Bulk add stocks to watchlist
  async bulkAddToWatchlist(stocks) {
    try {
      const response = await axios.post('/api/watchlist/bulk', { stocks });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Clear entire watchlist
  async clearWatchlist() {
    try {
      const response = await axios.delete('/api/watchlist');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Reorder watchlist
  async reorderWatchlist(symbols) {
    try {
      const response = await axios.put('/api/watchlist/reorder', { symbols });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handler
  handleError(error) {
    if (error.response) {
      return {
        message: error.response.data?.message || 'Watchlist operation failed',
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      return {
        message: 'Network error. Please check your connection.',
        status: 0
      };
    } else {
      return {
        message: error.message || 'An unexpected error occurred',
        status: -1
      };
    }
  }
}

export default new WatchlistService();