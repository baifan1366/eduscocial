'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SettingsProvider } from '@/hooks/useSettings';
import { ProfileProvider } from '@/contexts/profile-context';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/components/auth/AuthProvider';

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

export default function ClientProviders({ children }) {
  const [isClient, setIsClient] = useState(false);
  
  // Create QueryClient with optimized defaults
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors except 408, 429
          if (error?.status >= 400 && error?.status < 500 && ![408, 429].includes(error?.status)) {
            return false;
          }
          return failureCount < 3;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: (failureCount, error) => {
          // Don't retry mutations on 4xx errors
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
      },
    },
  }));
  
  // Ensure client hydration is complete before rendering
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Combined provider structure with hydration protection
  const content = (
    <QueryClientProvider client={queryClient}>
        <PathnameProvider>
          <AuthProvider>
            <SettingsProvider>
              <ProfileProvider>
                {children}
                <Toaster />
                <ReactQueryDevtools initialIsOpen={false} />
              </ProfileProvider>
            </SettingsProvider>
          </AuthProvider>
        </PathnameProvider>
    </QueryClientProvider>
  );
  
  // Handle hydration mismatch by conditional rendering
  return (
    <>
      <div suppressHydrationWarning>
        {isClient ? content : null}
      </div>
      {!isClient && (
        <div style={{ visibility: 'hidden' }}>
          {content}
        </div>
      )}
    </>
  );
} 