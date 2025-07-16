/**
 * Query key management system for React Query
 * This file defines hierarchical query key patterns for effective cache management
 */

const queryKeys = {
  // Posts domain
  posts: {
    all: ['posts'],
    lists: () => [...queryKeys.posts.all, 'list'],
    list: (filters) => [...queryKeys.posts.lists(), filters],
    details: () => [...queryKeys.posts.all, 'detail'],
    detail: (id) => [...queryKeys.posts.details(), id],
    similar: (id) => [...queryKeys.posts.detail(id), 'similar'],
    comments: (id) => [...queryKeys.posts.detail(id), 'comments'],
    likes: (id) => [...queryKeys.posts.detail(id), 'likes'],
    bookmarks: (id) => [...queryKeys.posts.detail(id), 'bookmarks']
  },
  
  // Users domain
  users: {
    all: ['users'],
    profile: (id) => [...queryKeys.users.all, 'profile', id],
    current: () => [...queryKeys.users.all, 'current'],
    interests: (id) => [...queryKeys.users.all, 'interests', id],
    status: () => [...queryKeys.users.all, 'status']
  },
  
  // Auth domain
  auth: {
    all: ['auth'],
    session: () => [...queryKeys.auth.all, 'session'],
    token: () => [...queryKeys.auth.all, 'token']
  },
  
  // Comments domain
  comments: {
    all: ['comments'],
    list: (filters) => [...queryKeys.comments.all, 'list', filters],
    detail: (id) => [...queryKeys.comments.all, 'detail', id]
  },
  
  // Notifications domain
  notifications: {
    all: ['notifications'],
    list: (filters) => [...queryKeys.notifications.all, 'list', filters],
    unread: () => [...queryKeys.notifications.all, 'unread']
  },
  
  // Boards domain
  boards: {
    all: ['boards'],
    list: (filters) => [...queryKeys.boards.all, 'list', filters],
    detail: (id) => [...queryKeys.boards.all, 'detail', id]
  },
  
  // Search domain
  search: {
    all: ['search'],
    results: (query) => [...queryKeys.search.all, 'results', query]
  },
  
  // Recommendations domain
  recommendations: {
    all: ['recommendations'],
    home: (params) => [...queryKeys.recommendations.all, 'home', params],
    topics: () => [...queryKeys.recommendations.all, 'topics'],
    tags: () => [...queryKeys.recommendations.all, 'tags'],
    interests: () => [...queryKeys.recommendations.all, 'interests'],
    trending: () => [...queryKeys.recommendations.all, 'trending']
  }
};

export default queryKeys; 