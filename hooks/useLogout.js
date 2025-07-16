'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for user logout functionality
 * @param {Object} options - Additional useMutation options
 * @returns {Object} React Query mutation result for logout
 */
const useLogout = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.logout,
    
    // When logout is successful
    onSuccess: (data, variables, context) => {
      // Clear all queries from cache to prevent stale data when logging in as a different user
      queryClient.clear();
      
      // Call custom success handler if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    
    // Handle logout errors
    onError: (error, variables, context) => {
      console.error('Logout error:', error);
      
      // Call custom error handler if provided
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
    
    // Merge remaining options
    ...options
  });
};

export default useLogout; 