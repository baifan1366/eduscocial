'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import useSettings from '@/hooks/useSettings';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function PreferencesSettings() {
  const { settings, loading, updateSetting } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations('Settings');
  const router = useRouter();
  
  // Handle theme change
  const handleThemeChange = async (value) => {
    setIsSaving(true);
    try {
      const result = await updateSetting('preferences.theme', value);
      if (result.success) {
        toast.success('Theme updated successfully');
      } else {
        toast.error(result.error || 'Failed to update theme');
      }
    } catch (error) {
      toast.error('Failed to update theme');
      console.error('Theme update error:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle language change
  const handleLanguageChange = async (value) => {
    setIsSaving(true);
    try {
      const result = await updateSetting('preferences.language', value);
      if (result.success) {
        toast.success('Language updated successfully');
        
        // Redirect to the selected language path
        const currentPath = window.location.pathname;
        const pathWithoutLocale = currentPath.substring(currentPath.indexOf('/', 1) || currentPath.length);
        router.push(`/${value}${pathWithoutLocale}`);
      } else {
        toast.error(result.error || 'Failed to update language');
      }
    } catch (error) {
      toast.error('Failed to update language');
      console.error('Language update error:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle font size change
  const handleFontSizeChange = async (value) => {
    setIsSaving(true);
    try {
      const result = await updateSetting('preferences.fontSize', value);
      if (result.success) {
        toast.success('Font size updated successfully');
        // Apply font size to document
        document.documentElement.style.fontSize = getFontSizeValue(value);
      } else {
        toast.error(result.error || 'Failed to update font size');
      }
    } catch (error) {
      toast.error('Failed to update font size');
      console.error('Font size update error:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle accessibility toggle
  const handleAccessibilityToggle = async (key, value) => {
    setIsSaving(true);
    try {
      const result = await updateSetting(`preferences.${key}`, value);
      if (result.success) {
        toast.success('Setting updated successfully');
        
        // Apply accessibility settings
        if (key === 'reducedMotion') {
          document.documentElement.classList.toggle('reduce-motion', value);
        } else if (key === 'highContrast') {
          document.documentElement.classList.toggle('high-contrast', value);
        }
      } else {
        toast.error(result.error || 'Failed to update setting');
      }
    } catch (error) {
      toast.error('Failed to update setting');
      console.error('Setting update error:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Get font size value in pixels
  const getFontSizeValue = (size) => {
    switch (size) {
      case 'small':
        return '14px';
      case 'large':
        return '18px';
      default:
        return '16px'; // medium
    }
  };
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <Card className="p-6 mb-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Appearance Section */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">{t('appearanceTitle')}</h3>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="font-medium">{t('theme')}</label>
            <select 
              className="border rounded-md p-2 bg-white dark:bg-gray-800 dark:border-gray-700"
              value={settings?.preferences?.theme || 'system'}
              onChange={(e) => handleThemeChange(e.target.value)}
              disabled={isSaving}
            >
              <option value="system">{t('systemTheme')}</option>
              <option value="light">{t('lightTheme')}</option>
              <option value="dark">{t('darkTheme')}</option>
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('themeDesc')}</p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <label className="font-medium">{t('fontSize')}</label>
            <select 
              className="border rounded-md p-2 bg-white dark:bg-gray-800 dark:border-gray-700"
              value={settings?.preferences?.fontSize || 'medium'}
              onChange={(e) => handleFontSizeChange(e.target.value)}
              disabled={isSaving}
            >
              <option value="small">{t('smallFont')}</option>
              <option value="medium">{t('mediumFont')}</option>
              <option value="large">{t('largeFont')}</option>
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('fontSizeDesc')}</p>
          </div>
        </div>
      </Card>
      
      {/* Language Section */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">{t('languageTitle')}</h3>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="font-medium">{t('language')}</label>
            <select 
              className="border rounded-md p-2 bg-white dark:bg-gray-800 dark:border-gray-700"
              value={settings?.preferences?.language || 'en'}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={isSaving}
            >
              <option value="en">{t('english')}</option>
              <option value="zh">{t('chinese')}</option>
              <option value="es">{t('spanish')}</option>
              <option value="fr">{t('french')}</option>
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('languageDesc')}</p>
          </div>
        </div>
      </Card>
      
      {/* Accessibility Section */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">{t('accessibilityTitle')}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('reducedMotion')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('reducedMotionDesc')}</p>
            </div>
            <Switch 
              checked={settings?.preferences?.reducedMotion || false}
              onCheckedChange={(checked) => handleAccessibilityToggle('reducedMotion', checked)}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('highContrast')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('highContrastDesc')}</p>
            </div>
            <Switch 
              checked={settings?.preferences?.highContrast || false}
              onCheckedChange={(checked) => handleAccessibilityToggle('highContrast', checked)}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show suggested stickers</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                The system will display appropriate stickers based on the Emoji you input
              </p>
            </div>
            <Switch 
              checked={settings?.preferences?.accessibility?.emojiStickers || true}
              onCheckedChange={(checked) => handleAccessibilityToggle('accessibility.emojiStickers', checked)}
              disabled={isSaving}
            />
          </div>
        </div>
      </Card>
    </div>
  );
} 