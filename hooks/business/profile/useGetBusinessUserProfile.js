'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

//i will call like this:
//const { data: businessUserProfile } = useGetBusinessUserProfile(businessUser?.id)
const useGetBusinessUserProfile = (id, options = {}) => {
  
  return useQuery({
    queryKey: queryKeys.businessUser.profile(id),
    queryFn: () => api.businessUserApi.getBusinessProfile(id),
    enabled: !!id, // Only run if getting current user or if id is provided
    staleTime: 5 * 60 * 1000, // 5 minutes (user profiles don't change frequently)
    ...options
  });
};

export default useGetBusinessUserProfile; 