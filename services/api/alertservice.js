import axios from 'axios';

class AlertService {
  // Get user's alerts
  async getAlerts(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const response = await axios.get(`/api/alerts?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get specific alert by ID
  async getAlert(alertId) {
    try {
      const response = await axios.get(`/api/alerts/${alertId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create new alert
  async createAlert(alertData) {
    try {
      const response = await axios.post('/api/alerts', alertData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update alert
  async updateAlert(alertId, updateData) {
    try {
      const response = await axios.put(`/api/alerts/${alertId}`, updateData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete alert
  async deleteAlert(alertId) {
    try {
      const response = await axios.delete(`/api/alerts/${alertId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Reset alert (make it active again)
  async resetAlert(alertId) {
    try {
      const response = await axios.post(`/api/alerts/${alertId}/reset`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Trigger alert manually (for testing)
  async triggerAlert(alertId, triggerData = {}) {
    try {
      const response = await axios.post(`/api/alerts/${alertId}/trigger`, triggerData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Snooze alert
  async snoozeAlert(alertId, minutes = 60) {
    try {
      const response = await axios.post(`/api/alerts/${alertId}/snooze`, { minutes });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Toggle alert active state
  async toggleAlert(alertId) {
    try {
      const response = await axios.post(`/api/alerts/${alertId}/toggle`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get alerts for specific stock
  async getStockAlerts(symbol, activeOnly = true) {
    try {
      const response = await axios.get(`/api/alerts/stock/${symbol}?activeOnly=${activeOnly}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get triggered alerts history
  async getTriggeredAlerts(limit = 50, days = 30) {
    try {
      const response = await axios.get(`/api/alerts/history/triggered?limit=${limit}&days=${days}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Bulk delete alerts
  async bulkDeleteAlerts(alertIds) {
    try {
      const response = await axios.delete('/api/alerts/bulk', { data: { alertIds } });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handler
  handleError(error) {
    if (error.response) {
      return {
        message: error.response.data?.message || 'Alert operation failed',
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

export default new AlertService();