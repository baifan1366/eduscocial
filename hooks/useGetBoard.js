import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch a single board by ID or slug
 * @param {string} boardSlug - Board ID or slug
 * @param {Object} options - Query options
 * @returns {Object} Query result with board data
 */
export default function useGetBoard(boardSlug, options = {}) {
  const { enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: ['board', boardSlug],
    queryFn: async () => {
      if (!boardSlug) {
        throw new Error('Board slug is required');
      }

      const response = await fetch(`/api/boards/${boardSlug}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch board');
      }
      
      return response.json();
    },
    enabled: enabled && !!boardSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error.message?.includes('not found')) {
        return false;
      }
      return failureCount < 3;
    },
    ...queryOptions,
  });
}
