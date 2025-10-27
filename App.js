import React, { useState, useEffect } from 'react';
import './App.css';

// Main App Component
function App() {
  const [appReady, setAppReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');

  // Mock data for demonstration
  const mockStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 185.43, change: 2.34, changePercent: 1.28 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.65, change: -0.45, changePercent: -0.31 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.85, change: 5.67, changePercent: 1.52 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.42, change: -3.21, changePercent: -1.28 },
  ];

  const mockWatchlists = [
    { id: 1, name: 'Tech Stocks', symbols: ['AAPL', 'GOOGL', 'MSFT'] },
    { id: 2, name: 'My Portfolio', symbols: ['AAPL', 'TSLA'] },
  ];

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing StockTrack application...');
        
        // Check for stored authentication
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
        
        if (token && userData) {
          setIsAuthenticated(true);
          setUser(JSON.parse(userData));
          console.log('User authenticated:', JSON.parse(userData));
        }

        // Simulate app initialization
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setAppReady(true);
        console.log('App initialization complete');
      } catch (error) {
        console.error('App initialization error:', error);
        setAppReady(true);
      }
    };

    initializeApp();
  }, []);

  // Authentication functions
  const handleLogin = (email, password) => {
    // Mock login - in real app, this would call an API
    const userData = {
      id: 1,
      email: email,
      name: 'Demo User',
      avatar: null
    };
    
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('auth_token', 'demo_jwt_token');
    localStorage.setItem('user_data', JSON.stringify(userData));
    
    return { success: true };
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setCurrentView('dashboard');
  };

  const handleRegister = (email, password, name) => {
    // Mock registration
    const userData = {
      id: Date.now(),
      email: email,
      name: name,
      avatar: null
    };
    
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('auth_token', 'demo_jwt_token');
    localStorage.setItem('user_data', JSON.stringify(userData));
    
    return { success: true };
  };

  // Loading screen
  if (!appReady) {
    return (
      <div className="app-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading StockTrack...</h2>
          <p>Preparing your stock market dashboard</p>
        </div>
      </div>
    );
  }

  // Authentication screens
  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>📈 StockTrack</h1>
            <p>Your personal stock market tracker</p>
          </div>
          
          {currentView === 'login' ? (
            <LoginForm 
              onLogin={handleLogin}
              onSwitchToRegister={() => setCurrentView('register')}
            />
          ) : (
            <RegisterForm 
              onRegister={handleRegister}
              onSwitchToLogin={() => setCurrentView('login')}
            />
          )}
        </div>
      </div>
    );
  }

  // Main application
  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <h1>📈 StockTrack</h1>
          </div>
          
          <nav className="navigation">
            <button 
              className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={`nav-btn ${currentView === 'watchlist' ? 'active' : ''}`}
              onClick={() => setCurrentView('watchlist')}
            >
              Watchlists
            </button>
            <button 
              className={`nav-btn ${currentView === 'alerts' ? 'active' : ''}`}
              onClick={() => setCurrentView('alerts')}
            >
              Alerts
            </button>
          </nav>
          
          <div className="user-menu">
            <span>Welcome, {user?.name}</span>
            <button 
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <div className="container">
          {currentView === 'dashboard' && (
            <DashboardView stocks={mockStocks} />
          )}
          
          {currentView === 'watchlist' && (
            <WatchlistView watchlists={mockWatchlists} stocks={mockStocks} />
          )}
          
          {currentView === 'alerts' && (
            <AlertsView />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>&copy; 2024 StockTrack. Demo application for stock market tracking.</p>
        </div>
      </footer>
    </div>
  );
}

// Authentication Components
const LoginForm = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = onLogin(email, password);
    if (!result.success) {
      alert('Login failed. Please try again.');
    }
    
    setIsLoading(false);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Sign In</h2>
      
      <div className="form-group">
        <label>Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />
      </div>
      
      <button 
        type="submit" 
        className="auth-submit-btn"
        disabled={isLoading}
      >
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>
      
      <p className="auth-switch">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchToRegister} className="link-btn">
          Sign up
        </button>
      </p>
      
      <div className="demo-note">
        <p><strong>Demo:</strong> Use any email and password</p>
      </div>
    </form>
  );
};

const RegisterForm = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = onRegister(formData.email, formData.password, formData.name);
    if (!result.success) {
      alert('Registration failed. Please try again.');
    }
    
    setIsLoading(false);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Create Account</h2>
      
      <div className="form-group">
        <label>Full Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your full name"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Email Address</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a password"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm your password"
          required
        />
      </div>
      
      <button 
        type="submit" 
        className="auth-submit-btn"
        disabled={isLoading}
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>
      
      <p className="auth-switch">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="link-btn">
          Sign in
        </button>
      </p>
    </form>
  );
};

// Main View Components
const DashboardView = ({ stocks }) => {
  return (
    <div className="dashboard">
      <div className="page-header">
        <h2>Market Overview</h2>
        <p>Real-time stock prices and market data</p>
      </div>
      
      <div className="stocks-grid">
        {stocks.map(stock => (
          <div key={stock.symbol} className="stock-card">
            <div className="stock-header">
              <h3>{stock.symbol}</h3>
              <span className="stock-name">{stock.name}</span>
            </div>
            <div className="stock-price">${stock.price.toFixed(2)}</div>
            <div className={`stock-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
              {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent}%)
            </div>
          </div>
        ))}
      </div>
      
      <div className="quick-stats">
        <div className="stat-card">
          <h4>Portfolio Value</h4>
          <div className="stat-value">$45,678.90</div>
        </div>
        <div className="stat-card">
          <h4>Today's Gain</h4>
          <div className="stat-value positive">+$234.56</div>
        </div>
        <div className="stat-card">
          <h4>Active Alerts</h4>
          <div className="stat-value">3</div>
        </div>
      </div>
    </div>
  );
};

const WatchlistView = ({ watchlists, stocks }) => {
  return (
    <div className="watchlists">
      <div className="page-header">
        <h2>My Watchlists</h2>
        <button className="primary-btn">+ New Watchlist</button>
      </div>
      
      <div className="watchlists-grid">
        {watchlists.map(watchlist => (
          <div key={watchlist.id} className="watchlist-card">
            <h3>{watchlist.name}</h3>
            <div className="watchlist-stocks">
              {watchlist.symbols.map(symbol => {
                const stock = stocks.find(s => s.symbol === symbol);
                return stock ? (
                  <div key={symbol} className="watchlist-item">
                    <span className="symbol">{stock.symbol}</span>
                    <span className="price">${stock.price.toFixed(2)}</span>
                    <span className={`change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                      {stock.changePercent}%
                    </span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AlertsView = () => {
  return (
    <div className="alerts">
      <div className="page-header">
        <h2>Price Alerts</h2>
        <button className="primary-btn">+ New Alert</button>
      </div>
      
      <div className="alerts-list">
        <div className="alert-item">
          <div className="alert-info">
            <strong>AAPL</strong> above $190.00
          </div>
          <div className="alert-status active">Active</div>
        </div>
        <div className="alert-item">
          <div className="alert-info">
            <strong>TSLA</strong> below $240.00
          </div>
          <div className="alert-status active">Active</div>
        </div>
        <div className="alert-item">
          <div className="alert-info">
            <strong>GOOGL</strong> 5% increase
          </div>
          <div className="alert-status triggered">Triggered</div>
        </div>
      </div>
    </div>
  );
};

export default App;