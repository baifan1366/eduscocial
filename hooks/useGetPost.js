'use client';

import { useQuery } from '@tanstack/react-query';
import { postsApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for fetching a single post by ID or slug
 * @param {string|number} idOrSlug - Post ID or slug
 * @param {Object} options - Additional React Query options
 * @returns {Object} React Query result object with post data
 */
const useGetPost = (idOrSlug, options = {}) => {
  return useQuery({
    queryKey: queryKeys.posts.detail(idOrSlug),
    queryFn: () => postsApi.getById(idOrSlug),
    enabled: !!idOrSlug, // Only run query if id or slug is provided
    ...options
  });
};

export default useGetPost; 