import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StockCard from './StockCard';
import './addstock.css';

const AddStock = ({ onStockAdded, onClose, show = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [popularStocks, setPopularStocks] = useState([]);
  const [addingStock, setAddingStock] = useState(null);

  // Popular stocks to show as suggestions
  const defaultPopularStocks = [
    { symbol: 'AAPL', companyName: 'Apple Inc.' },
    { symbol: 'TSLA', companyName: 'Tesla Inc.' },
    { symbol: 'AMZN', companyName: 'Amazon.com Inc.' },
    { symbol: 'MSFT', companyName: 'Microsoft Corporation' },
    { symbol: 'GOOGL', companyName: 'Alphabet Inc.' },
    { symbol: 'META', companyName: 'Meta Platforms Inc.' },
    { symbol: 'NVDA', companyName: 'NVIDIA Corporation' },
    { symbol: 'NFLX', companyName: 'Netflix Inc.' }
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    const savedRecentSearches = localStorage.getItem('recentStockSearches');
    if (savedRecentSearches) {
      setRecentSearches(JSON.parse(savedRecentSearches));
    }
    setPopularStocks(defaultPopularStocks);
  }, []);

  // Save to recent searches
  const saveToRecentSearches = (stock) => {
    const newRecent = [
      stock,
      ...recentSearches.filter(item => item.symbol !== stock.symbol)
    ].slice(0, 5); // Keep only 5 most recent
    
    setRecentSearches(newRecent);
    localStorage.setItem('recentStockSearches', JSON.stringify(newRecent));
  };

  // Search stocks
  const searchStocks = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/stocks/search?q=${encodeURIComponent(query)}&limit=10`);
      
      if (response.data.success) {
        setSearchResults(response.data.data.stocks);
      } else {
        setError('Search failed');
      }
    } catch (err) {
      console.error('Stock search error:', err);
      setError('Failed to search stocks. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchStocks(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Add stock to watchlist
  const addToWatchlist = async (stock) => {
    try {
      setAddingStock(stock.symbol);
      setError(null);

      const token = localStorage.getItem('token');
      await axios.post('/api/watchlist', {
        symbol: stock.symbol,
        customName: stock.companyName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Save to recent searches
      saveToRecentSearches(stock);

      // Reset form
      setSearchQuery('');
      setSearchResults([]);

      // Notify parent
      if (onStockAdded) {
        onStockAdded(stock);
      }

      // Show success message
      setError(`✅ ${stock.symbol} added to watchlist!`);
      setTimeout(() => setError(null), 3000);

    } catch (err) {
      console.error('Add to watchlist error:', err);
      
      if (err.response?.status === 409) {
        setError(`${stock.symbol} is already in your watchlist`);
      } else if (err.response?.status === 400) {
        setError('Watchlist limit reached. Please remove some stocks first.');
      } else {
        setError('Failed to add stock to watchlist. Please try again.');
      }
    } finally {
      setAddingStock(null);
    }
  };

  // Quick add from popular stocks
  const quickAddStock = (stock) => {
    addToWatchlist(stock);
  };

  // Handle input change
  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  };

  // Reset component
  const resetComponent = () => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    setAddingStock(null);
    if (onClose) {
      onClose();
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="add-stock-container">
      {/* Modal Overlay */}
      <div className="modal-overlay" onClick={resetComponent}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div className="modal-header">
            <h2>Add Stock to Watchlist</h2>
            <button className="btn-close" onClick={resetComponent}>
              ×
            </button>
          </div>

          {/* Search Section */}
          <div className="search-section">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search by symbol or company name (e.g., AAPL or Apple)"
                value={searchQuery}
                onChange={handleInputChange}
                className="search-input"
                autoFocus
              />
              {searchQuery && (
                <button className="btn-clear" onClick={clearSearch}>
                  ×
                </button>
              )}
            </div>

            {loading && (
              <div className="loading-indicator">
                <div className="spinner"></div>
                <span>Searching stocks...</span>
              </div>
            )}
          </div>

          {/* Error/Success Message */}
          {error && (
            <div className={`message ${error.includes('✅') ? 'success' : 'error'}`}>
              {error}
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="search-results-section">
              <h3>Search Results</h3>
              <div className="search-results">
                {searchResults.map((stock) => (
                  <SearchResultItem
                    key={stock.symbol}
                    stock={stock}
                    onAdd={addToWatchlist}
                    adding={addingStock === stock.symbol}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {!searchQuery && recentSearches.length > 0 && (
            <div className="suggestions-section">
              <h3>Recent Searches</h3>
              <div className="suggestions-grid">
                {recentSearches.map((stock) => (
                  <SuggestionCard
                    key={stock.symbol}
                    stock={stock}
                    onAdd={quickAddStock}
                    adding={addingStock === stock.symbol}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Popular Stocks */}
          {!searchQuery && searchResults.length === 0 && (
            <div className="suggestions-section">
              <h3>Popular Stocks</h3>
              <div className="suggestions-grid">
                {popularStocks.map((stock) => (
                  <SuggestionCard
                    key={stock.symbol}
                    stock={stock}
                    onAdd={quickAddStock}
                    adding={addingStock === stock.symbol}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {searchQuery && !loading && searchResults.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>No stocks found</h3>
              <p>Try searching with a different symbol or company name</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="quick-actions">
            <button className="btn-cancel" onClick={resetComponent}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Search Result Item Component
const SearchResultItem = ({ stock, onAdd, adding }) => {
  return (
    <div className="search-result-item">
      <div className="stock-info">
        <div className="stock-symbol">{stock.symbol}</div>
        <div className="stock-name">{stock.companyName}</div>
        <div className="stock-details">
          {stock.type} • {stock.region} • {stock.currency}
        </div>
      </div>
      <button
        className={`btn-add ${adding ? 'adding' : ''}`}
        onClick={() => onAdd(stock)}
        disabled={adding}
      >
        {adding ? (
          <>
            <div className="spinner-small"></div>
            Adding...
          </>
        ) : (
          'Add to Watchlist'
        )}
      </button>
    </div>
  );
};

// Suggestion Card Component
const SuggestionCard = ({ stock, onAdd, adding }) => {
  return (
    <div className="suggestion-card">
      <div className="suggestion-content">
        <div className="suggestion-symbol">{stock.symbol}</div>
        <div className="suggestion-name">{stock.companyName}</div>
      </div>
      <button
        className={`btn-add-small ${adding ? 'adding' : ''}`}
        onClick={() => onAdd(stock)}
        disabled={adding}
        title={`Add ${stock.symbol} to watchlist`}
      >
        {adding ? (
          <div className="spinner-small"></div>
        ) : (
          '+'
        )}
      </button>
    </div>
  );
};

export default AddStock;