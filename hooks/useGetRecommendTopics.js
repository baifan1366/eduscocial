'use client';

import { useQuery } from '@tanstack/react-query';
import { recommendApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for fetching recommendation topics
 * @param {Object} options - Additional React Query options
 * @returns {Object} React Query result with topics data
 */
const useGetRecommendTopics = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.recommendations.topics(),
    queryFn: recommendApi.getTopics,
    ...options
  });
};

export default useGetRecommendTopics; 