'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for user login functionality
 * @param {Object} options - Additional useMutation options
 * @returns {Object} React Query mutation result for login
 */
const useLogin = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.login,
    
    // When login is successful
    onSuccess: (data, variables, context) => {
      // Invalidate current user data to force refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.users.current() });
      
      // Invalidate auth session data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      
      // Call custom success handler if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    
    // Handle login errors
    onError: (error, variables, context) => {
      console.error('Login error:', error);
      
      // Call custom error handler if provided
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
    
    // Merge remaining options
    ...options
  });
};

export default useLogin; 