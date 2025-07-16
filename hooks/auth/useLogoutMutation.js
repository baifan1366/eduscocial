'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { signOut as nextAuthSignOut } from 'next-auth/react';

/**
 * Hook for handling user logout functionality
 * @param {Object} options - Additional useMutation options
 * @returns {Object} React Query mutation result
 */
const useLogoutMutation = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Call Next-Auth signOut (without redirect)
      await nextAuthSignOut({ redirect: false });
      
      // Also call our custom logout endpoint
      return authApi.logout();
    },
    
    onSuccess: (data, variables, context) => {
      // Clear all queries from cache
      queryClient.clear();
      
      // Call custom success handler if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    
    onError: (error, variables, context) => {
      console.error('Logout error:', error);
      
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
    
    ...options
  });
};

export default useLogoutMutation; 