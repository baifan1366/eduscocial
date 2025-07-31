import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// API functions
const fetchReactions = async (type, targetId) => {
  const endpoint = type === 'post' 
    ? `/api/posts/${targetId}/reactions`
    : `/api/comments/${targetId}/reactions`;
    
  const response = await fetch(endpoint);
  
  if (!response.ok) {
    throw new Error('Failed to fetch reactions');
  }
  
  return response.json();
};

const updateReaction = async (type, targetId, emoji, action) => {
  const endpoint = type === 'post' 
    ? `/api/posts/${targetId}/reactions`
    : `/api/comments/${targetId}/reactions`;
    
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ emoji, action }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update reaction');
  }
  
  return response.json();
};

// Hook to fetch reactions
export const useReactions = (type, targetId) => {
  return useQuery({
    queryKey: ['reactions', type, targetId],
    queryFn: () => fetchReactions(type, targetId),
    staleTime: 30 * 1000, // 30 seconds
    enabled: !!targetId
  });
};

// Hook to update reactions
export const useUpdateReaction = (type, targetId) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ emoji, action }) => updateReaction(type, targetId, emoji, action),
    onSuccess: (data) => {
      // Update the reactions cache
      queryClient.setQueryData(['reactions', type, targetId], data);
      
      // Invalidate related queries to refresh counts
      queryClient.invalidateQueries({ 
        queryKey: ['reactions', type, targetId] 
      });
      
      // Also invalidate the parent post/comment to update counts
      if (type === 'post') {
        queryClient.invalidateQueries({ queryKey: ['posts', targetId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['comments'] });
      }
    },
    onError: (error) => {
      toast.error(error.message || '操作失败，请重试');
    }
  });
};
