'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { myApi } from '@/lib/api';

const useMySettings = () => {
  const queryClient = useQueryClient();

  // Fetch settings
  const {
    data: settings,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['my', 'settings'],
    queryFn: async () => {
      const data = await myApi.settings.get();
      return data.settings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData) => {
      return await myApi.settings.update(settingsData);
    },
    onSuccess: (data, variables) => {
      // Update the cache with the new settings data
      queryClient.setQueryData(['my', 'settings'], variables);
      queryClient.invalidateQueries({ queryKey: ['my', 'settings'] });
    },
  });

  // Helper function to update a specific setting by path
  const updateSetting = (path, value) => {
    if (!settings) return;

    const newSettings = JSON.parse(JSON.stringify(settings));
    const keys = path.split('.');
    let current = newSettings;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    updateSettingsMutation.mutate(newSettings);
  };

  return {
    settings,
    isLoading,
    error,
    refetch,
    updateSettings: updateSettingsMutation.mutate,
    updateSetting,
    isUpdating: updateSettingsMutation.isPending,
    updateError: updateSettingsMutation.error,
  };
};

export default useMySettings;