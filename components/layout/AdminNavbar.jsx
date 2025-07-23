'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLogout, useSession } from '@/hooks/useAuth';
import { Button } from '../ui/button';
import { useTranslations } from 'next-intl';

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, status, isLoading } = useSession();
  const { logout } = useLogout();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const t = useTranslations('Navbar');
  const isLoginPage = pathname.includes('/admin/login');

  // Handle admin logout
  const handleAdminLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // 登出成功后直接从 useLogout 中处理重定向
    } catch (error) {
      console.error('Admin logout error:', error);
      // 出错时强制重定向
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
          {!isLoginPage && user ? (
            <>
              <span className="text-white">
                {t('hi')} {user.name || 'Admin'}
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