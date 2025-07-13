'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuth from '../../hooks/useAuth';
import { useState } from 'react';
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { ChevronDown, Moon, Sun } from 'lucide-react';
import { Button } from '../ui/button';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [darkMode, setDarkMode] = useState(true);
  
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
  };

  const toggleMode = () => {
    setDarkMode(!darkMode);
  };
  
  return (
    <nav 
      className="w-full py-4 px-6 bg-[#0A1929] shadow-md h-20"
    >
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-white text-2xl font-bold flex items-center gap-2">
          <Image src="/slogan-removebg-preview.png" alt="EduSocial Logo" width={48} height={48}/> 
          <span className="text-white text-2xl font-bold">EduSocial</span>
        </Link>
        
        <div className="hidden md:flex space-x-6">
          <NavLink href="/" active={pathname === '/'}>
            <span className="text-white">Home</span>
          </NavLink>
          <NavLink href="/explore" active={pathname === '/explore'}>
            <span className="text-white">Explore</span>
          </NavLink>
          <NavLink href="/about" active={pathname === '/about'}>
            <span className="text-white">About</span>
          </NavLink>
        </div>

        <div className="flex items-center gap-2">
          <div>
            <Button
              onClick={toggleMode}
              className="text-white px-4 py-2 rounded-md hover:text-[#FF9A3C] border-none transition-colors focus-visible:ring-0 flex items-center gap-2"
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className={`text-white px-4 py-2 rounded-md hover:text-[#FF9A3C] border-none transition-colors focus-visible:ring-0`} >
                  <span>{selectedLanguage === 'english' ? 'English' : selectedLanguage === 'malay' ? 'Bahasa Melayu' : '华文'}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem value="english" onClick={() => setSelectedLanguage('english')}>
                  <span>{selectedLanguage === 'english' ? 'English' : selectedLanguage === 'malay' ? 'Bahasa Inggeris' : '英文'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem value="malay" onClick={() => setSelectedLanguage('malay')}>
                  <span>{selectedLanguage === 'english' ? 'Malay' : selectedLanguage === 'malay' ? 'Bahasa Melayu' : '马来文'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem value="mandarin" onClick={() => setSelectedLanguage('mandarin')}>
                  <span>{selectedLanguage === 'english' ? 'Mandarin' : selectedLanguage === 'malay' ? 'Bahasa Cina' : '华文'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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