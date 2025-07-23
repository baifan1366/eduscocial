'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { myApi } from '@/lib/api';

const useMyCards = () => {
  const queryClient = useQueryClient();

  // Fetch cards
  const {
    data: cards,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['my', 'cards'],
    queryFn: async () => {
      const data = await myApi.cards.getAll();
      return data.cards;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create card mutation
  const createCardMutation = useMutation({
    mutationFn: async (cardData) => {
      return await myApi.cards.create(cardData);
    },
    onSuccess: () => {
      // Invalidate and refetch cards
      queryClient.invalidateQueries({ queryKey: ['my', 'cards'] });
    },
  });

  return {
    cards: cards || [],
    isLoading,
    error,
    refetch,
    createCard: createCardMutation.mutate,
    isCreating: createCardMutation.isPending,
    createError: createCardMutation.error,
  };
};

export default useMyCards;