import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './watchlist.css';

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddStock, setShowAddStock] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [addingStock, setAddingStock] = useState(false);

  // Fetch user's watchlist
  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/watchlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWatchlist(response.data.data.watchlist);
    } catch (err) {
      setError('Failed to fetch watchlist');
      console.error('Watchlist fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search stocks
  const searchStocks = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(`/api/stocks/search?q=${query}`);
      setSearchResults(response.data.data.stocks);
    } catch (err) {
      console.error('Stock search error:', err);
    }
  };

  // Add stock to watchlist
  const addToWatchlist = async (stock) => {
    try {
      setAddingStock(true);
      const token = localStorage.getItem('token');
      await axios.post('/api/watchlist', {
        symbol: stock.symbol,
        customName: stock.companyName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowAddStock(false);
      setSearchQuery('');
      setSearchResults([]);
      fetchWatchlist(); // Refresh watchlist
    } catch (err) {
      setError('Failed to add stock to watchlist');
      console.error('Add to watchlist error:', err);
    } finally {
      setAddingStock(false);
    }
  };

  // Remove stock from watchlist
  const removeFromWatchlist = async (symbol) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/watchlist/${symbol}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchWatchlist(); // Refresh watchlist
    } catch (err) {
      setError('Failed to remove stock from watchlist');
      console.error('Remove from watchlist error:', err);
    }
  };

  // Refresh stock prices
  const refreshPrices = async () => {
    try {
      setLoading(true);
      await fetchWatchlist();
    } catch (err) {
      setError('Failed to refresh prices');
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value) => {
    if (!value) return '-';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchStocks(query);
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  // Auto-refresh prices every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!showAddStock) {
        fetchWatchlist();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [showAddStock]);

  if (loading && watchlist.length === 0) {
    return (
      <div className="watchlist-container">
        <div className="loading">Loading watchlist...</div>
      </div>
    );
  }

  return (
    <div className="watchlist-container">
      {/* Header */}
      <div className="watchlist-header">
        <h2>Watchlist</h2>
        <div className="watchlist-actions">
          <button 
            className="btn-refresh"
            onClick={refreshPrices}
            title="Refresh prices"
          >
            ↻
          </button>
          <button 
            className="btn-add-stock"
            onClick={() => setShowAddStock(true)}
          >
            + Add Stock
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStock && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Stock to Watchlist</h3>
              <button 
                className="btn-close"
                onClick={() => {
                  setShowAddStock(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="search-container">
              <input
                type="text"
                placeholder="Search stocks by symbol or company name..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
              />
              
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((stock) => (
                    <div
                      key={stock.symbol}
                      className="search-result-item"
                      onClick={() => addToWatchlist(stock)}
                    >
                      <div className="stock-symbol">{stock.symbol}</div>
                      <div className="stock-name">{stock.companyName}</div>
                      <div className="stock-type">{stock.type} • {stock.region}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {addingStock && (
              <div className="adding-indicator">Adding stock...</div>
            )}
          </div>
        </div>
      )}

      {/* Watchlist Stocks */}
      <div className="watchlist-stocks">
        {watchlist.length === 0 ? (
          <div className="empty-watchlist">
            <div className="empty-icon">📊</div>
            <h3>Your watchlist is empty</h3>
            <p>Add stocks to track their performance</p>
            <button 
              className="btn-add-first"
              onClick={() => setShowAddStock(true)}
            >
              Add Your First Stock
            </button>
          </div>
        ) : (
          watchlist.map((stock) => (
            <WatchlistCard
              key={stock.symbol}
              stock={stock}
              onRemove={removeFromWatchlist}
              formatCurrency={formatCurrency}
              formatPercentage={formatPercentage}
            />
          ))
        )}
      </div>

      {/* Watchlist Summary */}
      {watchlist.length > 0 && (
        <div className="watchlist-summary">
          <div className="summary-item">
            <span className="summary-label">Total Stocks:</span>
            <span className="summary-value">{watchlist.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Gainers:</span>
            <span className="summary-value positive">
              {watchlist.filter(s => s.change > 0).length}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Losers:</span>
            <span className="summary-value negative">
              {watchlist.filter(s => s.change < 0).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Watchlist Card Component
const WatchlistCard = ({ stock, onRemove, formatCurrency, formatPercentage }) => {
  const [showDetails, setShowDetails] = useState(false);

  const isPositive = stock.change >= 0;
  const isNegative = stock.change < 0;

  return (
    <div className={`watchlist-card ${isPositive ? 'positive' : ''} ${isNegative ? 'negative' : ''}`}>
      <div className="card-header">
        <div className="stock-info">
          <div className="stock-symbol">{stock.symbol}</div>
          <div className="stock-name">
            {stock.customName || stock.companyName || stock.symbol}
          </div>
        </div>
        <button
          className="btn-remove"
          onClick={() => onRemove(stock.symbol)}
          title="Remove from watchlist"
        >
          ×
        </button>
      </div>

      <div className="price-section">
        <div className="current-price">
          {formatCurrency(stock.currentPrice)}
        </div>
        <div className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
          <span className="change-amount">
            {formatCurrency(stock.change)}
          </span>
          <span className="change-percent">
            {formatPercentage(stock.changePercent)}
          </span>
        </div>
      </div>

      {/* Daily Stats */}
      <div className="daily-stats">
        <div className="stat-item">
          <span className="stat-label">Open</span>
          <span className="stat-value">{formatCurrency(stock.open)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">High</span>
          <span className="stat-value">{formatCurrency(stock.high)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Low</span>
          <span className="stat-value">{formatCurrency(stock.low)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Vol</span>
          <span className="stat-value">
            {stock.volume ? (stock.volume / 1000000).toFixed(1) + 'M' : '-'}
          </span>
        </div>
      </div>

      {/* Expandable Details */}
      <button
        className="btn-expand"
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? '▲ Less' : '▼ More'}
      </button>

      {showDetails && (
        <div className="expanded-details">
          {stock.targetPrice && (
            <div className="detail-item">
              <span>Target Price:</span>
              <span>{formatCurrency(stock.targetPrice)}</span>
            </div>
          )}
          {stock.notes && (
            <div className="detail-item">
              <span>Notes:</span>
              <span>{stock.notes}</span>
            </div>
          )}
          <div className="detail-item">
            <span>Added:</span>
            <span>{new Date(stock.addedAt).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Watchlist;