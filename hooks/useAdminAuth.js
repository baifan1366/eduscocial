'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useSession, signIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// 创建一个默认值为 null 的上下文
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();
  const isSessionLoading = status === "loading";

  // 添加直接检查localStorage的逻辑，避免初始化问题
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedAdmin = localStorage.getItem('adminUser');
        if (storedAdmin) {
          const adminData = JSON.parse(storedAdmin);
          if (adminData && adminData.email) {
            setUser(adminData);
          }
        }
      } catch (error) {
        console.error('Error checking localStorage:', error);
      }
    }
  }, []);

  // 当会话加载完成时，更新本地用户状态
  useEffect(() => {
    if (!isSessionLoading && session?.user) {
      const userData = {
        ...session.user,
        name: session.user.name || session.user.email?.split('@')[0] || 'Admin User',
        isAdmin: true
      };
      setUser(userData);
      
      // 同时更新localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('adminUser', JSON.stringify(userData));
        } catch (e) {
          console.error('Failed to update admin user in storage:', e);
        }
      }
    }
    setLoading(isSessionLoading);
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
      
      // 存储到本地存储中
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('adminUser', JSON.stringify(userData));
        } catch (e) {
          console.error('Failed to store admin user:', e);
        }
      }
      
      // 2. 使用next-auth的signIn方法 - 修改为直接设置会话而不是再次调用signIn
      // 避免重定向问题，直接使用我们已经获取的用户数据更新会话
      try {
        // 3. 更新会话
        await updateSession({
          ...session,
          user: userData
        });
        
      } catch (sessionError) {
        console.error('Update session error:', sessionError);
        // 即使会话更新失败，我们仍然继续，因为API登录已成功
      }

      // 4. 刷新路由以应用新会话
      router.refresh();
      
      // 5. 强制页面完全重新加载，确保Navbar能够正确显示用户信息
      window.location.href = '/admin/dashboard';
      
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
      await nextAuthSignOut({ redirect: false });
      
      // Also call our custom logout endpoint
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include', // 添加凭证选项，确保cookies能够被发送和接收
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Logout failed');
      }
      
      // 清除本地存储的管理员用户信息
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('adminUser');
        } catch (e) {
          console.error('Failed to remove admin user from localStorage:', e);
        }
      }
      
      // 清除内存中的用户状态
      setUser(null);

      router.push('/admin/login');
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