'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuth from '../../hooks/useAuth';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
  };
  
  return (
    <nav 
      className="w-full py-4 px-6 bg-[#0A1929] shadow-md"
    >
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-white text-2xl font-bold">
          EduSocial
        </Link>
        
        <div className="hidden md:flex space-x-6">
          <NavLink href="/" active={pathname === '/'}>
            Home
          </NavLink>
          <NavLink href="/explore" active={pathname === '/explore'}>
            Explore
          </NavLink>
          <NavLink href="/about" active={pathname === '/about'}>
            About
          </NavLink>
        </div>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="text-white">
                Hi, {user?.name || 'User'}
              </span>
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="border border-[#FF7D00] text-white px-4 py-2 rounded-md hover:bg-[#FF7D00]/10 transition-colors disabled:opacity-50"
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/login"
                className="border border-[#FF7D00] text-white px-4 py-2 rounded-md hover:bg-[#FF7D00]/10 transition-colors"
              >
                Login
              </Link>
              <Link 
                href="/register"
                className="bg-[#FF7D00] text-white px-4 py-2 rounded-md hover:bg-[#FF7D00]/90 transition-colors"
              >
                Register
              </Link>
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