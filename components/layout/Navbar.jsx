'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { ChevronDown, Moon, Sun, User, Plus, Bell, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { useTranslations } from 'next-intl';
import UserMenu from './UserMenu';
import { useSession, signOut } from 'next-auth/react';
import { usePathnameContext } from '@/app/providers';

export default function Navbar() {
  const pathname = usePathnameContext();
  const { data: session, status } = useSession();
  const [isRegister, setIsRegister] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const t = useTranslations('Navbar');
  
  // Use next-auth session to determine authentication status
  const isAuthenticated = status === 'authenticated';
  
  // Check register or login page
  useEffect(() => {
    if (pathname) {
      setIsRegister(pathname.includes('/register'));
    }
  }, [pathname]);  

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: `/${pathname?.split('/')[1] || 'en'}/login` });
  };

  const toggleMode = () => {
    setDarkMode(!darkMode);
  };
  
  // Don't render menu while auth is loading
  if (status === "loading") {
    return (
      <nav className="w-full py-2 px-2 bg-[#0A1929] shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="text-white text-2xl font-bold flex items-center gap-2">
            <Image src="/slogan-removebg-preview.png" alt="EduSocial Logo" width={40} height={40}/> 
            <span className="text-white text-2xl font-bold">EduSocial</span>
          </Link>
          <div className="flex items-center">
            <span className="text-gray-400">Loading...</span>
          </div>
        </div>
      </nav>
    );
  }
  
  return (
    <nav 
      className="w-full py-2 px-2 bg-[#0A1929] shadow-md"
    >
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-white text-2xl font-bold flex items-center gap-2">
          <Image src="/slogan-removebg-preview.png" alt="EduSocial Logo" width={40} height={40}/> 
          <span className="text-white text-2xl font-bold">EduSocial</span>
        </Link>
        
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            {/* Post Button */}
            <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#132F4C] transition-colors">
              <Plus className="w-5 h-5 text-white" />
            </button>

            {/* Navigation Icons */}
            <div className="flex items-center space-x-1">
              {/* Notifications */}
              <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#132F4C] transition-colors">
                <Bell className="w-5 h-5 text-white" />
              </button>

              {/*Card Draw */}
              <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#132F4C] transition-colors">
                <div className="w-5 h-5 bg-white rounded-sm"></div>
              </button>

              {/* Messages */}
              <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#132F4C] transition-colors">
                <Mail className="w-5 h-5 text-white" />
              </button>
            </div>

            <Link 
              href={`/${pathname?.split('/')[1] || 'en'}/my`} 
              className="flex items-center justify-center"
              aria-label="My Profile"
            >
              <User className="w-6 h-6 text-white hover:text-[#FF7D00] transition-colors" />
            </Link>
            <UserMenu onLogout={handleLogout} />
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            {isRegister ? (
              <Link 
                href="/login"
                className="bg-[#FF7D00] text-white px-4 py-2 rounded-md hover:bg-[#FF7D00]/90 transition-colors"
              >
                {t('login')}
              </Link>
            ) : (
              <Link 
                href="/register"
                className="bg-[#FF7D00] text-white px-4 py-2 rounded-md hover:bg-[#FF7D00]/90 transition-colors"
              >
                {t('register')}
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, children, active }) {
  return (
    <Link 
      href={href}
      className={`pb-1 border-b-2 transition-colors hover:text-[#FF9A3C] ${active ? 'text-[#FF7D00] border-[#FF7D00]' : 'text-white border-transparent'}`}
    >
      {children}
    </Link>
  );
} 