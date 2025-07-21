'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import useAuth from '@/hooks/useAuth';
import { usePathnameContext } from '@/components/layout/ClientProviders';
import useMySettings from '@/hooks/useMySettings';

// Import our custom settings components
import GeneralSettings from '@/components/settings/GeneralSettings';
import PreferencesSettings from '@/components/settings/PreferencesSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';

export default function SettingsPanel({ activeTab = 'general' }) {
  const [activeSetting, setActiveSetting] = useState(activeTab);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathnameContext();
  const t = useTranslations('Settings');
  const { user, status, isAuthenticated } = useAuth();
  
  // Get the locale from the pathname
  const locale = pathname?.split('/')[1] || 'en';
  const baseUrl = `/${locale}`;
  
  // Update active setting when activeTab prop changes
  useEffect(() => {
    setActiveSetting(activeTab);
  }, [activeTab]);
  
  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <Card className="p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-t-[#FF7D00] border-gray-300 rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </Card>
    );
  }
  
  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return (
      <Card className="p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">{t('loginRequired')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{t('settingsTitle')}</h2>
      
      {/* Settings content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg">
        {activeSetting === 'general' && <GeneralSettings />}
        {activeSetting === 'preferences' && <PreferencesSettings />}
        {activeSetting === 'security' && <SecuritySettings />}
      </div>
    </Card>
  );
} 