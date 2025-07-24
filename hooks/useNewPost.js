'use client';

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { postsApi } from '@/lib/api';

export const useCreatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (postData) => {
            return await postsApi.create(postData);
        },
        onSuccess: (data) => {
            // Invalidate and refetch posts queries
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['my', 'posts'] });
            queryClient.invalidateQueries({ queryKey: ['recommend'] });
        },
    });
};

export const useSaveDraft = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (draftData) => {
            return await postsApi.saveDraft(draftData);
        },
        onSuccess: (data) => {
            // Invalidate drafts queries
            queryClient.invalidateQueries({ queryKey: ['drafts'] });
            queryClient.invalidateQueries({ queryKey: ['my', 'drafts'] });
        },
    });
};

export const useGetDraft = (type = 'article', options = {}) => {
    return useQuery({
        queryKey: ['drafts', 'latest', type],
        queryFn: async () => {
            try {
                // Use the API function directly which handles headers correctly
                const response = await postsApi.getDraft(type);
                return response.data;
            } catch (error) {
                console.error('Error fetching draft:', error);
                // Return null instead of throwing to avoid unnecessary error states
                return null;
            }
        },
        ...options
    });
};