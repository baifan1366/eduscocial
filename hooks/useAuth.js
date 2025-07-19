/**
 * Authentication hooks for React Query
 * Provides login, register, logout, and session management
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';

/**
 * Custom hook for user login
 * @returns {Object} Login mutation and status
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: async (credentials) => {
      // Reset previous errors
      setError(null);
      
      try {
        // Call login API
        return await api.auth.login(credentials);
      } catch (error) {
        setError(error.message);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch user session
      queryClient.invalidateQueries({ queryKey: ['session'] });
      
      // Redirect to dashboard or home page
      router.push('/');
    },
    onError: (error) => {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
    }
  });

  return {
    login: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    setError,
    isSuccess: mutation.isSuccess
  };
}

/**
 * Custom hook for user registration
 * @returns {Object} Registration mutation and status
 */
export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: async (userData) => {
      // Reset previous errors
      setError(null);

      try {
        // Call register API
        return await api.auth.register(userData);
      } catch (error) {
        setError(error.message);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch user session
      queryClient.invalidateQueries({ queryKey: ['session'] });
      
      // Redirect to dashboard or home page
      router.push('/');
    },
    onError: (error) => {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed');
    }
  });

  return {
    register: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    setError,
    isSuccess: mutation.isSuccess
  };
}

/**
 * Custom hook for admin login
 * @returns {Object} Admin login mutation and status
 */
export function useAdminLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: async (credentials) => {
      // Reset previous errors
      setError(null);
      
      try {
        // Call admin login API
        return await api.auth.adminLogin(credentials);
      } catch (error) {
        setError(error.message);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch user session
      queryClient.invalidateQueries({ queryKey: ['session'] });
      
      // Redirect to admin dashboard
      router.push('/admin/dashboard');
    },
    onError: (error) => {
      console.error('Admin login error:', error);
      setError(error.message || 'Login failed');
    }
  });

  return {
    login: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    setError,
    isSuccess: mutation.isSuccess
  };
}

/**
 * Custom hook for user logout
 * @returns {Object} Logout mutation and status
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [error, setError] = useState(null);
  const { data: session } = useSession();

  const mutation = useMutation({
    mutationFn: async () => {
      // Reset previous errors
      setError(null);

      try {
        // Call the appropriate logout API based on user role
        if (session?.user?.role === 'business') {
          return await api.auth.businessLogout();
        } else if (['support', 'ads_manager', 'superadmin'].includes(session?.user?.role)) {
          return await api.auth.adminLogout();
        } else {
          return await api.auth.logout();
        }
      } catch (error) {
        setError(error.message);
        throw error;
      }
    },
    onSuccess: () => {
      // Clear session in React Query cache
      queryClient.setQueryData(['session'], { authenticated: false, user: null });
      
      // Redirect based on role
      if (session?.user?.role === 'business') {
        router.push('/business/login');
      } else if (['support', 'ads_manager', 'superadmin'].includes(session?.user?.role)) {
        router.push('/admin/login');
      } else {
        router.push('/login');
      }
    },
    onError: (error) => {
      console.error('Logout error:', error);
      setError(error.message || 'Logout failed');
    }
  });

  return {
    logout: mutation.mutate,
    isLoading: mutation.isPending,
    error
  };
}

/**
 * Custom hook for getting current user session
 * @returns {Object} Session data and status
 */
export function useSession() {
  const [status, setStatus] = useState('loading');

  const { data, error, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/users/current', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          if (response.status === 401) {
            setStatus('unauthenticated');
            return { authenticated: false };
          }
          throw new Error('Failed to fetch session');
        }

        const sessionData = await response.json();
        setStatus(sessionData.user ? 'authenticated' : 'unauthenticated');
        
        return {
          authenticated: !!sessionData.user,
          user: sessionData.user
        };
      } catch (error) {
        console.error('Session error:', error);
        setStatus('error');
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Don't retry on 401 (unauthenticated)
    refetchOnWindowFocus: process.env.NODE_ENV === 'production' // Only in production
  });

  // Helper function to check if user is authenticated
  const isAuthenticated = data?.authenticated ?? false;

  // Helper function to check if user has specific role
  const hasRole = (role) => {
    if (!isAuthenticated || !data?.user?.role) return false;
    
    // If role is an array, check if user role is in the array
    if (Array.isArray(role)) {
      return role.includes(data.user.role);
    }
    
    // Otherwise, check if roles match
    return data.user.role === role;
  };

  // Helper function to check if user is an admin
  const isAdmin = () => {
    if (!isAuthenticated || !data?.user?.role) return false;
    return ['support', 'ads_manager', 'superadmin'].includes(data.user.role);
  };

  // Helper function to check if user is a business user
  const isBusiness = () => {
    if (!isAuthenticated || !data?.user?.role) return false;
    return data.user.role === 'business';
  };

  // Helper function to check if user is a super admin
  const isSuperAdmin = () => {
    if (!isAuthenticated || !data?.user?.role) return false;
    return data.user.role === 'superadmin';
  };

  return {
    data,
    user: data?.user || null,
    status,
    isLoading,
    error,
    isAuthenticated,
    hasRole,
    isAdmin,
    isBusiness,
    isSuperAdmin
  };
}

/**
 * Combined authentication hook
 * @returns {Object} All auth functions and user state
 */
export default function useAuth() {
  const { login } = useLogin();
  const { register } = useRegister();
  const { logout } = useLogout();
  const { 
    data, 
    user, 
    status, 
    isAuthenticated, 
    hasRole, 
    isAdmin, 
    isBusiness, 
    isSuperAdmin 
  } = useSession();

  return {
    login,
    register,
    logout,
    data,
    user,
    status,
    isAuthenticated,
    hasRole,
    isAdmin,
    isBusiness,
    isSuperAdmin
  };
} 