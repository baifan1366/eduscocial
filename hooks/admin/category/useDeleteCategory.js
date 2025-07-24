'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for deleting a category
 * @param {Object} options - Additional useMutation options
 * @returns {Object} React Query mutation result
 */
const useDeleteCategory = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => categoryApi.delete(id),
    
    onSuccess: (data, categoryId, context) => {
      // Invalidate categories list queries to refetch without the deleted category
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      
      // Call custom success handler if provided
      if (options.onSuccess) {
        options.onSuccess(data, categoryId, context);
      }
    },
    
    onError: (error, categoryId, context) => {
      console.error(`Error deleting category ${categoryId}:`, error);
      
      if (options.onError) {
        options.onError(error, categoryId, context);
      }
    },
    
    ...options
  });
};

export default useDeleteCategory; 