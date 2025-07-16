'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { deleteCookie } from 'cookies-next';
import { signOut as nextAuthSignOut } from 'next-auth/react';

/**
 * Hook for handling admin logout functionality
 * @param {Object} options - Additional useMutation options
 * @returns {Object} React Query mutation result
 */
const useAdminLogoutMutation = (options = {}) => {
  const queryClient = useQueryClient();
  const isClient = typeof window !== 'undefined';
  
  return useMutation({
    mutationFn: async () => {
      // Call Next-Auth signOut (without redirect)
      await nextAuthSignOut({ 
        redirect: false,
        callbackUrl: undefined 
      });
      
      // Call custom admin logout endpoint
      return authApi.adminLogout();
    },
    
    onSuccess: (data, variables, context) => {
      // Clear admin user cookie if in client environment
      if (isClient) {
        deleteCookie('adminUser', { path: '/' });
      }
      
      // Clear all queries from cache
      queryClient.clear();
      
      // Call custom success handler if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    
    onError: (error, variables, context) => {
      console.error('Admin logout error:', error);
      
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
    
    ...options
  });
};

export default useAdminLogoutMutation; 