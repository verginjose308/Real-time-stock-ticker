import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './profile.css';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: ''
  });

  // Preferences form state
  const [preferences, setPreferences] = useState({
    theme: 'light',
    currency: 'USD',
    defaultView: 'grid',
    refreshInterval: 60000,
    notifications: {
      email: true,
      push: true,
      priceAlerts: true,
      newsAlerts: true
    }
  });

  // Fetch user data
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userData = response.data.data.user;
      setUser(userData);
      
      // Set profile form
      setProfileForm({
        firstName: userData.profile?.firstName || '',
        lastName: userData.profile?.lastName || '',
        email: userData.email,
        phone: userData.profile?.phone || '',
        bio: userData.profile?.bio || ''
      });

      // Set preferences
      if (userData.preferences) {
        setPreferences(userData.preferences);
      }

    } catch (err) {
      console.error('Failed to fetch user data:', err);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/alerts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(response.data.data.alerts);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.data.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  // Update profile
  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put('/api/auth/profile', profileForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      fetchUserData(); // Refresh data
    } catch (err) {
      console.error('Failed to update profile:', err);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  // Update preferences
  const updatePreferences = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put('/api/auth/preferences', preferences, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage({ type: 'success', text: 'Preferences updated successfully' });
    } catch (err) {
      console.error('Failed to update preferences:', err);
      setMessage({ type: 'error', text: 'Failed to update preferences' });
    } finally {
      setSaving(false);
    }
  };

  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle preferences changes
  const handlePreferenceChange = (section, key, value) => {
    if (section === 'notifications') {
      setPreferences(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [key]: value
        }
      }));
    } else {
      setPreferences(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications(); // Refresh notifications
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Delete alert
  const deleteAlert = async (alertId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/alerts/${alertId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAlerts(); // Refresh alerts
      setMessage({ type: 'success', text: 'Alert deleted successfully' });
    } catch (err) {
      console.error('Failed to delete alert:', err);
      setMessage({ type: 'error', text: 'Failed to delete alert' });
    }
  };

  // Clear message after 3 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Load data when component mounts or tab changes
  useEffect(() => {
    fetchUserData();
    
    if (activeTab === 'alerts') {
      fetchAlerts();
    } else if (activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [activeTab]);

  if (loading && !user) {
    return (
      <div className="profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <h1>Profile & Settings</h1>
        <div className="user-badge">
          <div className="avatar">
            {user?.profile?.firstName?.[0]}{user?.profile?.lastName?.[0]}
          </div>
          <div className="user-info">
            <div className="user-name">
              {user?.profile?.firstName} {user?.profile?.lastName}
            </div>
            <div className="user-email">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="profile-tabs">
        <button 
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile
        </button>
        <button 
          className={`tab ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          🔔 Alerts
        </button>
        <button 
          className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          📱 Notifications
        </button>
        <button 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <ProfileTab 
            profileForm={profileForm}
            onChange={handleProfileChange}
            onSave={updateProfile}
            saving={saving}
            user={user}
          />
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <AlertsTab 
            alerts={alerts}
            onDeleteAlert={deleteAlert}
            onRefresh={fetchAlerts}
          />
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <NotificationsTab 
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onRefresh={fetchNotifications}
          />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <SettingsTab 
            preferences={preferences}
            onChange={handlePreferenceChange}
            onSave={updatePreferences}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
};

// Profile Tab Component
const ProfileTab = ({ profileForm, onChange, onSave, saving, user }) => {
  return (
    <div className="profile-tab">
      <form onSubmit={onSave} className="profile-form">
        <div className="form-section">
          <h3>Personal Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={profileForm.firstName}
                onChange={onChange}
                placeholder="Enter your first name"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={profileForm.lastName}
                onChange={onChange}
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profileForm.email}
              onChange={onChange}
              placeholder="Enter your email"
              disabled
            />
            <small>Email cannot be changed</small>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={profileForm.phone}
              onChange={onChange}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={profileForm.bio}
              onChange={onChange}
              placeholder="Tell us about yourself..."
              rows="4"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Account Info */}
      <div className="account-info">
        <h3>Account Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Member Since</span>
            <span className="info-value">
              {user ? new Date(user.createdAt).toLocaleDateString() : '-'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Last Login</span>
            <span className="info-value">
              {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Subscription</span>
            <span className="info-value plan">{user?.subscription?.plan || 'Free'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Watchlist Items</span>
            <span className="info-value">{user?.watchlist?.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Alerts Tab Component
const AlertsTab = ({ alerts, onDeleteAlert, onRefresh }) => {
  const formatCondition = (alert) => {
    const conditions = {
      'PRICE_ABOVE': `Price above $${alert.condition.targetValue}`,
      'PRICE_BELOW': `Price below $${alert.condition.targetValue}`,
      'PRICE_PERCENT_UP': `Price up ${alert.condition.targetValue}%`,
      'PRICE_PERCENT_DOWN': `Price down ${alert.condition.targetValue}%`
    };
    return conditions[alert.condition.type] || alert.condition.type;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'ACTIVE': { class: 'active', label: 'Active' },
      'TRIGGERED': { class: 'triggered', label: 'Triggered' },
      'CANCELLED': { class: 'cancelled', label: 'Cancelled' }
    };
    const config = statusConfig[status] || { class: 'default', label: status };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  return (
    <div className="alerts-tab">
      <div className="tab-header">
        <h3>Price Alerts</h3>
        <button className="btn-refresh" onClick={onRefresh}>
          ↻ Refresh
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <h4>No Alerts Set</h4>
          <p>Create price alerts to get notified when stocks reach your target prices</p>
          <button className="btn-primary">Create Alert</button>
        </div>
      ) : (
        <div className="alerts-list">
          {alerts.map(alert => (
            <div key={alert.id} className="alert-item">
              <div className="alert-main">
                <div className="alert-info">
                  <div className="alert-symbol">{alert.stockSymbol}</div>
                  <div className="alert-name">{alert.name}</div>
                  <div className="alert-condition">{formatCondition(alert)}</div>
                </div>
                <div className="alert-actions">
                  {getStatusBadge(alert.status)}
                  <button 
                    className="btn-delete"
                    onClick={() => onDeleteAlert(alert.id)}
                    title="Delete alert"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              {alert.triggeredAt && (
                <div className="alert-triggered">
                  Triggered on {new Date(alert.triggeredAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Notifications Tab Component
const NotificationsTab = ({ notifications, onMarkAsRead, onRefresh }) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    // This would call an API endpoint to mark all as read
    notifications.forEach(notification => {
      if (!notification.read) {
        onMarkAsRead(notification._id);
      }
    });
  };

  return (
    <div className="notifications-tab">
      <div className="tab-header">
        <h3>Notifications</h3>
        <div className="notification-actions">
          <span className="unread-count">{unreadCount} unread</span>
          {unreadCount > 0 && (
            <button className="btn-mark-all" onClick={markAllAsRead}>
              Mark all as read
            </button>
          )}
          <button className="btn-refresh" onClick={onRefresh}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📱</div>
          <h4>No Notifications</h4>
          <p>You're all caught up! New notifications will appear here.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notification => (
            <div 
              key={notification._id} 
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              onClick={() => !notification.read && onMarkAsRead(notification._id)}
            >
              <div className="notification-icon">
                {notification.type === 'alert' ? '🔔' : '📊'}
              </div>
              <div className="notification-content">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-message">{notification.message}</div>
                <div className="notification-time">
                  {new Date(notification.createdAt).toLocaleDateString()} at {' '}
                  {new Date(notification.createdAt).toLocaleTimeString()}
                </div>
              </div>
              {!notification.read && (
                <div className="unread-indicator"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Settings Tab Component
const SettingsTab = ({ preferences, onChange, onSave, saving }) => {
  return (
    <div className="settings-tab">
      <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
        <div className="settings-section">
          <h3>Display Preferences</h3>
          
          <div className="setting-group">
            <label htmlFor="theme">Theme</label>
            <select
              id="theme"
              value={preferences.theme}
              onChange={(e) => onChange('display', 'theme', e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="currency">Currency</label>
            <select
              id="currency"
              value={preferences.currency}
              onChange={(e) => onChange('display', 'currency', e.target.value)}
            >
              <option value="USD">US Dollar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="GBP">British Pound (GBP)</option>
              <option value="JPY">Japanese Yen (JPY)</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="defaultView">Default View</label>
            <select
              id="defaultView"
              value={preferences.defaultView}
              onChange={(e) => onChange('display', 'defaultView', e.target.value)}
            >
              <option value="grid">Grid View</option>
              <option value="list">List View</option>
              <option value="detailed">Detailed View</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="refreshInterval">Data Refresh Interval</label>
            <select
              id="refreshInterval"
              value={preferences.refreshInterval}
              onChange={(e) => onChange('display', 'refreshInterval', parseInt(e.target.value))}
            >
              <option value={30000}>30 seconds</option>
              <option value={60000}>1 minute</option>
              <option value={120000}>2 minutes</option>
              <option value={300000}>5 minutes</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3>Notification Preferences</h3>
          
          <div className="notification-settings">
            <div className="notification-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={preferences.notifications.email}
                  onChange={(e) => onChange('notifications', 'email', e.target.checked)}
                />
                <span className="toggle-label">Email Notifications</span>
              </label>
            </div>

            <div className="notification-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={preferences.notifications.push}
                  onChange={(e) => onChange('notifications', 'push', e.target.checked)}
                />
                <span className="toggle-label">Push Notifications</span>
              </label>
            </div>

            <div className="notification-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={preferences.notifications.priceAlerts}
                  onChange={(e) => onChange('notifications', 'priceAlerts', e.target.checked)}
                />
                <span className="toggle-label">Price Alerts</span>
              </label>
            </div>

            <div className="notification-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={preferences.notifications.newsAlerts}
                  onChange={(e) => onChange('notifications', 'newsAlerts', e.target.checked)}
                />
                <span className="toggle-label">News Alerts</span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;