'use client';

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';

// API functions for post likes
const postLikeApi = {
  // Like a post
  likePost: async (postId) => {
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to like post');
    }
    
    return response.json();
  },

  // Unlike a post
  unlikePost: async (postId) => {
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to unlike post');
    }
    
    return response.json();
  },

  // Get post like status (if we need it in the future)
  getLikeStatus: async (postId) => {
    const response = await fetch(`/api/posts/${postId}/like`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get like status');
    }
    
    return response.json();
  }
};

/**
 * Hook for liking/unliking posts
 */
export const usePostLike = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ postId, isLiked }) => {
      return isLiked ? postLikeApi.unlikePost(postId) : postLikeApi.likePost(postId);
    },
    onSuccess: (result, { postId }) => {
      // Update the post in cache with new like count
      queryClient.setQueriesData(
        { queryKey: ['posts'] },
        (oldData) => {
          if (!oldData) return oldData;
          
          // Handle different data structures
          if (oldData.posts && Array.isArray(oldData.posts)) {
            // For paginated posts data
            return {
              ...oldData,
              posts: oldData.posts.map(post => 
                post.id === postId 
                  ? { ...post, likesCount: result.likeCount, likes_count: result.likeCount }
                  : post
              )
            };
          } else if (oldData.pages) {
            // For infinite query data
            return {
              ...oldData,
              pages: oldData.pages.map(page => ({
                ...page,
                posts: page.posts?.map(post => 
                  post.id === postId 
                    ? { ...post, likesCount: result.likeCount, likes_count: result.likeCount }
                    : post
                ) || []
              }))
            };
          } else if (oldData.id === postId) {
            // For single post data
            return {
              ...oldData,
              likesCount: result.likeCount,
              likes_count: result.likeCount
            };
          }
          
          return oldData;
        }
      );
      
      // Update specific post cache
      queryClient.setQueryData(['posts', 'detail', postId], (oldData) => {
        if (oldData) {
          return {
            ...oldData,
            likesCount: result.likeCount,
            likes_count: result.likeCount
          };
        }
        return oldData;
      });
      
      // Invalidate cached counts
      queryClient.invalidateQueries({ queryKey: ['posts', 'cached-counts'] });
    },
    onError: (error) => {
      Toaster.error(error.message || 'Failed to update like');
    }
  });
};

/**
 * Hook for getting post like status (if needed)
 */
export const usePostLikeStatus = (postId) => {
  return useQuery({
    queryKey: ['posts', postId, 'like'],
    queryFn: () => postLikeApi.getLikeStatus(postId),
    enabled: !!postId,
    staleTime: 30 * 1000, // 30 seconds
  });
};
