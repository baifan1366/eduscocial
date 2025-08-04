'use client';

import { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';
import useAuth from '@/hooks/useAuth';

// Default settings
const defaultSettings = {
  general: {
    notifications: {
      email: true,
      push: true,
      mentions: true,
      comments: true,
      likes: true
    },
    visibility: {
      profile: 'public',
      activity: 'friends',
      email: 'private'
    },
    contentProtection: {
      sensitiveContent: true,
      blurImages: true,
      hideBlockedBoards: false
    },
    blockedCards: [],
    hiddenBoards: []
  },
  preferences: {
    fontSize: 'medium', // small, medium, large
    reducedMotion: false,
    highContrast: false,
    accessibility: {
      emojiStickers: true // Show suggested stickers based on emoji input
    }
  },
  security: {
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: 30, // days
    academicInfo: {
      country: '',
      school: '',
      department: '',
      verified: false,
      pendingVerification: false
    }
  }
};

// Create context with default values
const SettingsContext = createContext({
  settings: defaultSettings,
  loading: true,
  updateSettings: async () => ({ success: false }),
  updateSetting: async () => ({ success: false }),
  refetch: () => {}
});

export function SettingsProvider({ children }) {
  const { user, status } = useAuth();
  const isAuthenticated = !!user;
  const queryClient = useQueryClient();

  // Fetch settings using React Query
  const {
    data: settingsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.users.settings(),
    queryFn: async () => {
      const response = await settingsApi.get();
      return response.settings;
    },
    enabled: isAuthenticated && status !== 'loading',
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.status === 401) return false;
      return failureCount < 2;
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings) => {
      const response = await settingsApi.update(newSettings);
      return response;
    },
    onSuccess: (data, variables) => {
      // Update the cache with the new settings
      queryClient.setQueryData(queryKeys.users.settings(), variables);
      // Optionally invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.users.settings() });
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
    }
  });

  // Update single setting mutation
  const updateSingleSettingMutation = useMutation({
    mutationFn: async ({ path, value }) => {
      const response = await settingsApi.updateSetting(path, value);
      return response;
    },
    onSuccess: (data, variables) => {
      // Get current settings from cache
      const currentSettings = queryClient.getQueryData(queryKeys.users.settings()) || defaultSettings;

      // Create updated settings
      const newSettings = JSON.parse(JSON.stringify(currentSettings));
      const keys = variables.path.split('.');
      let current = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = variables.value;

      // Update cache
      queryClient.setQueryData(queryKeys.users.settings(), newSettings);
    },
    onError: (error) => {
      console.error('Error updating single setting:', error);
    }
  });

  // Get current settings (use cached data or defaults)
  const settings = settingsData || defaultSettings;
  const loading = isLoading || status === 'loading';

  // Wrapper functions for backward compatibility
  const updateSettings = async (newSettings) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      await updateSettingsMutation.mutateAsync(newSettings);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateSetting = async (path, value) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      await updateSingleSettingMutation.mutateAsync({ path, value });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    settings,
    loading,
    updateSettings,
    updateSetting,
    refetch,
    // Expose mutation states for advanced usage
    isUpdating: updateSettingsMutation.isPending || updateSingleSettingMutation.isPending,
    updateError: updateSettingsMutation.error || updateSingleSettingMutation.error
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export default function useSettings() {
  const context = useContext(SettingsContext);

  if (process.env.NODE_ENV !== 'production' && !context) {
    console.warn(
      'useSettings() was called outside of SettingsProvider. Make sure your component is wrapped in SettingsProvider.'
    );
  }

  return context;
}