'use client';

import { Popover, Transition } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import { Fragment } from 'react';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathnameContext } from '@/app/providers';

export default function UserMenu({ onLogout }) {
  const router = useRouter();
  const pathname = usePathnameContext();
  const { data: session, status } = useSession();

  // Get the locale from the pathname
  const locale = useLocale();

  // Use next-auth session to determine authentication status
  const isAuthenticated = status === 'authenticated';

  const t = useTranslations('UserMenu');

  // Handle navigation to settings
  const handleNavigate = (href) => {
    // If already authenticated, navigate directly without callback
    if (isAuthenticated) {
      router.push(href);
    } else {
      // Only if not authenticated, redirect to login with callback
      router.push(`/${locale}/login?callbackUrl=${href}`);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    }
    await signOut({ redirect: true, callbackUrl: `/${locale}/login` });
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