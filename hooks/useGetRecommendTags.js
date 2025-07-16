'use client';

import { useQuery } from '@tanstack/react-query';
import { recommendApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for fetching recommendation tags
 * @param {Object} params - Query parameters like limit
 * @param {Object} options - Additional React Query options
 * @returns {Object} React Query result with tags data
 */
const useGetRecommendTags = (params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.recommendations.tags(),
    queryFn: () => recommendApi.getTags(params),
    ...options
  });
};

export default useGetRecommendTags; 