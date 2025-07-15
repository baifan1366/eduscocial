'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import useAuth from '@/hooks/useAuth';
import useAdminAuth from '@/hooks/useAdminAuth';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { ChevronDown, Sun, Moon } from 'lucide-react';
import { Button } from '../ui/button';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user: regularUser, isAuthenticated, logout: regularLogout } = useAuth();
  const { user: adminUser, logout: adminLogout, isAuthenticated: isAdminAuthenticated } = useAdminAuth();
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [darkMode, setDarkMode] = useState(true);
  const [isRegister, setIsRegister] = useState(false);
  const t = useTranslations('Navbar');

  // 检测路径
  useEffect(() => {
    setIsRegister(pathname?.includes('/register'));
    const isAdminPath = pathname?.includes('/admin');
    setIsAdmin(isAdminPath);
  }, [pathname]);

  // 添加新的useEffect来监听认证状态变化
  useEffect(() => {
    // 当认证状态变化时，强制组件重新渲染
    console.log('authenticate changed');
    
    // 如果处于管理员路径但没有管理员认证，可以记录日志
    if (isAdmin && !isAdminAuthenticated) {
      console.log('admin path but not authenticated');
    }
  }, [isAuthenticated, isAdminAuthenticated, isAdmin]);

  // 处理普通用户登出
  const handleUserLogout = async () => {
    setIsLoggingOut(true);
    try {
      await regularLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  // 处理管理员登出
  const handleAdminLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await adminLogout();
      if (!result.success) {
        console.error('Admin logout failed:', result.error);
        // 如果登出失败，可以手动强制重定向
        const locale = pathname.split('/')[1] || 'en';
        router.push(`/${locale}/admin/login`);
      }
      // 成功登出时，adminLogout内部已经处理了重定向
    } catch (error) {
      console.error('Admin logout error:', error);
      // 发生错误时强制重定向
      const locale = pathname.split('/')[1] || 'en';
      router.push(`/${locale}/admin/login`);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleMode = () => {
    setDarkMode(!darkMode);
  };
  
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
          {isAdmin ? (
            // 管理员页面
            isAdminAuthenticated && adminUser ? (
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
            // 普通用户已登录
            <>
              <span className="text-white">
                Hi, {regularUser?.name || session?.user?.name || 'User'}
              </span>
              <Button
                variant="orange" 
                onClick={handleUserLogout}
                disabled={isLoggingOut}
                className="transition-colors disabled:opacity-50"
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </>
          ) : (
            // 未登录的普通页面
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