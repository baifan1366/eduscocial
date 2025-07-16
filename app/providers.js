"use client";

import { createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { SettingsProvider } from '@/hooks/useSettings';
import { ProfileProvider } from '@/contexts/profile-context';
import { Toaster } from '@/components/ui/sonner';

// Create a context for pathname to avoid repeated usePathname() calls
const PathnameContext = createContext(null);

export function PathnameProvider({ children }) {
  const pathname = usePathname();
  return (
    <PathnameContext.Provider value={pathname}>
      {children}
    </PathnameContext.Provider>
  );
}

export function usePathnameContext() {
  const context = useContext(PathnameContext);
  if (context === undefined) {
    throw new Error('usePathnameContext must be used within a PathnameProvider');
  }
  return context;
}

// Safe version of usePathname that won't break SSR
export function useSafePathname() {
  if (typeof window === 'undefined') {
    return null; // Return null on server side
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePathname();
}

// Main providers component
export function Providers({ children, session }) {
  return (
    <SessionProvider session={session}>
      <PathnameProvider>
        <SettingsProvider>
          <ProfileProvider>
            {children}
            <Toaster />
          </ProfileProvider>
        </SettingsProvider>
      </PathnameProvider>
    </SessionProvider>
  );
} 