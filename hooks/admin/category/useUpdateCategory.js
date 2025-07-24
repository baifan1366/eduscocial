'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for updating an existing category
 * @param {Object} options - Additional useMutation options
 * @returns {Object} React Query mutation result
 */
const useUpdateCategory = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => categoryApi.update(id, data),
    
    onSuccess: (data, variables, context) => {
      // Invalidate categories list queries to refetch with the updated category
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      
      // Call custom success handler if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    
    onError: (error, variables, context) => {
      console.error('Error updating category:', error);
      
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
    
    ...options
  });
};

export default useUpdateCategory; 