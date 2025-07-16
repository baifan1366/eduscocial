'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for updating an existing post with cache updates
 * @param {string|number} id - The ID of the post to update
 * @param {Object} options - Additional useMutation options
 * @returns {Object} React Query mutation result
 */
const useUpdatePost = (id, options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => postsApi.update(id, data),
    
    // When the mutation is successful, update the cache
    onSuccess: (data, variables, context) => {
      // Update the specific post in the cache
      queryClient.setQueryData(
        queryKeys.posts.detail(id),
        data
      );
      
      // Invalidate list queries that might contain this post
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.lists()
      });
      
      // Call custom success handler if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    
    // Handle errors
    onError: (error, variables, context) => {
      console.error(`Error updating post ${id}:`, error);
      
      // Call custom error handler if provided
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
    
    // Merge remaining options
    ...options
  });
};

export default useUpdatePost; 