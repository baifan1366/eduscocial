'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for updating user interests (topics and tags)
 * @param {Object} options - Additional useMutation options
 * @returns {Object} React Query mutation result
 */
const useUpdateUserInterests = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (interests) => recommendApi.updateInterests(interests),
    
    onSuccess: (data, variables, context) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.recommendations.interests() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recommendations.home() });
      
      // Call custom success handler if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    
    onError: (error, variables, context) => {
      console.error('Error updating user interests:', error);
      
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
    
    ...options
  });
};

export default useUpdateUserInterests; 