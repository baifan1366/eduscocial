'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useSession, signIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';

// 创建一个默认值为 null 的上下文，并导出它以便其他组件直接使用
export const AuthContext = createContext(null);

// 检查是否在客户端环境
const isClient = typeof window !== 'undefined';

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status, update: updateSession } = useSession();
  const isSessionLoading = status === "loading";

  // 从会话获取用户信息，而不是localStorage
  useEffect(() => {
    if (!isSessionLoading) {
      if (session?.user) {
        const userData = {
          ...session.user,
          name: session.user.name || session.user.email?.split('@')[0] || 'Admin User',
          isAdmin: session.user.role === 'ADMIN'
        };
        setUser(userData);
      } else {
        // 检查是否有cookie作为回退机制 - 确保只在客户端执行
        try {
          // 只在客户端检查cookie
          if (isClient) {
            const adminCookie = getCookie('adminUser');
            if (adminCookie) {
              const adminData = JSON.parse(adminCookie);
              if (adminData && adminData.email) {
                setUser(adminData);
              }
            }
          }
        } catch (error) {
          console.error('Error checking admin cookie:', error);
        }
      }
      setLoading(false);
    }
  }, [isSessionLoading, session]);

  const login = async (email, password) => {
    setLoading(true);
    try {      
      // 1. 首先使用我们的API进行管理员验证
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // 添加凭证选项，确保cookies能够被发送和接收
        cache: 'no-store',
        mode: 'cors'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(e => ({ error: 'cannot parse response data' }));
        console.error('API login failed:', errorData);
        throw new Error(errorData.error || `Login failed (${response.status})`);
      }
      
      const data = await response.json();
      
      // 确保用户有完整的信息
      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || email.split('@')[0] || 'Admin User',
        role: data.user.role || 'ADMIN',
        isAdmin: true
      };
            
      // 更新本地用户状态
      setUser(userData);
      
      // 使用cookie而不是localStorage - 确保只在客户端执行
      try {
        if (isClient) {
          setCookie('adminUser', JSON.stringify(userData), {
            maxAge: 60 * 60 * 24 * 7, // 一周
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });
        }
      } catch (e) {
        console.error('Failed to store admin user in cookie:', e);
      }
      
      // 更新next-auth会话
      try {
        await updateSession({
          ...session,
          user: userData
        });
      } catch (sessionError) {
        console.error('Update session error:', sessionError);
        // 即使会话更新失败，我们仍然继续，因为API登录已成功
      }

      // 强制刷新路由状态和页面
      router.refresh();
      
      // 确保用户状态在组件中更新
      setTimeout(() => {
        if (!user || user.id !== userData.id) {
          setUser({...userData}); // 强制触发状态更新
        }
      }, 50);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: error.message || 'Login failed, please try again later' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // 确保nextAuthSignOut不自动重定向
      await nextAuthSignOut({ 
        redirect: false,
        callbackUrl: undefined // 移除默认的回调URL
      });
      
      // 调用自定义登出端点
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Logout failed');
      }
      
      // 清除cookie - 确保只在客户端执行
      try {
        if (isClient) {
          deleteCookie('adminUser', { path: '/' });
        }
      } catch (e) {
        console.error('Failed to remove admin user cookie:', e);
      }
      
      // 清除内存中的用户状态
      setUser(null);

      // 从pathname获取语言前缀
      const locale = pathname?.split('/')[1] || 'en';
      
      // 使用完整的URL路径，确保包含语言前缀
      router.push(`/${locale}/admin/login`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading: loading || isSessionLoading,
    login,
    logout,
    isAuthenticated: !!user,
    session
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 确保 useAdminAuth hook 在使用前检查 context 是否存在
export default function useAdminAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    console.error('useAdminAuth must be used within an AuthProvider');
    // 返回一个空对象而不是抛出错误，使组件能够优雅地处理缺失的上下文
    return {
      user: null,
      loading: false,
      login: () => Promise.resolve({ success: false, error: 'No AuthProvider found' }),
      logout: () => Promise.resolve({ success: false, error: 'No AuthProvider found' }),
      isAuthenticated: false,
      session: null
    };
  }
  return context;
} 