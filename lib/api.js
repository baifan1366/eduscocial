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

  globalLogout: async () => {
    const response = await fetch('/api/auth/global-logout', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Include current token in Authorization header if available
        ...(typeof document !== 'undefined' && document.cookie.includes('auth_token=') && {
          'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]?.split(';')[0]}`
        })
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Global logout failed');
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

// business profile related api
const businessUserApi = {
  getBusinessProfile: async (userId) => {
    const response = await fetch(`/api/business/${userId}/profile`);
    return response.json();
  }
}

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

// Boards-related API functions
const boardsApi = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetch(`/api/boards${query}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch boards');
    }
    
    return response.json();
  },
  createByAdmin: async (data) => {
    const response = await fetch('/api/admin/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create board');
    }

    return response.json();
  },
  checkExists: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetch(`/api/admin/boards/check${query}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check board existence');
    }
    
    return response.json();
  },
  getBoardByBoardId: async (boardId) => {
    const response = await fetch(`/api/admin/boards/${boardId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch board by board ID');
    }
    
    return response.json();
  },
  editBoardByAdmin: async (boardId, data) => {
    const response = await fetch(`/api/admin/boards/${boardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to edit board');
    }

    return response.json(); 
  },
  updateBoardActiveStatus: async (boardId, data) => {
    const response = await fetch(`/api/admin/boards/${boardId}/active`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update board active status');
    }

    return response.json();
  },
  updateBoardStatus: async (boardId, data) => {
    const response = await fetch(`/api/admin/boards/${boardId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update board status');
    }

    return response.json();
  },
  createByUser: async (data) => {
    const response = await fetch('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create board by user');
    }

    return response.json();
  },
  getBoardByUserId: async (userId) => {
    const response = await fetch(`/api/boards/user/${userId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch board by user ID');
    }
    return response.json();
  }
};

const categoryApi = {
  create: async (data) => {
    const response = await fetch('/api/admin/category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create category');
    }

    return response.json();
  },
  update: async (id, data) => {
    const response = await fetch(`/api/admin/category/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update category');
    }

    return response.json();
  },
  delete: async (id) => {
    const response = await fetch(`/api/admin/category/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete category');
    }

    return response.json();
  },
  checkExists: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetch(`/api/admin/category/check${query}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check category existence');
    }

    return response.json();
  },
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetch(`/api/admin/category${query}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch categories');
    }

    return response.json();
  },
  updateCategoryActiveStatus: async (id, data) => {
    const response = await fetch(`/api/admin/category/${id}/active`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update category active status');
    }

    return response.json();
  }
};

const boardCategoryMappingApi = {
  getAll: async (boardId, categoryId) => {
    const response = await fetch(`/api/admin/board-category`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId, categoryId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch board category mapping');
    }

    return response.json();
  },  
  update: async (data) => {
    const response = await fetch(`/api/admin/board-category`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update board category mapping');
    }

    return response.json();
  }
}

// Settings-related API functions
const settingsApi = {
  settings: {
    get: async () => {
      const response = await fetch('/api/users/settings');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch settings');
      }
      
      return response.json();
    },
    
    update: async (settings) => {
      const response = await fetch('/api/users/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update settings');
      }
      
      return response.json();
    },
    
    uploadSchoolInfo: async (data) => {
      const response = await fetch('/api/users/school-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload school info');
      }
      
      return response.json();
    }
  }
};

// Posts-related API functions
const postsApi = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetch(`/api/posts${query}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch posts');
    }
    
    return response.json();
  },
  
  getById: async (id) => {
    const response = await fetch(`/api/posts/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch post');
    }
    
    return response.json();
  },
  
  create: async (data) => {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create post');
    }
    
    return response.json();
  },

  getDraft: async (type = 'general') => {
    try {
      const response = await fetch(`/api/posts/draft?type=${type}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok && response.status !== 404) {
        const error = await response.json();
        throw new Error(error.message || `Failed to fetch draft: ${response.status}`);
      }
      
      // If 404, return empty data to indicate no draft found
      if (response.status === 404) {
        return { data: null };
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching draft:', error);
      return { data: null, error: error.message };
    }
  },

  saveDraft: async (data) => {
    const response = await fetch('/api/posts/draft', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save draft');
    }
    
    return response.json();
  },
  
  update: async (id, data) => {
    const response = await fetch(`/api/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update post');
    }
    
    return response.json();
  },
  
  delete: async (id) => {
    const response = await fetch(`/api/posts/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete post');
    }
    
    return response.json();
  }
};

// Users API (separate from the users object above for consistency)
const usersApi = {
  getProfile: async (userId) => {
    const response = await fetch(`/api/users/${userId}/profile`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch user profile');
    }
    
    return response.json();
  }
};

// Recommend-related API functions
const recommendApi = {
  getTags: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetch(`/api/recommend/tags${query}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch recommended tags');
    }
    
    return response.json();
  },
  
  getTopics: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetch(`/api/recommend/topics${query}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch recommended topics');
    }
    
    return response.json();
  },
  
  checkNewUser: async (userId) => {
    const response = await fetch(`/api/recommend/check-new-user?userId=${userId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check new user status');
    }
    
    return response.json();
  },
  
  updateUserInterests: async (data) => {
    const response = await fetch('/api/recommend/user-interests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update user interests');
    }
    
    return response.json();
  }
};

// Cards-related API functions
const cardsApi = {
  getAll: async () => {
    const response = await fetch('/api/cards');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch cards');
    }
    
    return response.json();
  },
  
  create: async (data) => {
    const response = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create card');
    }
    
    return response.json();
  }
};

const creditPlansApi = {
  getAll: async () => {
    const response = await fetch('/api/credit-plans');
    return response.json();
  }
}

const paymentsApi = {
  checkout: async (data) => {
    const response = await fetch('/api/payments/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

const creditOrdersApi = {
  getAll: async (id) => {
    const response = await fetch(`/api/business/${id}/credit-orders`);
    return response.json();
  },
  update: async (id, data) => {
    const response = await fetch(`/api/business/credit-orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  create: async (data) => {
    const response = await fetch('/api/business/credit-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

const creditTransactionsApi = {
  getAll: async (id) => {
    const response = await fetch(`/api/business/${id}/credit-transactions`);
    return response.json();
  },
  create: async (data) => {
    const response = await fetch('/api/business/credit-transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

const businessCreditsApi = {
  getAll: async (id) => {
    const response = await fetch(`/api/business/${id}/credits`);
    return response.json();
  },
  update: async (id, data) => {
    const response = await fetch(`/api/business/${id}/credits`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

const invoicesApi = {
  getAll: async (id) => {
    const response = await fetch(`/api/business/${id}/invoices`);
    return response.json();
  },
  create: async (data) => {
    const response = await fetch('/api/business/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

// Export the API client
export const api = {
  auth,
  users,
  notifyApi,
  businessUserApi
};

// Export individual API sections for backward compatibility
export { 
  boardsApi, 
  settingsApi, 
  postsApi, 
  usersApi, 
  recommendApi, 
  cardsApi, 
  categoryApi, 
  boardCategoryMappingApi, 
  creditPlansApi, 
  paymentsApi, 
  creditOrdersApi,
  creditTransactionsApi,
  businessCreditsApi,
  invoicesApi
};