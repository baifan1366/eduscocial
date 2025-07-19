'use client';

import useAuth from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePathnameContext } from '@/app/providers';
import MySidebar from '@/components/my/MySidebar';
import MyWrapper from '@/components/my/MyWrapper';
import { ProfileProvider } from '@/contexts/profile-context';
import { SettingsProvider } from '@/hooks/useSettings';
import { useLocale } from 'next-intl';

export default function MyLayout({ children }) {
  const { user, status, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathnameContext();

  // Get the locale from the pathname
  const locale = useLocale();

  // Protect this route - redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/login?callbackUrl=/${locale}/my`);
    }
  }, [status, router, locale]);

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="w-10 h-10 border-4 border-t-[#FF7D00] border-gray-300 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show content only if authenticated
  if (status !== 'authenticated') {
    return null;
  }

  return (
    <ProfileProvider>
      <SettingsProvider>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Sidebar with user navigation */}
            <div className="md:col-span-1">
              <MySidebar />
            </div>

            {/* Main content area */}
            <div className="md:col-span-2">
              <MyWrapper>
                {children}
              </MyWrapper>
            </div>
          </div>
        </div>
      </SettingsProvider>
    </ProfileProvider>
  );
} 