import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

/**
 * Custom hook for business login
 * @returns {Object} Login mutation and status
 */
export function useBusinessLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: async (credentials) => {
      // Reset previous errors
      setError(null);
      
      try {
        // Call business login API
        return await api.auth.businessLogin(credentials);
      } catch (error) {
        setError(error.message);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch user session
      queryClient.invalidateQueries({ queryKey: ['session'] });
      
      // Redirect to business dashboard
      router.push('/business/landing');
    },
    onError: (error) => {
      console.error('Business login error:', error);
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