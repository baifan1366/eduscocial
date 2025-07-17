/**
 * Centralized API client with standardized error handling and configuration
 */

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const DEFAULT_TIMEOUT = 10000; // 10 seconds

// Custom error class for API errors
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Base HTTP client configuration
class ApiClient {
  constructor(baseURL = API_BASE_URL, timeout = DEFAULT_TIMEOUT) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Request interceptor for adding auth headers and logging
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Merge headers
      const headers = {
        ...this.defaultHeaders,
        ...options.headers,
      };

      // Add auth token if available (from cookies or session)
      if (typeof window !== 'undefined') {
        // Client-side: get from cookies or localStorage if needed
        // This will be handled by Next.js middleware for most cases
      }

      const config = {
        ...options,
        headers,
        signal: controller.signal,
      };

      // Log request in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`API Request: ${options.method || 'GET'} ${url}`, config);
      }

      const response = await fetch(url, config);
      
      clearTimeout(timeoutId);

      // Handle response
      return await this.handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      
      // Re-throw ApiError as-is
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Network or other errors
      throw new ApiError(
        error.message || 'Network error occurred',
        0,
        { originalError: error }
      );
    }
  }

  // Response interceptor for standardized error handling
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    let data;
    try {
      data = isJson ? await response.json() : await response.text();
    } catch (parseError) {
      data = null;
    }

    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status}`, data);
    }

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `HTTP ${response.status}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    return data;
  }

  // HTTP method helpers
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data = null) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
    });
  }

  async put(endpoint, data = null) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
    });
  }

  async patch(endpoint, data = null) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : null,
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Standardized response format interfaces
export const createSuccessResponse = (data, message = 'Success') => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString(),
});

export const createErrorResponse = (error, message = 'An error occurred') => ({
  success: false,
  error: error instanceof Error ? error.message : error,
  message,
  timestamp: new Date().toISOString(),
});

// Helper function to handle API responses consistently
export const handleApiResponse = async (apiCall) => {
  try {
    const data = await apiCall();
    return createSuccessResponse(data);
  } catch (error) {
    console.error('API Error:', error);
    return createErrorResponse(error, error.message);
  }
};

// Domain-specific API endpoints

/**
 * Posts API endpoints
 */
export const postsApi = {
  // Get all posts with pagination and filtering
  getAll: (params = {}) => apiClient.get('/posts', params),
  
  // Get a single post by ID
  getById: (id) => apiClient.get(`/posts/${id}`),
  
  // Create a new post
  create: (data) => apiClient.post('/posts/publish', data),
  
  // Update an existing post
  update: (id, data) => apiClient.put(`/posts/${id}`, data),
  
  // Delete a post
  delete: (id) => apiClient.delete(`/posts/${id}`),
  
  // Like a post
  like: (id) => apiClient.post(`/posts/${id}/like`),
  
  // Unlike a post
  unlike: (id) => apiClient.delete(`/posts/${id}/like`),
  
  // Bookmark a post
  bookmark: (id) => apiClient.post(`/posts/${id}/bookmark`),
  
  // Remove bookmark from a post
  removeBookmark: (id) => apiClient.delete(`/posts/${id}/bookmark`),
  
  // Report a post
  report: (id, reason) => apiClient.post(`/posts/${id}/report`, { reason }),
  
  // Get similar posts
  getSimilar: (id) => apiClient.get(`/posts/similar/${id}`)
};

/**
 * Authentication API endpoints
 */
export const authApi = {
  // Login with credentials
  login: (credentials) => apiClient.post('/auth/login', credentials),
  
  // Register a new user
  register: (userData) => apiClient.post('/auth/register', userData),
  
  // Logout current user
  logout: () => apiClient.post('/auth/logout'),
  
  // Refresh authentication token
  refreshToken: () => apiClient.post('/auth/refresh-token'),
  
  // Check email availability
  checkEmail: (email) => apiClient.post('/auth/check-email', { email }),
  
  // Admin login
  adminLogin: (credentials) => apiClient.post('/admin/login', credentials),
  
  // Admin logout
  adminLogout: () => apiClient.post('/admin/logout')
};

/**
 * Users API endpoints
 */
export const usersApi = {
  // Get current user profile
  getCurrentProfile: () => apiClient.get('/users/current'),
  
  // Get user profile by ID
  getProfile: (id) => apiClient.get(`/users/${id}/profile`),
  
  // Update current user profile
  updateProfile: (data) => apiClient.put('/users/current', data),
  
  // Get user interests
  getInterests: () => apiClient.get('/users/interests'),
  
  // Update user interests
  updateInterests: (interests) => apiClient.put('/users/interests', { interests }),
  
  // Get onboarding status
  getOnboardingStatus: () => apiClient.get('/users/onboarding-status'),
  
  // Get user status
  getStatus: () => apiClient.get('/users/status'),
  
  // Get user notifications
  getNotifications: (userId, params = {}) => apiClient.get(`/users/${userId}/notification`, params),
  
  // Mark notifications as read
  markNotificationsRead: (userId, data) => apiClient.patch(`/users/${userId}/notification`, data),
  
  // Create notification for a user
  createNotification: (userId, data) => apiClient.post(`/users/${userId}/notification`, data)
};

/**
 * Notifications API endpoints
 */
export const notifyApi = {
  // Get notification by ID
  getById: (id) => apiClient.get(`/notify/${id}`),
  
  // Mark notification as read
  markAsRead: (id) => apiClient.patch(`/notify/${id}`),
  
  // Delete notification
  delete: (id) => apiClient.delete(`/notify/${id}`),
  
  // Get realtime notification config
  getRealtimeConfig: () => apiClient.get('/notify/realtime'),
  
  // Create SSE connection for realtime notifications
  createSSEConnection: () => {
    if (typeof window === 'undefined') return null;
    
    const eventSource = new EventSource('/notify/sse', { 
      withCredentials: true 
    });
    
    return eventSource;
  }
};

/**
 * Comments API endpoints
 */
export const commentsApi = {
  // Get comments for a post
  getForPost: (postId, params = {}) => apiClient.get('/comments', { postId, ...params }),
  
  // Create a comment
  create: (data) => apiClient.post('/comments', data),
  
  // Update a comment
  update: (id, data) => apiClient.put(`/comments/${id}`, data),
  
  // Delete a comment
  delete: (id) => apiClient.delete(`/comments/${id}`)
};

/**
 * Search API endpoints
 */
export const searchApi = {
  // Search content
  search: (query, filters = {}) => apiClient.get('/search', { query, ...filters })
};

/**
 * Board API endpoints
 */
export const boardsApi = {
  // Get all boards
  getAll: (params = {}) => apiClient.get('/boards', params),
  
  // Get board by ID
  getById: (id) => apiClient.get(`/boards/${id}`),
  
  // Create a board (admin)
  create: (data) => apiClient.post('/admin/boards', data),
  
  // Update a board (admin)
  update: (id, data) => apiClient.put(`/admin/boards/${id}`, data),
  
  // Delete a board (admin)
  delete: (id) => apiClient.delete(`/admin/boards/${id}`)
};

/**
 * Recommendation API endpoints
 */
export const recommendApi = {
  // Get home recommendations
  getHome: (params = {}) => apiClient.get('/recommend/home', params),
  
  // Get trending recommendations
  getTrending: (params = {}) => apiClient.get('/recommend/trending', params),
  
  // Get recommended topics
  getTopics: () => apiClient.get('/recommend/topics'),
  
  // Get recommended tags
  getTags: () => apiClient.get('/recommend/tags'),
  
  // Get interests-based recommendations
  getInterests: () => apiClient.get('/recommend/interests'),
  
  // Check if user is new for recommendations
  checkNewUser: () => apiClient.get('/recommend/check-new-user')
};

/**
 * Files API endpoints
 */
export const filesApi = {
  // Upload a file
  upload: (formData) => {
    return apiClient.request('/files', {
      method: 'POST',
      body: formData,
      headers: {
        // No Content-Type header as it will be set by the browser for FormData
      },
    });
  },
  
  // Get file by ID
  getById: (id) => apiClient.get(`/files/${id}`)
};

export const settingsApi = {
  settings: {
    // 上传学校信息
    uploadSchoolInfo: (data) => apiClient.post('/settings/school-info', data),
    
    // 获取学校信息
    getSchoolInfo: () => apiClient.get('/settings/school-info')
  }
}

// Export all API domains
export const api = {
  posts: postsApi,
  auth: authApi,
  users: usersApi,
  comments: commentsApi,
  search: searchApi,
  boards: boardsApi,
  recommend: recommendApi,
  files: filesApi,
  notify: notifyApi
};