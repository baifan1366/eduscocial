'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '@/lib/api';

/**
 * Hook to fetch all drafts for the current user
 * @param {string} type - The type of drafts to fetch ('all', 'general', 'picture', 'video', 'poll')
 * @param {object} options - Additional query options
 */
export const useGetUserDrafts = (type = 'all', options = {}) => {
  return useQuery({
    queryKey: ['drafts', type],
    queryFn: async () => {
      try {
        const response = await postsApi.getUserDrafts(type);
        return response.drafts || [];
      } catch (error) {
        console.error('Error fetching user drafts:', error);
        throw new Error(error.message || 'Failed to fetch drafts');
      }
    },
    ...options
  });
};

/**
 * Hook to fetch a specific draft by ID
 * @param {string} draftId - The ID of the draft to fetch
 * @param {object} options - Additional query options
 */
export const useGetDraftById = (draftId, options = {}) => {
  return useQuery({
    queryKey: ['drafts', 'detail', draftId],
    queryFn: async () => {
      if (!draftId) return null;
      try {
        const response = await postsApi.getDraftById(draftId);
        return response.data;
      } catch (error) {
        console.error('Error fetching draft by ID:', error);
        throw new Error(error.message || 'Failed to fetch draft');
      }
    },
    enabled: !!draftId,
    ...options
  });
};

/**
 * Hook to delete a draft
 */
export const useDeleteDraft = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (draftId) => {
      return await postsApi.deleteDraft(draftId);
    },
    onSuccess: () => {
      // Invalidate drafts queries
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
    },
    ...options
  });
}; 