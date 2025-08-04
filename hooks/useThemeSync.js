'use client';

import { useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import useAuth from '@/hooks/useAuth';
import { settingsApi } from '@/lib/api';

/**
 * Hook to synchronize next-themes with user theme preference from database
 * This ensures theme preference is loaded from the theme column and persisted
 */
export default function useThemeSync() {
  const { theme, setTheme } = useTheme();
  const { user, isLoading: authLoading } = useAuth();

  // Fetch user theme directly from the theme column
  const {
    data: userTheme,
    isLoading: themeLoading,
    error: themeError
  } = useQuery({
    queryKey: ['user', 'theme'],
    queryFn: async () => {
      const response = await fetch('/api/users/theme');
      if (!response.ok) {
        throw new Error('Failed to fetch theme');
      }
      const data = await response.json();
      return data.theme;
    },
    enabled: !!user?.id && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.status === 401) return false;
      return failureCount < 2;
    }
  });

  // Initialize theme from user theme column when loaded
  useEffect(() => {
    // Only sync theme if user is authenticated and theme is loaded
    if (!themeLoading && !authLoading && user?.id && userTheme) {
      // Only set theme if it's different from current theme to avoid unnecessary updates
      if (userTheme !== theme) {
        console.log('Syncing theme from database theme column:', userTheme);
        setTheme(userTheme);
      }
    } else if (!authLoading && !user?.id) {
      // If user is not authenticated, use system theme as default
      if (theme !== 'system') {
        console.log('User not authenticated, setting system theme');
        setTheme('system');
      }
    }
  }, [userTheme, themeLoading, authLoading, user?.id, theme, setTheme]);

  // Function to update theme and persist to backend
  const updateTheme = useCallback(async (newTheme) => {
    if (!user?.id) {
      console.warn('Cannot update theme: user not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Update theme in next-themes immediately for UI responsiveness
      setTheme(newTheme);

      // Persist to backend using the specialized theme update API
      // This will only update the theme column, not settings
      const result = await settingsApi.updateTheme(newTheme);

      if (result.success) {
        console.log('Theme updated successfully in theme column:', newTheme);
      } else {
        console.error('Failed to persist theme to backend:', result.error);
        // Revert theme if backend update failed
        if (userTheme) {
          setTheme(userTheme);
        }
      }

      return result;
    } catch (error) {
      console.error('Error updating theme:', error);
      // Revert theme on error
      if (userTheme) {
        setTheme(userTheme);
      }
      return { success: false, error: error.message };
    }
  }, [user?.id, setTheme, userTheme]);

  return {
    theme,
    setTheme: updateTheme, // Use our enhanced setTheme that persists to backend
    isLoading: themeLoading || authLoading,
    // Also expose the original setTheme for cases where backend sync is not needed
    setThemeLocal: setTheme,
    // Expose the current user theme from database
    userTheme
  };
}
