import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Hook for following/unfollowing boards
 * @param {string} boardSlug - The board slug
 * @returns {Object} - Follow operations and status
 */
export function useBoardFollow(boardSlug) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Query to check follow status
  const { data: followStatus, isLoading: isCheckingStatus } = useQuery({
    queryKey: ['board-follow-status', boardSlug],
    queryFn: async () => {
      if (!boardSlug) return { isFollowing: false };
      
      const response = await fetch(`/api/boards/${boardSlug}/follow`);
      if (!response.ok) {
        if (response.status === 404) {
          return { isFollowing: false };
        }
        throw new Error('Failed to check follow status');
      }
      return response.json();
    },
    enabled: !!boardSlug,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Mutation for following a board
  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/boards/${boardSlug}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to follow board');
      }

      return response.json();
    },
    onMutate: () => {
      setIsLoading(true);
    },
    onSuccess: (data) => {
      // Update follow status cache
      queryClient.setQueryData(['board-follow-status', boardSlug], {
        isFollowing: true,
        followedAt: new Date().toISOString()
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['board', boardSlug] });
      
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('Error following board:', error);
      setIsLoading(false);
    },
  });

  // Mutation for unfollowing a board
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/boards/${boardSlug}/follow`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unfollow board');
      }

      return response.json();
    },
    onMutate: () => {
      setIsLoading(true);
    },
    onSuccess: (data) => {
      // Update follow status cache
      queryClient.setQueryData(['board-follow-status', boardSlug], {
        isFollowing: false,
        followedAt: null
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['board', boardSlug] });
      
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('Error unfollowing board:', error);
      setIsLoading(false);
    },
  });

  const follow = () => {
    if (!isLoading && !followStatus?.isFollowing) {
      followMutation.mutate();
    }
  };

  const unfollow = () => {
    if (!isLoading && followStatus?.isFollowing) {
      unfollowMutation.mutate();
    }
  };

  const toggleFollow = () => {
    if (followStatus?.isFollowing) {
      unfollow();
    } else {
      follow();
    }
  };

  return {
    isFollowing: followStatus?.isFollowing || false,
    followedAt: followStatus?.followedAt || null,
    isLoading: isLoading || isCheckingStatus,
    follow,
    unfollow,
    toggleFollow,
    error: followMutation.error || unfollowMutation.error,
  };
}

/**
 * Hook for getting user's followed boards
 * @returns {Object} - Query result with followed boards
 */
export function useFollowedBoards() {
  return useQuery({
    queryKey: ['followed-boards'],
    queryFn: async () => {
      const response = await fetch('/api/boards?followed=true');
      if (!response.ok) {
        throw new Error('Failed to fetch followed boards');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export default useBoardFollow;
