'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
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