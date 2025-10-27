import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StockCard from '../components/stockcard';
import '../styles/stocksPage.css';

const StocksPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [popularStocks, setPopularStocks] = useState([]);
  const [marketData, setMarketData] = useState({
    gainers: [],
    losers: [],
    active: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');

  // Popular stocks to show
  const defaultPopularStocks = [
    'AAPL', 'TSLA', 'AMZN', 'GOOGL', 'MSFT', 'META',
    'NVDA', 'NFLX', 'AMD', 'INTC', 'BA', 'DIS'
  ];

  // Fetch popular stocks data
  const fetchPopularStocks = async () => {
    try {
      const symbols = defaultPopularStocks.join(',');
      const response = await axios.get(`/api/stocks/batch/${symbols}`);
      setPopularStocks(response.data.data.stocks);
    } catch (err) {
      console.error('Failed to fetch popular stocks:', err);
    }
  };

  // Fetch market data
  const fetchMarketData = async () => {
    try {
      const [gainersResponse, losersResponse, activeResponse] = await Promise.all([
        axios.get('/api/stocks/market/gainers?limit=10'),
        axios.get('/api/stocks/market/losers?limit=10'),
        axios.get('/api/stocks/market/active?limit=10')
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

  // Search stocks
  const searchStocks = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`/api/stocks/search?q=${encodeURIComponent(query)}&limit=20`);
      setSearchResults(response.data.data.stocks);
    } catch (err) {
      console.error('Stock search error:', err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchStocks(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Load initial data
  useEffect(() => {
    fetchPopularStocks();
    fetchMarketData();
  }, []);

  return (
    <div className="stocks-page">
      {/* Header */}
      <div className="stocks-header">
        <h1>Explore Stocks</h1>
        <p>Discover and research stocks for your investment portfolio</p>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search stocks by symbol or company name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {loading && <div className="search-spinner"></div>}
        </div>
      </div>

      {/* Tabs */}
      <div className="stocks-tabs">
        <button 
          className={`tab ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          🔍 Discover
        </button>
        <button 
          className={`tab ${activeTab === 'gainers' ? 'active' : ''}`}
          onClick={() => setActiveTab('gainers')}
        >
          📈 Top Gainers
        </button>
        <button 
          className={`tab ${activeTab === 'losers' ? 'active' : ''}`}
          onClick={() => setActiveTab('losers')}
        >
          📉 Top Losers
        </button>
        <button 
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          🔥 Most Active
        </button>
      </div>

      {/* Content */}
      <div className="stocks-content">
        {/* Search Results */}
        {searchQuery && (
          <div className="search-results-section">
            <h2>Search Results for "{searchQuery}"</h2>
            {searchResults.length === 0 && !loading ? (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>No stocks found</h3>
                <p>Try searching with a different symbol or company name</p>
              </div>
            ) : (
              <div className="stocks-grid">
                {searchResults.map(stock => (
                  <StockCard
                    key={stock.symbol}
                    symbol={stock.symbol}
                    compact={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content */}
        {!searchQuery && (
          <>
            {/* Discover Tab */}
            {activeTab === 'discover' && (
              <div className="tab-content">
                <section className="popular-stocks">
                  <h2>Popular Stocks</h2>
                  <div className="stocks-grid">
                    {popularStocks.map(stock => (
                      <StockCard
                        key={stock.symbol}
                        symbol={stock.symbol}
                        compact={false}
                      />
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* Gainers Tab */}
            {activeTab === 'gainers' && (
              <div className="tab-content">
                <section className="market-stocks">
                  <h2>Today's Top Gainers</h2>
                  <div className="stocks-grid">
                    {marketData.gainers.map(stock => (
                      <StockCard
                        key={stock.symbol}
                        symbol={stock.symbol}
                        compact={false}
                      />
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* Losers Tab */}
            {activeTab === 'losers' && (
              <div className="tab-content">
                <section className="market-stocks">
                  <h2>Today's Top Losers</h2>
                  <div className="stocks-grid">
                    {marketData.losers.map(stock => (
                      <StockCard
                        key={stock.symbol}
                        symbol={stock.symbol}
                        compact={false}
                      />
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* Active Tab */}
            {activeTab === 'active' && (
              <div className="tab-content">
                <section className="market-stocks">
                  <h2>Most Active Stocks</h2>
                  <div className="stocks-grid">
                    {marketData.active.map(stock => (
                      <StockCard
                        key={stock.symbol}
                        symbol={stock.symbol}
                        compact={false}
                      />
                    ))}
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StocksPage;