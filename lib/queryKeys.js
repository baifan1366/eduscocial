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

  //business user
  businessUser: {
    all: ['businessUser'],
    profile: (id) => [...queryKeys.businessUser.all, 'profile', id],
    current: () => [...queryKeys.businessUser.all, 'current']
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
    detail: (id) => [...queryKeys.boards.all, 'detail', id],
    byId: (id) => [...queryKeys.boards.all, 'byId', id],
    byUserId: (userId) => [...queryKeys.boards.all, 'byUserId', userId]
  },

  // categories domain
  categories: {
    all: ['categories'],
    list: (filters) => [...queryKeys.categories.all, 'list', filters],
    detail: (id) => [...queryKeys.categories.all, 'detail', id]
  },

  // board category mappings domain
  boardCategoryMappings: {
    all: ['boardCategoryMappings'],
    list: (filters) => [...queryKeys.boardCategoryMappings.all, 'list', filters],
    detail: (id) => [...queryKeys.boardCategoryMappings.all, 'detail', id],
    byBoardId: (boardId) => [...queryKeys.boardCategoryMappings.all, 'byBoardId', boardId]
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
  },

  // credit plans domain
  creditPlans: {
    all: ['creditPlans'],
    list: (filters) => [...queryKeys.creditPlans.all, 'list', filters],
    detail: (id) => [...queryKeys.creditPlans.all, 'detail', id]
  },

  // payments domain
  payments: {
    all: ['payments'],
    checkout: () => [...queryKeys.payments.all, 'checkout']
  },

  // credit orders domain
  creditOrders: {
    all: ['creditOrders'],
    list: (filters) => [...queryKeys.creditOrders.all, 'list', filters],
    detail: (id) => [...queryKeys.creditOrders.all, 'detail', id]
  },

  // credit transactions domain
  creditTransactions: {
    all: ['creditTransactions'],
    list: (filters) => [...queryKeys.creditTransactions.all, 'list', filters],
    detail: (id) => [...queryKeys.creditTransactions.all, 'detail', id]
  },

  // invoices domain
  invoices: {
    all: ['invoices'],
    list: (filters) => [...queryKeys.invoices.all, 'list', filters],
    detail: (id) => [...queryKeys.invoices.all, 'detail', id]
  },

  // business credits domain
  businessCredits: {
    all: ['businessCredits'],
    list: (filters) => [...queryKeys.businessCredits.all, 'list', filters],
    detail: (id) => [...queryKeys.businessCredits.all, 'detail', id]
  }  
};

export default queryKeys; 