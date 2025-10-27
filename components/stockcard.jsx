import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './stockcard.css';

const StockCard = ({ symbol, onRemove, showRemoveButton = false, compact = false }) => {
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);

  // Fetch stock data
  const fetchStockData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/stocks/${symbol}`);
      setStock(response.data.data.stock);
      setInWatchlist(response.data.data.stock.inWatchlist || false);
    } catch (err) {
      setError(`Failed to load ${symbol}`);
      console.error('Stock fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add to watchlist
  const addToWatchlist = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/watchlist', {
        symbol: symbol
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInWatchlist(true);
      fetchStockData(); // Refresh to get updated data
    } catch (err) {
      setError('Failed to add to watchlist');
      console.error('Add to watchlist error:', err);
    }
  };

  // Remove from watchlist
  const removeFromWatchlist = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/watchlist/${symbol}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInWatchlist(false);
      if (onRemove) {
        onRemove(symbol);
      }
    } catch (err) {
      setError('Failed to remove from watchlist');
      console.error('Remove from watchlist error:', err);
    }
  };

  // Refresh stock data
  const refreshStock = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/stocks/${symbol}?refresh=true`);
      setStock(response.data.data.stock);
    } catch (err) {
      setError('Failed to refresh stock data');
      console.error('Refresh stock error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value) => {
    if (!value && value !== 0) return '-';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Format large numbers (volume, market cap)
  const formatNumber = (num) => {
    if (!num) return '-';
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

  // Calculate daily range percentage
  const getDailyRangePercent = () => {
    if (!stock || !stock.dailyData) return 0;
    const { high, low } = stock.dailyData;
    const current = stock.currentPrice.price;
    if (high === low) return 50;
    return ((current - low) / (high - low)) * 100;
  };

  useEffect(() => {
    fetchStockData();
  }, [symbol]);

  // Auto-refresh for non-compact cards
  useEffect(() => {
    if (!compact) {
      const interval = setInterval(fetchStockData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [symbol, compact]);

  if (loading) {
    return (
      <div className={`stock-card loading ${compact ? 'compact' : ''}`}>
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading {symbol}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`stock-card error ${compact ? 'compact' : ''}`}>
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
          <button className="btn-retry" onClick={fetchStockData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className={`stock-card error ${compact ? 'compact' : ''}`}>
        <div className="error-content">
          <div className="error-message">Stock data not available</div>
        </div>
      </div>
    );
  }

  const { currentPrice, dailyData, companyName, historicalSummary } = stock;
  const isPositive = currentPrice.change >= 0;
  const isNegative = currentPrice.change < 0;
  const dailyRangePercent = getDailyRangePercent();

  return (
    <div className={`stock-card ${isPositive ? 'positive' : ''} ${isNegative ? 'negative' : ''} ${compact ? 'compact' : ''} ${expanded ? 'expanded' : ''}`}>
      
      {/* Header Section */}
      <div className="card-header">
        <div className="stock-basic-info">
          <div className="stock-symbol">{symbol}</div>
          <div className="stock-name">
            {companyName || symbol}
          </div>
        </div>
        
        <div className="card-actions">
          {!compact && (
            <button 
              className="btn-refresh"
              onClick={refreshStock}
              title="Refresh data"
            >
              ↻
            </button>
          )}
          
          {showRemoveButton ? (
            <button 
              className="btn-remove"
              onClick={removeFromWatchlist}
              title="Remove from watchlist"
            >
              ×
            </button>
          ) : inWatchlist ? (
            <button 
              className="btn-in-watchlist"
              onClick={removeFromWatchlist}
              title="Remove from watchlist"
            >
              ★
            </button>
          ) : (
            <button 
              className="btn-add-watchlist"
              onClick={addToWatchlist}
              title="Add to watchlist"
            >
              ☆
            </button>
          )}
        </div>
      </div>

      {/* Price Section */}
      <div className="price-section">
        <div className="current-price">
          {formatCurrency(currentPrice.price)}
        </div>
        <div className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
          <span className="change-amount">
            {formatCurrency(currentPrice.change)}
          </span>
          <span className="change-percent">
            {formatPercentage(currentPrice.changePercent)}
          </span>
        </div>
      </div>

      {/* Daily Stats - Based on your WhatsApp design */}
      {!compact && (
        <div className="daily-stats">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Open</span>
              <span className="stat-value">{formatCurrency(dailyData.open)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">High</span>
              <span className="stat-value">{formatCurrency(dailyData.high)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Low</span>
              <span className="stat-value">{formatCurrency(dailyData.low)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Volume</span>
              <span className="stat-value">{formatNumber(dailyData.volume)}</span>
            </div>
          </div>

          {/* Daily Range Bar */}
          <div className="daily-range">
            <div className="range-labels">
              <span>{formatCurrency(dailyData.low)}</span>
              <span>Daily Range</span>
              <span>{formatCurrency(dailyData.high)}</span>
            </div>
            <div className="range-bar">
              <div 
                className="range-progress"
                style={{ width: `${dailyRangePercent}%` }}
              ></div>
              <div 
                className="range-current"
                style={{ left: `${dailyRangePercent}%` }}
              >
                <div className="current-indicator"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact View (for search results, lists) */}
      {compact && (
        <div className="compact-info">
          <div className="compact-price">
            {formatCurrency(currentPrice.price)}
          </div>
          <div className={`compact-change ${isPositive ? 'positive' : 'negative'}`}>
            {formatPercentage(currentPrice.changePercent)}
          </div>
        </div>
      )}

      {/* Expandable Details */}
      {!compact && (
        <>
          <button
            className="btn-expand"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▲ Less Details' : '▼ More Details'}
          </button>

          {expanded && (
            <div className="expanded-details">
              {/* Company Information */}
              <div className="detail-section">
                <h4>Company Info</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span>Market Cap</span>
                    <span>{formatCurrency(historicalSummary?.marketCap)}</span>
                  </div>
                  <div className="detail-item">
                    <span>P/E Ratio</span>
                    <span>{historicalSummary?.peRatio ? historicalSummary.peRatio.toFixed(2) : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span>Dividend Yield</span>
                    <span>{historicalSummary?.dividendYield ? (historicalSummary.dividendYield * 100).toFixed(2) + '%' : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span>52W High</span>
                    <span>{formatCurrency(historicalSummary?.week52High)}</span>
                  </div>
                  <div className="detail-item">
                    <span>52W Low</span>
                    <span>{formatCurrency(historicalSummary?.week52Low)}</span>
                  </div>
                </div>
              </div>

              {/* Trading Information */}
              <div className="detail-section">
                <h4>Trading Info</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span>Previous Close</span>
                    <span>{formatCurrency(dailyData.previousClose)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Avg Volume</span>
                    <span>{formatNumber(historicalSummary?.avgVolume)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Last Updated</span>
                    <span>{new Date(currentPrice.lastUpdated).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StockCard;