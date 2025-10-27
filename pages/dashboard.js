import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import StockCard from '../components/stockcard';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [marketData, setMarketData] = useState({
    gainers: [],
    losers: [],
    active: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user's watchlist
  const fetchWatchlist = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/watchlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWatchlist(response.data.data.watchlist.slice(0, 6)); // Show first 6 stocks
    } catch (err) {
      console.error('Failed to fetch watchlist:', err);
    }
  };

  // Fetch market data
  const fetchMarketData = async () => {
    try {
      const [gainersResponse, losersResponse, activeResponse] = await Promise.all([
        axios.get('/api/stocks/market/gainers?limit=3'),
        axios.get('/api/stocks/market/losers?limit=3'),
        axios.get('/api/stocks/market/active?limit=3')
      ]);

      setMarketData({
        gainers: gainersResponse.data.data.stocks,
        losers: losersResponse.data.data.stocks,
        active: activeResponse.data.data.stocks
      });
    } catch (err) {
      console.error('Failed to fetch market data:', err);
    }
  };

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchWatchlist(), fetchMarketData()]);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <section className="welcome-section">
        <div className="welcome-content">
          <h1>Welcome to StockTracker</h1>
          <p>Monitor your investments and stay updated with real-time market data</p>
        </div>
        <div className="quick-actions">
          <Link to="/watchlist" className="action-card">
            <div className="action-icon">📊</div>
            <div className="action-text">
              <h3>My Watchlist</h3>
              <p>View and manage your tracked stocks</p>
            </div>
          </Link>
          <Link to="/stocks" className="action-card">
            <div className="action-icon">🔍</div>
            <div className="action-text">
              <h3>Explore Stocks</h3>
              <p>Discover new investment opportunities</p>
            </div>
          </Link>
          <Link to="/alerts" className="action-card">
            <div className="action-icon">🔔</div>
            <div className="action-text">
              <h3>Price Alerts</h3>
              <p>Set up custom price notifications</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Watchlist Preview */}
      <section className="watchlist-preview">
        <div className="section-header">
          <h2>My Watchlist</h2>
          <Link to="/watchlist" className="view-all-link">
            View All →
          </Link>
        </div>
        
        {watchlist.length === 0 ? (
          <div className="empty-watchlist">
            <div className="empty-icon">📈</div>
            <h3>Your watchlist is empty</h3>
            <p>Start by adding some stocks to track</p>
            <Link to="/stocks" className="btn-primary">
              Explore Stocks
            </Link>
          </div>
        ) : (
          <div className="stocks-grid">
            {watchlist.map(stock => (
              <StockCard
                key={stock.symbol}
                symbol={stock.symbol}
                compact={true}
              />
            ))}
          </div>
        )}
      </section>

      {/* Market Overview */}
      <section className="market-overview">
        <h2>Market Overview</h2>
        <div className="market-sections">
          {/* Top Gainers */}
          <div className="market-section">
            <h3>📈 Top Gainers</h3>
            <div className="stocks-list">
              {marketData.gainers.map(stock => (
                <MarketMoverCard
                  key={stock.symbol}
                  stock={stock}
                  type="gainer"
                />
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="market-section">
            <h3>📉 Top Losers</h3>
            <div className="stocks-list">
              {marketData.losers.map(stock => (
                <MarketMoverCard
                  key={stock.symbol}
                  stock={stock}
                  type="loser"
                />
              ))}
            </div>
          </div>

          {/* Most Active */}
          <div className="market-section">
            <h3>🔥 Most Active</h3>
            <div className="stocks-list">
              {marketData.active.map(stock => (
                <MarketMoverCard
                  key={stock.symbol}
                  stock={stock}
                  type="active"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="quick-stats">
        <h2>Portfolio Summary</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{watchlist.length}</div>
            <div className="stat-label">Tracked Stocks</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {watchlist.filter(s => s.change > 0).length}
            </div>
            <div className="stat-label">Stocks Up</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {watchlist.filter(s => s.change < 0).length}
            </div>
            <div className="stat-label">Stocks Down</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {watchlist.length > 0 
                ? Math.round(watchlist.filter(s => s.change > 0).length / watchlist.length * 100)
                : 0
              }%
            </div>
            <div className="stat-label">Success Rate</div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Market Mover Card Component
const MarketMoverCard = ({ stock, type }) => {
  const getChangeColor = (change) => {
    return change >= 0 ? 'positive' : 'negative';
  };

  const formatChange = (change) => {
    return change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
  };

  return (
    <div className="market-mover-card">
      <div className="mover-symbol">{stock.symbol}</div>
      <div className="mover-price">${stock.currentPrice?.price?.toFixed(2) || '0.00'}</div>
      <div className={`mover-change ${getChangeColor(stock.currentPrice?.changePercent)}`}>
        {formatChange(stock.currentPrice?.changePercent || 0)}
      </div>
    </div>
  );
};

export default Dashboard;