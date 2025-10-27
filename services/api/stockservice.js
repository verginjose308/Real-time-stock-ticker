import axios from 'axios';
import { formatters } from '../utils/index.js';

class StockService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get stock data by symbol
  async getStock(symbol, refresh = false) {
    const cacheKey = `stock_${symbol}`;
    
    // Return cached data if available and not refreshing
    if (!refresh && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const response = await axios.get(`/api/stocks/${symbol}${refresh ? '?refresh=true' : ''}`);
      const stockData = response.data;

      // Cache the result
      this.cache.set(cacheKey, {
        data: stockData,
        timestamp: Date.now()
      });

      return stockData;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Search stocks
  async searchStocks(query, limit = 10) {
    const cacheKey = `search_${query}_${limit}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const response = await axios.get(`/api/stocks/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      const searchData = response.data;

      this.cache.set(cacheKey, {
        data: searchData,
        timestamp: Date.now()
      });

      return searchData;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get multiple stocks by symbols
  async getBatchStocks(symbols, refresh = false) {
    const cacheKey = `batch_${symbols.join('_')}`;
    
    if (!refresh && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const response = await axios.get(`/api/stocks/batch/${symbols.join(',')}`);
      const batchData = response.data;

      this.cache.set(cacheKey, {
        data: batchData,
        timestamp: Date.now()
      });

      return batchData;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get top gainers
  async getTopGainers(limit = 10) {
    const cacheKey = `gainers_${limit}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const response = await axios.get(`/api/stocks/market/gainers?limit=${limit}`);
      const gainersData = response.data;

      this.cache.set(cacheKey, {
        data: gainersData,
        timestamp: Date.now()
      });

      return gainersData;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get top losers
  async getTopLosers(limit = 10) {
    const cacheKey = `losers_${limit}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const response = await axios.get(`/api/stocks/market/losers?limit=${limit}`);
      const losersData = response.data;

      this.cache.set(cacheKey, {
        data: losersData,
        timestamp: Date.now()
      });

      return losersData;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get most active stocks
  async getMostActive(limit = 10) {
    const cacheKey = `active_${limit}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const response = await axios.get(`/api/stocks/market/active?limit=${limit}`);
      const activeData = response.data;

      this.cache.set(cacheKey, {
        data: activeData,
        timestamp: Date.now()
      });

      return activeData;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get stock news
  async getStockNews(symbol, limit = 5) {
    try {
      const response = await axios.get(`/api/stocks/${symbol}/news?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get historical data
  async getHistoricalData(symbol, period = '1mo') {
    try {
      const response = await axios.get(`/api/stocks/${symbol}/historical?period=${period}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get popular stocks (curated list)
  async getPopularStocks() {
    const popularSymbols = ['AAPL', 'TSLA', 'AMZN', 'GOOGL', 'MSFT', 'META', 'NVDA', 'NFLX'];
    return this.getBatchStocks(popularSymbols);
  }

  // Clear cache for specific symbol
  clearCache(symbol) {
    const cacheKey = `stock_${symbol}`;
    this.cache.delete(cacheKey);
  }

  // Clear all cache
  clearAllCache() {
    this.cache.clear();
  }

  // Check if cache is still valid
  isCacheValid(cacheKey) {
    if (!this.cache.has(cacheKey)) return false;
    
    const cached = this.cache.get(cacheKey);
    return (Date.now() - cached.timestamp) < this.cacheTimeout;
  }

  // Error handler
  handleError(error) {
    if (error.response) {
      return {
        message: error.response.data?.message || 'Failed to fetch stock data',
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

export default new StockService();