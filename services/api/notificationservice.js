import axios from 'axios';

class NotificationService {
  // Get user's notifications
  async getNotifications(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const response = await axios.get(`/api/notifications?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await axios.put(`/api/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await axios.put('/api/notifications/read-all');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const response = await axios.delete(`/api/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Clear all notifications
  async clearAllNotifications() {
    try {
      const response = await axios.delete('/api/notifications');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get unread notifications count
  async getUnreadCount() {
    try {
      const response = await axios.get('/api/notifications?unreadOnly=true&limit=1');
      return response.data.data.summary.unread;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handler
  handleError(error) {
    if (error.response) {
      return {
        message: error.response.data?.message || 'Notification operation failed',
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

export default new NotificationService();