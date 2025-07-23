'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { myApi } from '@/lib/api';

const useMyProfile = () => {
  const queryClient = useQueryClient();

  // Fetch profile
  const {
    data: profile,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['my', 'profile'],
    queryFn: async () => {
      const data = await myApi.profile.get();
      return data.profile;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData) => {
      return await myApi.profile.update(profileData);
    },
    onSuccess: (data) => {
      // Update the cache with the new profile data
      queryClient.setQueryData(['my', 'profile'], data.profile);
      queryClient.invalidateQueries({ queryKey: ['my', 'profile'] });
    },
  });

  return {
    profile,
    isLoading,
    error,
    refetch,
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    updateError: updateProfileMutation.error,
  };
};

export default useMyProfile;