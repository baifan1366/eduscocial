'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';
import { setCookie } from 'cookies-next';

/**
 * Hook for handling admin login functionality
 * @param {Object} options - Additional useMutation options
 * @returns {Object} React Query mutation result
 */
const useAdminLoginMutation = (options = {}) => {
  const queryClient = useQueryClient();
  const isClient = typeof window !== 'undefined';
  
  return useMutation({
    mutationFn: (credentials) => authApi.adminLogin(credentials),
    
    onSuccess: (data, variables, context) => {
      // Store user data in cookie if in client environment
      if (isClient && data.user) {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || variables.email.split('@')[0] || 'Admin User',
          role: data.user.role || 'ADMIN',
          isAdmin: true
        };
        
        setCookie('adminUser', JSON.stringify(userData), {
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
      }
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      
      // Call custom success handler if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    
    onError: (error, variables, context) => {
      console.error('Admin login error:', error);
      
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
    
    ...options
  });
};

export default useAdminLoginMutation; 