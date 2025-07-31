'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for creating a new board (admin functionality)
 * @param {Object} options - Additional useMutation options
 * @returns {Object} React Query mutation result
 */
const useCreateCategory = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => categoryApi.create(data),
    
    onSuccess: (data, variables, context) => {
      // Invalidate boards list queries to refetch with the new board
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      
      // Call custom success handler if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    
    onError: (error, variables, context) => {
      console.error('Error creating category:', error);
      
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
    
    ...options
  });
};

export default useCreateCategory; 