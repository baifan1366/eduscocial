'use client';

import { useQuery } from '@tanstack/react-query';
import { recommendApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for checking if a user is new for recommendation purposes
 * @param {Object} options - Additional React Query options
 * @returns {Object} React Query result with isNewUser data
 */
const useCheckNewUser = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.recommendations.all.concat(['newUserCheck']),
    queryFn: recommendApi.checkNewUser,
    // Don't cache this for long as user status may change
    staleTime: 60 * 1000, // 1 minute
    ...options
  });
};

export default useCheckNewUser; 