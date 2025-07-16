'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { getCookie } from 'cookies-next';
import useAdminLoginMutation from './auth/useAdminLoginMutation';
import useAdminLogoutMutation from './auth/useAdminLogoutMutation';

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
  
  // Use React Query login mutation
  const { 
    mutateAsync: loginMutation, 
    isPending: isLoginPending 
  } = useAdminLoginMutation();
  
  // Use React Query logout mutation
  const { 
    mutateAsync: logoutMutation, 
    isPending: isLogoutPending 
  } = useAdminLogoutMutation();

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
  
  // Update loading state when mutations are in progress
  useEffect(() => {
    setLoading(isSessionLoading || isLoginPending || isLogoutPending);
  }, [isSessionLoading, isLoginPending, isLogoutPending]);

  const login = async (email, password) => {
    try {
      const data = await loginMutation({ email, password });
      
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
    }
  };

  const logout = async () => {
    try {
      await logoutMutation();
      
      // 清除内存中的用户状态
      setUser(null);

      // 从pathname获取语言前缀
      const locale = pathname?.split('/')[1] || 'en';
      
      // 使用完整的URL路径，确保包含语言前缀
      router.push(`/${locale}/admin/login`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
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