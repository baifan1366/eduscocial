import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

/**
 * Custom hook for business registration
 * @returns {Object} Registration mutation and status
 */
export function useBusinessRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: async (businessData) => {
      // Reset previous errors
      setError(null);

      try {
        // Call business register API
        return await api.auth.businessRegister(businessData);
      } catch (error) {
        setError(error.message);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch user session
      queryClient.invalidateQueries({ queryKey: ['session'] });
      
      // Redirect to business dashboard or login page
      router.push('/business/landing');
    },
    onError: (error) => {
      console.error('Business registration error:', error);
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