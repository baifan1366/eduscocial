'use client';

import { Popover, Transition } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathnameContext } from '@/components/layout/ClientProviders';
import useAuth from '@/hooks/useAuth';

export default function UserMenu({ onLogout }) {
  const router = useRouter();
  const pathname = usePathnameContext();
  const { user, isAuthenticated, status } = useAuth();

  // Get the locale from the pathname
  const locale = useLocale();

  const t = useTranslations('UserMenu');
  
  // Debug authentication state
  useEffect(() => {
    console.log('UserMenu auth state:', { 
      isAuthenticated, 
      status,
      userId: user?.id || 'none',
      hasUser: !!user
    });
  }, [isAuthenticated, status, user]);

  // Handle navigation to settings
  const handleNavigate = (href) => {
    console.log('UserMenu navigation:', { href, isAuthenticated, hasUser: !!user });
    // If we have a user object or isAuthenticated is true, navigate directly
    if (user || isAuthenticated) {
      router.push(href);
    } else {
      // Only redirect to login if definitely not authenticated
      router.push(`/${locale}/login?callbackUrl=${href}`);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    }
  };

  // If session is loading, show loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse"></div>
        <div className="w-16 h-4 bg-gray-300 animate-pulse hidden sm:block"></div>
      </div>
    );
  }

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
            className="flex items-center gap-2 outline-none focus:outline-none"
            aria-label="User menu"
          >
            <div className="flex items-center gap-2">
              <ChevronDown
                className={`w-4 h-4 text-white transition-transform ${open ? 'transform rotate-180' : ''}`}
              />
            </div>
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute right-0 mt-2 w-80 bg-[#132F4C] shadow-md rounded-lg p-4 z-50">
              <nav className="flex flex-col space-y-1">
                <Link href="/terms-of-service" className="px-4 py-2 hover:bg-[#1E4976] text-white">{t('termsOfService')}</Link>
                <Link href="/help-center" className="px-4 py-2 hover:bg-[#1E4976] text-white">{t('helpCenter')}</Link>
                <Link href="/contact-us" className="px-4 py-2 hover:bg-[#1E4976] text-white">{t('contactUs')}</Link>
                <Link href="/careers" className="px-4 py-2 hover:bg-[#1E4976] text-white">{t('careers')}</Link>
                <Link href="/download-app" className="px-4 py-2 hover:bg-[#1E4976] text-white">{t('downloadApp')}</Link>
                <button onClick={() => handleNavigate(`/${locale}/my?settings=true&tab=general`)} className="px-4 py-2 hover:bg-[#1E4976] text-white text-left">{t('settings')}</button>
                <button onClick={handleLogout} className="px-4 py-2 hover:bg-[#1E4976] text-white text-left">{t('logout')}</button>
              </nav>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
} 