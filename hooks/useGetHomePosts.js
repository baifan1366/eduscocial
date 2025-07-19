'use client';

import { useQuery } from '@tanstack/react-query';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for fetching home page recommended posts
 * @param {Object} params - Query parameters (limit, page)
 * @param {Object} options - Additional React Query options
 * @returns {Object} React Query result object with home posts data
 */
const useGetHomePosts = (params = { limit: 20 }, options = {}) => {
  return useQuery({
    queryKey: queryKeys.recommendations.home(params),
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`/api/recommend/home?${queryString}`, {
        cache: 'no-cache',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch home posts: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.posts || [];
    },
    ...options
  });
};

export default useGetHomePosts; 