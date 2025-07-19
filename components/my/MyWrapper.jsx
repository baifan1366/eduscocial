'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SettingsPanel from './SettingsPanel';
import useAuth from '@/hooks/useAuth';
import { getQueryParams } from '@/lib/utils';
import { usePathnameContext } from '@/app/providers';

export default function MyWrapper({ children }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathnameContext();
  const { user, status, isAuthenticated } = useAuth();
  
  // Get the locale from the pathname
  const locale = pathname?.split('/')[1] || 'en';
  const baseUrl = `/${locale}`;
  
  // Use the utility function to get query parameters
  const { showSettings, activeTab } = getQueryParams(searchParams);
  const [settingsVisible, setSettingsVisible] = useState(showSettings);
  const [currentTab, setCurrentTab] = useState(activeTab);
  
  // Update state when URL parameters change
  useEffect(() => {
    const { showSettings, activeTab } = getQueryParams(searchParams);
    setSettingsVisible(showSettings);
    setCurrentTab(activeTab);
  }, [searchParams]);
  
  // Show loading state while checking authentication
  if (status === "loading" && settingsVisible) {
    return (
      <div className="flex items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-t-[#FF7D00] border-gray-300 rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }
  
  // Render the appropriate component based on the showSettings state
  return (
    <div className="w-full h-full">
      {settingsVisible && isAuthenticated ? (
        <SettingsPanel activeTab={currentTab} />
      ) : (
        children
      )}
    </div>
  );
} 