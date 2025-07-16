'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for deleting a post with cache removal
 * @param {Object} options - Additional useMutation options
 * @returns {Object} React Query mutation result
 */
const useDeletePost = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: postsApi.delete,
    
    // When the mutation is successful, update the cache
    onSuccess: (_, postId, context) => {
      // Remove the post from the cache
      queryClient.removeQueries({
        queryKey: queryKeys.posts.detail(postId)
      });
      
      // Invalidate lists that might contain this post
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.lists()
      });
      
      // Call custom success handler if provided
      if (options.onSuccess) {
        options.onSuccess(_, postId, context);
      }
    },
    
    // Handle errors
    onError: (error, postId, context) => {
      console.error(`Error deleting post ${postId}:`, error);
      
      // Call custom error handler if provided
      if (options.onError) {
        options.onError(error, postId, context);
      }
    },
    
    // Merge remaining options
    ...options
  });
};

export default useDeletePost; 