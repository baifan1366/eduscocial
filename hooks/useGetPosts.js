'use client';

import { useQuery } from '@tanstack/react-query';
import { postsApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for fetching posts with pagination and filtering
 * @param {Object} params - Query parameters for filtering and pagination
 * @param {Object} options - Additional React Query options
 * @returns {Object} React Query result object with posts data
 */
const useGetPosts = (params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.posts.list(params),
    queryFn: () => postsApi.getAll(params),
    ...options
  });
};

export default useGetPosts; 