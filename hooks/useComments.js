'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// API functions
const commentsApi = {
  // 获取帖子的评论列表
  getPostComments: async (postId, options = {}) => {
    const params = new URLSearchParams({
      limit: options.limit || '20',
      offset: options.offset || '0',
      orderBy: options.orderBy || 'created_at',
      orderDirection: options.orderDirection || 'asc',
      ...(options.includeDeleted && { includeDeleted: 'true' })
    });
    
    const response = await fetch(`/api/posts/${postId}/comments?${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch comments');
    }
    
    return response.json();
  },
  
  // 创建新评论
  createComment: async (postId, commentData) => {
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create comment');
    }
    
    return response.json();
  },
  
  // 获取单个评论
  getComment: async (commentId) => {
    const response = await fetch(`/api/comments/${commentId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch comment');
    }
    
    return response.json();
  },
  
  // 更新评论
  updateComment: async (commentId, updateData) => {
    const response = await fetch(`/api/comments/${commentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update comment');
    }
    
    return response.json();
  },
  
  // 删除评论
  deleteComment: async (commentId) => {
    const response = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete comment');
    }
    
    return response.json();
  },
  
  // 对评论投票
  voteComment: async (commentId, voteType) => {
    const response = await fetch(`/api/comments/${commentId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vote_type: voteType }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to vote on comment');
    }
    
    return response.json();
  },
  
  // 获取评论投票状态
  getCommentVoteStatus: async (commentId) => {
    const response = await fetch(`/api/comments/${commentId}/vote`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get vote status');
    }
    
    return response.json();
  }
};

/**
 * Hook for fetching post comments
 * @param {string} postId - The post ID
 * @param {Object} options - Query options
 * @returns {Object} React Query result
 */
export const usePostComments = (postId, options = {}) => {
  return useQuery({
    queryKey: ['comments', 'post', postId, options],
    queryFn: () => commentsApi.getPostComments(postId, options),
    enabled: !!postId,
    staleTime: 30 * 1000, // 30 seconds
    ...options.queryOptions
  });
};

/**
 * Hook for fetching a single comment
 * @param {string} commentId - The comment ID
 * @param {Object} options - Query options
 * @returns {Object} React Query result
 */
export const useComment = (commentId, options = {}) => {
  return useQuery({
    queryKey: ['comments', commentId],
    queryFn: () => commentsApi.getComment(commentId),
    enabled: !!commentId,
    staleTime: 60 * 1000, // 1 minute
    ...options
  });
};

/**
 * Hook for creating comments
 * @param {string} postId - The post ID
 * @returns {Object} Mutation object
 */
export const useCreateComment = (postId) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (commentData) => commentsApi.createComment(postId, commentData),
    onSuccess: (newComment) => {
      // Invalidate and refetch comments for this post
      queryClient.invalidateQueries({ queryKey: ['comments', 'post', postId] });
      
      // Update post comments count in cache if available
      queryClient.setQueryData(['posts', postId], (oldData) => {
        if (oldData) {
          return {
            ...oldData,
            commentsCount: (oldData.commentsCount || 0) + 1
          };
        }
        return oldData;
      });
      
      toast.success('Comment posted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to post comment');
    }
  });
};

/**
 * Hook for updating comments
 * @returns {Object} Mutation object
 */
export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ commentId, updateData }) => commentsApi.updateComment(commentId, updateData),
    onSuccess: (updatedComment) => {
      // Update the specific comment in cache
      queryClient.setQueryData(['comments', updatedComment.id], updatedComment);
      
      // Invalidate post comments to refresh the list
      queryClient.invalidateQueries({ 
        queryKey: ['comments', 'post', updatedComment.post_id] 
      });
      
      toast.success('Comment updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update comment');
    }
  });
};

/**
 * Hook for deleting comments
 * @returns {Object} Mutation object
 */
export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (commentId) => commentsApi.deleteComment(commentId),
    onSuccess: (_, commentId) => {
      // Invalidate all comment-related queries
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      
      toast.success('Comment deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete comment');
    }
  });
};

/**
 * Hook for voting on comments
 * @returns {Object} Mutation object
 */
export const useVoteComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ commentId, voteType }) => commentsApi.voteComment(commentId, voteType),
    onSuccess: (result, { commentId }) => {
      // Update comment vote status in cache
      queryClient.setQueryData(['comments', commentId, 'vote'], {
        userVote: result.vote_type,
        likesCount: result.likesCount,
        dislikesCount: result.dislikesCount
      });
      
      // Invalidate comment queries to refresh vote counts
      queryClient.invalidateQueries({ queryKey: ['comments', commentId] });
      queryClient.invalidateQueries({ queryKey: ['comments', 'post'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to vote on comment');
    }
  });
};

/**
 * Hook for getting comment vote status
 * @param {string} commentId - The comment ID
 * @returns {Object} React Query result
 */
export const useCommentVoteStatus = (commentId) => {
  return useQuery({
    queryKey: ['comments', commentId, 'vote'],
    queryFn: () => commentsApi.getCommentVoteStatus(commentId),
    enabled: !!commentId,
    staleTime: 30 * 1000, // 30 seconds
  });
};
