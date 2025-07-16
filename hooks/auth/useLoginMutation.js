'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for handling user login functionality
 * @param {Object} options - Additional useMutation options
 * @returns {Object} React Query mutation result
 */
const useLoginMutation = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (credentials) => authApi.login(credentials),
    
    onSuccess: (data, variables, context) => {
      // Invalidate user-related queries to force refresh
      queryClient.invalidateQueries({ queryKey: queryKeys.users.current() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      
      // Call custom success handler if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    
    onError: (error, variables, context) => {
      console.error('Login error:', error);
      
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
    
    ...options
  });
};

export default useLoginMutation; 