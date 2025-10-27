import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './alerts.css';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // New alert form state
  const [newAlert, setNewAlert] = useState({
    stockSymbol: '',
    name: '',
    description: '',
    condition: {
      type: 'PRICE_ABOVE',
      targetValue: ''
    },
    priority: 'MEDIUM',
    notification: {
      types: ['IN_APP'],
      frequency: 'ONCE'
    }
  });

  // Fetch alerts from API
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/alerts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(response.data.data.alerts);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Create new alert
  const createAlert = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const token = localStorage.getItem('token');
      await axios.post('/api/alerts', newAlert, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowCreateAlert(false);
      resetNewAlertForm();
      fetchAlerts(); // Refresh the list
      
      setError({ type: 'success', message: 'Alert created successfully!' });
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error('Failed to create alert:', err);
      setError({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to create alert' 
      });
    }
  };

  // Delete alert
  const deleteAlert = async (alertId) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/alerts/${alertId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchAlerts(); // Refresh the list
      setError({ type: 'success', message: 'Alert deleted successfully!' });
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error('Failed to delete alert:', err);
      setError({ type: 'error', message: 'Failed to delete alert' });
    }
  };

  // Reset alert
  const resetAlert = async (alertId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/alerts/${alertId}/reset`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchAlerts(); // Refresh the list
      setError({ type: 'success', message: 'Alert reset successfully!' });
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error('Failed to reset alert:', err);
      setError({ type: 'error', message: 'Failed to reset alert' });
    }
  };

  // Toggle alert active state
  const toggleAlert = async (alertId, currentState) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/alerts/${alertId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchAlerts(); // Refresh the list
      setError({ 
        type: 'success', 
        message: `Alert ${currentState ? 'disabled' : 'enabled'} successfully!` 
      });
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error('Failed to toggle alert:', err);
      setError({ type: 'error', message: 'Failed to update alert' });
    }
  };

  // Refresh alerts
  const refreshAlerts = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  // Reset new alert form
  const resetNewAlertForm = () => {
    setNewAlert({
      stockSymbol: '',
      name: '',
      description: '',
      condition: {
        type: 'PRICE_ABOVE',
        targetValue: ''
      },
      priority: 'MEDIUM',
      notification: {
        types: ['IN_APP'],
        frequency: 'ONCE'
      }
    });
  };

  // Handle new alert form changes
  const handleNewAlertChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setNewAlert(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setNewAlert(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle notification types change
  const handleNotificationTypesChange = (type, checked) => {
    setNewAlert(prev => {
      const currentTypes = [...prev.notification.types];
      if (checked && !currentTypes.includes(type)) {
        currentTypes.push(type);
      } else if (!checked) {
        const index = currentTypes.indexOf(type);
        if (index > -1) {
          currentTypes.splice(index, 1);
        }
      }
      
      return {
        ...prev,
        notification: {
          ...prev.notification,
          types: currentTypes
        }
      };
    });
  };

  // Filter alerts based on active filter
  const filteredAlerts = alerts.filter(alert => {
    switch (activeFilter) {
      case 'ACTIVE':
        return alert.status === 'ACTIVE' && alert.isActive;
      case 'TRIGGERED':
        return alert.status === 'TRIGGERED';
      case 'INACTIVE':
        return !alert.isActive || alert.status === 'DISABLED';
      default:
        return true;
    }
  });

  // Get alert statistics
  const alertStats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'ACTIVE' && a.isActive).length,
    triggered: alerts.filter(a => a.status === 'TRIGGERED').length,
    inactive: alerts.filter(a => !a.isActive || a.status === 'DISABLED').length
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && alerts.length === 0) {
    return (
      <div className="alerts-container">
        <div className="loading">Loading alerts...</div>
      </div>
    );
  }

  return (
    <div className="alerts-container">
      {/* Header */}
      <div className="alerts-header">
        <div className="header-left">
          <h1>Price Alerts</h1>
          <p>Get notified when stocks reach your target prices</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-refresh"
            onClick={refreshAlerts}
            disabled={refreshing}
            title="Refresh alerts"
          >
            {refreshing ? '↻' : '↻'}
          </button>
          <button 
            className="btn-create-alert"
            onClick={() => setShowCreateAlert(true)}
          >
            + Create Alert
          </button>
        </div>
      </div>

      {/* Error/Success Message */}
      {error && (
        <div className={`message ${error.type}`}>
          {error.message}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Statistics */}
      <div className="alerts-stats">
        <div className="stat-card">
          <div className="stat-number">{alertStats.total}</div>
          <div className="stat-label">Total Alerts</div>
        </div>
        <div className="stat-card">
          <div className="stat-number active">{alertStats.active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-number triggered">{alertStats.triggered}</div>
          <div className="stat-label">Triggered</div>
        </div>
        <div className="stat-card">
          <div className="stat-number inactive">{alertStats.inactive}</div>
          <div className="stat-label">Inactive</div>
        </div>
      </div>

      {/* Filters */}
      <div className="alerts-filters">
        <button 
          className={`filter-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveFilter('ALL')}
        >
          All ({alertStats.total})
        </button>
        <button 
          className={`filter-btn ${activeFilter === 'ACTIVE' ? 'active' : ''}`}
          onClick={() => setActiveFilter('ACTIVE')}
        >
          Active ({alertStats.active})
        </button>
        <button 
          className={`filter-btn ${activeFilter === 'TRIGGERED' ? 'active' : ''}`}
          onClick={() => setActiveFilter('TRIGGERED')}
        >
          Triggered ({alertStats.triggered})
        </button>
        <button 
          className={`filter-btn ${activeFilter === 'INACTIVE' ? 'active' : ''}`}
          onClick={() => setActiveFilter('INACTIVE')}
        >
          Inactive ({alertStats.inactive})
        </button>
      </div>

      {/* Alerts List */}
      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h3>No alerts found</h3>
            <p>
              {activeFilter === 'ALL' 
                ? "You haven't created any price alerts yet."
                : `No ${activeFilter.toLowerCase()} alerts found.`
              }
            </p>
            {activeFilter === 'ALL' && (
              <button 
                className="btn-create-first"
                onClick={() => setShowCreateAlert(true)}
              >
                Create Your First Alert
              </button>
            )}
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDelete={deleteAlert}
              onReset={resetAlert}
              onToggle={toggleAlert}
            />
          ))
        )}
      </div>

      {/* Create Alert Modal */}
      {showCreateAlert && (
        <CreateAlertModal
          newAlert={newAlert}
          onChange={handleNewAlertChange}
          onNotificationTypesChange={handleNotificationTypesChange}
          onSubmit={createAlert}
          onClose={() => {
            setShowCreateAlert(false);
            resetNewAlertForm();
          }}
        />
      )}
    </div>
  );
};

// Alert Card Component
const AlertCard = ({ alert, onDelete, onReset, onToggle }) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatCondition = (alert) => {
    const conditions = {
      'PRICE_ABOVE': `Price above $${alert.condition.targetValue}`,
      'PRICE_BELOW': `Price below $${alert.condition.targetValue}`,
      'PRICE_PERCENT_UP': `Price up ${alert.condition.targetValue}%`,
      'PRICE_PERCENT_DOWN': `Price down ${alert.condition.targetValue}%`,
      'VOLUME_ABOVE': `Volume above ${formatNumber(alert.condition.targetValue)}`,
      'VOLUME_BELOW': `Volume below ${formatNumber(alert.condition.targetValue)}`
    };
    return conditions[alert.condition.type] || alert.condition.type;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getStatusInfo = (alert) => {
    const statusConfig = {
      'ACTIVE': { class: 'active', label: 'Active', icon: '🟢' },
      'TRIGGERED': { class: 'triggered', label: 'Triggered', icon: '🔴' },
      'DISABLED': { class: 'disabled', label: 'Disabled', icon: '⚫' },
      'CANCELLED': { class: 'cancelled', label: 'Cancelled', icon: '⚫' }
    };
    return statusConfig[alert.status] || { class: 'default', label: alert.status, icon: '⚫' };
  };

  const getPriorityInfo = (priority) => {
    const priorityConfig = {
      'LOW': { class: 'low', label: 'Low' },
      'MEDIUM': { class: 'medium', label: 'Medium' },
      'HIGH': { class: 'high', label: 'High' },
      'CRITICAL': { class: 'critical', label: 'Critical' }
    };
    return priorityConfig[priority] || { class: 'medium', label: priority };
  };

  const statusInfo = getStatusInfo(alert);
  const priorityInfo = getPriorityInfo(alert.priority);

  return (
    <div className={`alert-card ${statusInfo.class} ${!alert.isActive ? 'inactive' : ''}`}>
      <div className="alert-header">
        <div className="alert-main-info">
          <div className="stock-symbol">{alert.stockSymbol}</div>
          <div className="alert-name">{alert.name}</div>
        </div>
        <div className="alert-status">
          <span className={`status-badge ${statusInfo.class}`}>
            {statusInfo.icon} {statusInfo.label}
          </span>
        </div>
      </div>

      <div className="alert-condition">
        {formatCondition(alert)}
      </div>

      <div className="alert-meta">
        <span className={`priority-badge ${priorityInfo.class}`}>
          {priorityInfo.label}
        </span>
        <span className="trigger-count">
          Triggered {alert.triggerCount} times
        </span>
        {alert.triggeredAt && (
          <span className="triggered-time">
            Last: {new Date(alert.triggeredAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="alert-actions">
        {alert.status === 'TRIGGERED' && (
          <button 
            className="btn-reset"
            onClick={() => onReset(alert.id)}
            title="Reset alert"
          >
            Reset
          </button>
        )}
        
        <button 
          className={`btn-toggle ${alert.isActive ? 'disable' : 'enable'}`}
          onClick={() => onToggle(alert.id, alert.isActive)}
          title={alert.isActive ? 'Disable alert' : 'Enable alert'}
        >
          {alert.isActive ? 'Disable' : 'Enable'}
        </button>

        <button 
          className="btn-details"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '▲ Details' : '▼ Details'}
        </button>

        <button 
          className="btn-delete"
          onClick={() => onDelete(alert.id)}
          title="Delete alert"
        >
          ×
        </button>
      </div>

      {showDetails && (
        <div className="alert-details">
          <div className="detail-section">
            <div className="detail-item">
              <span>Description:</span>
              <span>{alert.description || 'No description'}</span>
            </div>
            <div className="detail-item">
              <span>Notifications:</span>
              <span>{alert.notification.types.join(', ')}</span>
            </div>
            <div className="detail-item">
              <span>Frequency:</span>
              <span>{alert.notification.frequency}</span>
            </div>
            <div className="detail-item">
              <span>Created:</span>
              <span>{new Date(alert.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Create Alert Modal Component
const CreateAlertModal = ({ newAlert, onChange, onNotificationTypesChange, onSubmit, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Search stocks
  const searchStocks = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await axios.get(`/api/stocks/search?q=${query}&limit=5`);
      setSearchResults(response.data.data.stocks);
    } catch (err) {
      console.error('Stock search error:', err);
    } finally {
      setSearching(false);
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

  const handleStockSelect = (stock) => {
    onChange('stockSymbol', stock.symbol);
    if (!newAlert.name) {
      onChange('name', `${stock.symbol} Price Alert`);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Price Alert</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={onSubmit} className="alert-form">
          {/* Stock Selection */}
          <div className="form-group">
            <label htmlFor="stockSymbol">Stock Symbol *</label>
            <div className="search-container">
              <input
                type="text"
                id="stockSymbol"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a stock (e.g., AAPL)"
                className="search-input"
              />
              {searching && <div className="search-spinner"></div>}
              
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map(stock => (
                    <div
                      key={stock.symbol}
                      className="search-result"
                      onClick={() => handleStockSelect(stock)}
                    >
                      <div className="stock-symbol">{stock.symbol}</div>
                      <div className="stock-name">{stock.companyName}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {newAlert.stockSymbol && (
              <div className="selected-stock">
                Selected: <strong>{newAlert.stockSymbol}</strong>
              </div>
            )}
          </div>

          {/* Alert Name */}
          <div className="form-group">
            <label htmlFor="alertName">Alert Name *</label>
            <input
              type="text"
              id="alertName"
              value={newAlert.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="e.g., AAPL Breakout Alert"
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="alertDescription">Description</label>
            <textarea
              id="alertDescription"
              value={newAlert.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Optional description for this alert"
              rows="3"
            />
          </div>

          {/* Condition */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="conditionType">Condition Type *</label>
              <select
                id="conditionType"
                value={newAlert.condition.type}
                onChange={(e) => onChange('condition.type', e.target.value)}
              >
                <option value="PRICE_ABOVE">Price Above</option>
                <option value="PRICE_BELOW">Price Below</option>
                <option value="PRICE_PERCENT_UP">Price % Up</option>
                <option value="PRICE_PERCENT_DOWN">Price % Down</option>
                <option value="VOLUME_ABOVE">Volume Above</option>
                <option value="VOLUME_BELOW">Volume Below</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="targetValue">Target Value *</label>
              <input
                type="number"
                id="targetValue"
                value={newAlert.condition.targetValue}
                onChange={(e) => onChange('condition.targetValue', e.target.value)}
                placeholder="e.g., 150.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          {/* Priority */}
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              value={newAlert.priority}
              onChange={(e) => onChange('priority', e.target.value)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {/* Notification Settings */}
          <div className="form-group">
            <label>Notification Methods</label>
            <div className="notification-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newAlert.notification.types.includes('IN_APP')}
                  onChange={(e) => onNotificationTypesChange('IN_APP', e.target.checked)}
                />
                <span>In-App Notification</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newAlert.notification.types.includes('EMAIL')}
                  onChange={(e) => onNotificationTypesChange('EMAIL', e.target.checked)}
                />
                <span>Email</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newAlert.notification.types.includes('PUSH')}
                  onChange={(e) => onNotificationTypesChange('PUSH', e.target.checked)}
                />
                <span>Push Notification</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-create">
              Create Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Alerts;