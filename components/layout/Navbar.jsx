'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { ChevronDown, Moon, Sun, User, Plus, Bell, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { useTranslations } from 'next-intl';
import UserMenu from './UserMenu';
import { useSession, signOut } from 'next-auth/react';
import { usePathnameContext } from '@/app/providers';
import useAuth from '../../hooks/useAuth';

export default function Navbar() {
  const pathname = usePathnameContext() || usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user, isAuthenticated: authHookAuthenticated, logout } = useAuth();
  
  // Admin-related state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [darkMode, setDarkMode] = useState(true);
  const [isRegister, setIsRegister] = useState(false);
  
  const t = useTranslations('Navbar');
  
  // Use next-auth session to determine authentication status for regular users
  const isAuthenticated = status === 'authenticated' || authHookAuthenticated;

  // Check register/login page and admin status
  useEffect(() => {
    if (pathname) {
      setIsRegister(pathname.includes('/register'));
      const isAdminPath = pathname.includes('/admin');
      setIsAdmin(isAdminPath);
      
      // Only in client environment, read admin info from local storage
      if (typeof window !== 'undefined' && isAdminPath) {
        try {
          const storedAdmin = localStorage.getItem('adminUser');
          if (storedAdmin) {
            setAdminUser(JSON.parse(storedAdmin));
          }
        } catch (error) {
          console.error('Error reading admin user from localStorage:', error);
        }
      }
    }
  }, [pathname]);

  // Handle regular user logout
  const handleUserLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ redirect: true, callbackUrl: `/${pathname?.split('/')[1] || 'en'}/login` });
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  // Handle admin logout
  const handleAdminLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Call API endpoint
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Clear admin info from local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminUser');
      }
      
      // Redirect to login page
      router.push('/admin/login');
    } catch (error) {
      console.error('Admin logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
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
          <Image 
            src="/slogan-removebg-preview.png" 
            alt="EduSocial Logo" 
            width={0} 
            height={0}
            style={{ width: 'auto', height: 'auto', maxWidth: '10%' }} 
          /> 
          <span className="text-white text-2xl font-bold">EduSocial</span>
        </Link>
    
        
        {/* User or Admin Authentication Section */}
        <div className="flex items-center space-x-4">
          {isAdmin ? (
            // Admin pages
            adminUser ? (
              <>
                <span className="text-white">
                  Hi, {adminUser.name || 'Admin'}
                </span>
                <Button
                  variant="orange" 
                  onClick={handleAdminLogout}
                  disabled={isLoggingOut}
                  className="transition-colors disabled:opacity-50"
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </Button>
              </>
            ) : null
          ) : isAuthenticated ? (
            // Regular authenticated user
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
              <UserMenu onLogout={handleUserLogout} />
            </div>
          ) : (
            // Non-authenticated user
            <>
              {!isAdmin && (
                isRegister ? (
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
                )
              )}
            </>
          )}
        </div>
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