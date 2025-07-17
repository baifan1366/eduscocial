'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import useAuth from '@/hooks/useAuth';
import useAdminAuth from '@/hooks/useAdminAuth';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { ChevronDown, Sun, Moon, Plus, Bell, Mail, User } from 'lucide-react';
import { Button } from '../ui/button';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import UserMenu from './UserMenu';
import { Popover, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationItem from '@/components/notifications/NotificationItem';

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
  
  // Use the notifications hook
  const { notifications, unreadCount, loading, markAsRead } = useNotifications();

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

  // Create a unified logout handler for UserMenu
  const handleLogout = isAdmin ? handleAdminLogout : handleUserLogout;

  return (
    <nav className="w-full py-2 px-2 bg-[#0A1929] shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-white text-2xl font-bold flex items-center gap-2">
          <Image
            src="/slogan-removebg-preview.png"
            alt="EduSocial Logo"
            width={40}
            height={40}
            style={{
              width: '40px',
              height: '40px',
            }}
          />
          <span className="text-white text-2xl font-bold">EduSocial</span>
        </Link>

        <div className="flex items-center space-x-4">
          {isAdmin ? (
            // Admin pages
            isAdminAuthenticated && adminUser ? (
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
            ) : null
          ) : isAuthenticated ? (
            // Regular user authenticated
            <div className="flex items-center gap-4">
              {/* Post Button */}
              <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#132F4C] transition-colors">
                <Plus className="w-5 h-5 text-white" />
              </button>

              {/* Navigation Icons */}
              <div className="flex items-center space-x-1">
                {/* Notifications */}
                <Popover className="relative">
                  {({ open }) => (
                    <>
                      <Popover.Button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#132F4C] transition-colors outline-none relative">
                        <Bell className="w-5 h-5 text-white" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-[#FF7D00] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
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
                        <Popover.Panel className="absolute right-0 mt-2 w-80 bg-[#132F4C] shadow-lg rounded-lg p-4 z-50 border border-gray-600 max-h-96 overflow-y-auto">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-white">Notifications</h3>
                              {unreadCount > 0 && (
                                <button
                                  onClick={() => markAsRead([], true)}
                                  className="text-xs text-[#FF7D00] hover:text-[#FF7D00]/80 transition-colors"
                                >
                                  Mark all read
                                </button>
                              )}
                            </div>
                            
                            {loading ? (
                              <div className="text-center py-4">
                                <div className="w-6 h-6 border-2 border-t-[#FF7D00] border-gray-300 rounded-full animate-spin mx-auto"></div>
                                <p className="text-gray-400 text-sm mt-2">Loading notifications...</p>
                              </div>
                            ) : notifications.length > 0 ? (
                              <div className="space-y-2">
                                {notifications.slice(0, 5).map((notification) => (
                                  <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={markAsRead}
                                  />
                                ))}
                                {notifications.length > 5 && (
                                  <div className="text-center pt-2 border-t border-gray-600">
                                    <p className="text-gray-400 text-xs">
                                      Showing 5 of {notifications.length} notifications
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <Bell className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                <p className="text-gray-400 text-sm">No notifications yet</p>
                              </div>
                            )}
                          </div>
                        </Popover.Panel>
                      </Transition>
                    </>
                  )}
                </Popover>

                {/* Card Draw */}
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
            // Not authenticated
            <>
              {!isAuthenticated && !isAdmin && (
                <>
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
                </>
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