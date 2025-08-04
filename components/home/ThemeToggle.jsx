'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import useSettings from '@/hooks/useSettings';
import useThemeSync from '@/hooks/useThemeSync';
import useAuth from '@/hooks/useAuth';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, isLoading } = useThemeSync();
  const { updateSetting } = useSettings();
  const { user, isLoading: authLoading } = useAuth();

  // Only show theme toggle for authenticated users
  const isAuthenticated = !!user;

  // Ensure component is mounted before rendering to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle theme change and sync with user preferences
  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);

    // Only update user preferences in database if user is authenticated
    if (isAuthenticated && user?.id) {
      try {
        console.log('Updating theme preference for user:', user.id, 'to:', newTheme);
        await updateSetting('preferences.theme', newTheme);
      } catch (error) {
        console.error('Failed to update theme preference:', error);
      }
    } else {
      console.log('User not authenticated, theme change not saved to database');
    }
  };

  // Don't render anything if user is not authenticated
  if (!isAuthenticated || authLoading) {
    return null;
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
        <Palette className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const getThemeIcon = (currentTheme) => {
    switch (currentTheme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Palette className="h-4 w-4" />;
    }
  };

  const getThemeLabel = (themeValue) => {
    switch (themeValue) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'Theme';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-9 h-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {getThemeIcon(theme)}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        <DropdownMenuItem 
          onClick={() => handleThemeChange('light')}
          className="cursor-pointer flex items-center gap-2"
        >
          <Sun className="h-4 w-4" />
          <span>{getThemeLabel('light')}</span>
          {theme === 'light' && (
            <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange('dark')}
          className="cursor-pointer flex items-center gap-2"
        >
          <Moon className="h-4 w-4" />
          <span>{getThemeLabel('dark')}</span>
          {theme === 'dark' && (
            <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange('system')}
          className="cursor-pointer flex items-center gap-2"
        >
          <Monitor className="h-4 w-4" />
          <span>{getThemeLabel('system')}</span>
          {theme === 'system' && (
            <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
