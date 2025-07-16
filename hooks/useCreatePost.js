'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for creating a new post with optimistic updates
 * @param {Object} options - Additional useMutation options
 * @returns {Object} React Query mutation result
 */
const useCreatePost = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: postsApi.create,
    
    // When the mutation is successful, invalidate relevant queries
    onSuccess: (data, variables, context) => {
      // Invalidate all post lists to refetch with the new post
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
      
      // Call custom success handler if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    
    // Handle errors
    onError: (error, variables, context) => {
      console.error('Error creating post:', error);
      
      // Call custom error handler if provided
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
    
    // Merge remaining options
    ...options
  });
};

export default useCreatePost; 