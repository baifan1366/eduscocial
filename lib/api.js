/**
 * API client for making requests to the backend
 */

// Auth-related API functions
const auth = {
  // Regular user authentication
  login: async (credentials) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    try {
      // 保存用户 ID 到 localStorage
      if (data.user && data.user.id) {
        localStorage.setItem('userId', data.user.id);
        console.log('Login API: 已保存用户ID到localStorage:', data.user.id);
      } else {
        console.warn('Login API: 找不到用户ID:', data);
      }
    } catch (e) {
      console.error('Login API: localStorage保存失败:', e);
    }
    
    return data;
  },

  register: async (userData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  },

  logout: async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Logout failed');
    }

    return response.json();
  },

  // Admin authentication
  adminLogin: async (credentials) => {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Admin login failed');
    }

    return response.json();
  },

  adminLogout: async () => {
    const response = await fetch('/api/admin/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Admin logout failed');
    }

    return response.json();
  },

  // Business authentication
  businessLogin: async (credentials) => {
    const response = await fetch('/api/business/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Business login failed');
    }

    return response.json();
  },

  businessRegister: async (businessData) => {
    const response = await fetch('/api/business/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(businessData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Business registration failed');
    }

    return response.json();
  },

  businessLogout: async () => {
    const response = await fetch('/api/business/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Business logout failed');
    }

    return response.json();
  },
};

// User-related API functions
const users = {
  getCurrentUser: async () => {
    const response = await fetch('/api/users/current');
    
    if (!response.ok) {
      if (response.status === 401) {
        return { authenticated: false };
      }
      throw new Error('Failed to fetch current user');
    }
    
    return response.json();
  },
  
  updateProfile: async (profileData) => {
    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }
    
    return response.json();
  },
  
  getUserProfile: async (userId) => {
    const response = await fetch(`/api/users/${userId}/profile`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch user profile');
    }
    
    return response.json();
  },

  // Notifications API methods
  getNotifications: async (userId, params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetch(`/api/users/${userId}/notification${query}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch notifications');
    }
    
    return response.json();
  },
  
  markNotificationsRead: async (userId, data) => {
    const response = await fetch(`/api/users/${userId}/notification/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to mark notifications as read');
    }
    
    return response.json();
  },
  
  createNotification: async (userId, data) => {
    const response = await fetch(`/api/notify/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create notification');
    }
    
    return response.json();
  }
};

// Notifications API functions
const notifyApi = {
  createSSEConnection: () => {
    if (typeof window === 'undefined') return null;
    
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return null;
      
      const eventSource = new EventSource(`/api/notify/sse?userId=${userId}`);
      return eventSource;
    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      return null;
    }
  }
};

// Export the API client
export const api = {
  auth,
  users,
  notifyApi
};