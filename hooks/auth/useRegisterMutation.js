'use client';

import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';

/**
 * Hook for handling user registration functionality
 * @param {Object} options - Additional useMutation options
 * @returns {Object} React Query mutation result
 */
const useRegisterMutation = (options = {}) => {
  return useMutation({
    mutationFn: (userData) => authApi.register(userData),
    
    onSuccess: (data, variables, context) => {
      // Call custom success handler if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    
    onError: (error, variables, context) => {
      console.error('Registration error:', error);
      
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
    
    ...options
  });
};

export default useRegisterMutation; 