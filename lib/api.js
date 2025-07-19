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

    return response.json();
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
};

// Export the API client
export const api = {
  auth,
  users,
};