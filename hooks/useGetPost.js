'use client';

import { useQuery } from '@tanstack/react-query';
import { postsApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for fetching a single post by ID
 * @param {string|number} id - Post ID
 * @param {Object} options - Additional React Query options
 * @returns {Object} React Query result object with post data
 */
const useGetPost = (id, options = {}) => {
  return useQuery({
    queryKey: queryKeys.posts.detail(id),
    queryFn: () => postsApi.getById(id),
    enabled: !!id, // Only run query if id is provided
    ...options
  });
};

export default useGetPost; 