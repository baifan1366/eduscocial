'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import useAuth from './useAuth';
import { usePathname } from 'next/navigation';

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
    theme: 'system', // system, light, dark
    language: 'en',
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
  updateSetting: async () => ({ success: false })
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { user, status, isAuthenticated } = useAuth();
  const pathname = usePathname();

  // Get the locale from the pathname
  const locale = pathname?.split('/')[1] || 'en';

  // Fetch settings when user is authenticated
  useEffect(() => {
    const fetchSettings = async () => {
      if (!isAuthenticated) {
        setSettings(defaultSettings);
        setLoading(false);
        return;
      }

      try {
        // Use API route with locale prefix
        const response = await fetch(`/api/my/settings`);

        if (!response.ok) {
          // If unauthorized or any other error, use default settings
          console.warn(`Settings API returned ${response.status}: ${response.statusText}`);
          setSettings(defaultSettings);
          setLoading(false);
          return;
        }

        const data = await response.json();
        setSettings(data.settings || defaultSettings);
      } catch (error) {
        console.error('Error fetching settings:', error);
        // Fall back to default settings on error
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    if (status !== 'loading') {
      fetchSettings();
    }
  }, [isAuthenticated, status]);

  // Update all settings
  const updateSettings = async (newSettings) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      setLoading(true);

      // Use API route with locale prefix
      const response = await fetch(`/api/my/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: newSettings }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update settings';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If we can't parse the error response, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Parse the successful response
      const result = await response.json();

      // Update local settings only if the server confirms success
      if (result.success) {
        setSettings(newSettings);
        return { success: true };
      } else {
        throw new Error(result.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update a specific setting by path (e.g., 'preferences.theme', 'general.notifications.email')
  const updateSetting = async (path, value) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      // Create a deep copy of current settings
      const newSettings = JSON.parse(JSON.stringify(settings));

      // Split the path and update the nested property
      const keys = path.split('.');
      let current = newSettings;

      // Navigate to the nested object containing the property to update
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      // Update the property
      current[keys[keys.length - 1]] = value;

      // Save to server
      const result = await updateSettings(newSettings);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update setting');
      }

      return { success: true };
    } catch (error) {
      console.error(`Error updating setting ${path}:`, error);
      return { success: false, error: error.message };
    }
  };

  // Apply theme setting to document
  useEffect(() => {
    if (!loading && settings?.preferences?.theme) {
      const theme = settings.preferences.theme;

      if (theme === 'system') {
        // Use system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
          if (e.matches) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings?.preferences?.theme, loading]);

  const value = {
    settings,
    loading,
    updateSettings,
    updateSetting
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