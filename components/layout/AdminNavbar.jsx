'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import useAdminAuth from '@/hooks/useAdminAuth';
import { Button } from '../ui/button';
import { useTranslations } from 'next-intl';

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user: adminUser, logout: adminLogout, isAuthenticated: isAdminAuthenticated } = useAdminAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const t = useTranslations('Navbar');

  // Handle admin logout
  const handleAdminLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await adminLogout();
      if (!result.success) {
        console.error('Admin logout failed:', result.error);
        // Force redirect if logout fails
        const locale = pathname.split('/')[1] || 'en';
        router.push(`/${locale}/admin/login`);
      }
      // Successful logout is handled in adminLogout with redirection
    } catch (error) {
      console.error('Admin logout error:', error);
      // Force redirect on error
      const locale = pathname.split('/')[1] || 'en';
      router.push(`/${locale}/admin/login`);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="w-full py-2 px-2 bg-[#0A1929] shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-white text-2xl font-bold flex items-center gap-2">
          <Image
            src="/slogan-removebg-preview.png"
            alt="EduSocial Admin"
            width={40}
            height={40}
            style={{
              width: '40px',
              height: '40px',
            }}
          />
          <span className="text-white text-2xl font-bold">EduSocial Admin</span>
        </Link>

        <div className="flex items-center space-x-4">
          {isAdminAuthenticated && adminUser ? (
            <>
              <span className="text-white">
                {t('hi')} {adminUser.name || 'Admin'}
              </span>
              <Button
                variant="orange"
                onClick={handleAdminLogout}
                disabled={isLoggingOut}
                className="transition-colors disabled:opacity-50"
              >
                {isLoggingOut ? t('loggingOut') : t('logout')}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
} 