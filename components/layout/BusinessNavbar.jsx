'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useBusinessLogin } from '@/hooks/useAuth';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';

export default function BusinessNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, status, isLoading } = useBusinessLogin();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const t = useTranslations('Navbar');

  // Check if current page is register page
  useEffect(() => {
    setIsRegister(pathname?.includes('/business/register'));
  }, [pathname]);

  // Handle business logout
  const handleBusinessLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await logout();
      if (!result.success) {
        console.error('Business logout failed:', result.error);
        // Force redirect if logout fails
        const locale = pathname.split('/')[1] || 'en';
        router.push(`/${locale}/business/login`);
      }
      // Successful logout is handled in adminLogout with redirection
    } catch (error) {
      console.error('Business logout error:', error);
      // Force redirect on error
      const locale = pathname.split('/')[1] || 'en';
      router.push(`/${locale}/business/login`);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Determine if we're in a loading state or if we're ready to show authenticated UI
  const actuallyLoading = isLoading && (!user || status === 'loading');
  const readyToShowAuth = isAuthenticated || (user && user.id) || status === 'authenticated';

  return (
    <nav className="w-full py-2 px-2 bg-[#0A1929] shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-white text-2xl font-bold flex items-center gap-2">
          <Image
            src="/slogan-removebg-preview.png"
            alt="EduSocial Business"
            width={40}
            height={40}
            style={{
              width: '40px',
              height: '40px',
            }}
          />
          <span className="text-white text-2xl font-bold">EduSocial Business</span>
        </Link>

        <div className="flex items-center space-x-4">
        {readyToShowAuth ? (
            // Regular user authenticated
            <div className="flex items-center gap-4">
              {/* Post Button */}
              <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#132F4C] transition-colors">
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
          ) : (
            // Not authenticated
            <>
              {isRegister ? (
                <Link
                  href="/business/login"
                  className="bg-[#FF7D00] text-white px-4 py-2 rounded-md hover:bg-[#FF7D00]/90 transition-colors"
                >
                  {t('login')}
                </Link>
              ) : (
                <Link
                  href="/business/register"
                  className="bg-[#FF7D00] text-white px-4 py-2 rounded-md hover:bg-[#FF7D00]/90 transition-colors"
                >
                  {t('register')}
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 