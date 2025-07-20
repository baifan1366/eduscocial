'use client';

import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for fetching user profile data
 * @param {string|number|null} id - User ID (if null, fetches current user)
 * @param {Object} options - Additional React Query options
 * @returns {Object} React Query result object with user profile data
 */
const useGetUserProfile = (id = null, options = {}) => {
  const isCurrent = id === null;
  
  return useQuery({
    queryKey: isCurrent ? queryKeys.users.current() : queryKeys.users.profile(id),
    queryFn: () => isCurrent ? usersApi.getCurrentProfile() : usersApi.getProfile(id),
    enabled: isCurrent || !!id, // Only run if getting current user or if id is provided
    staleTime: 5 * 60 * 1000, // 5 minutes (user profiles don't change frequently)
    ...options
  });
};

export default useGetUserProfile; 