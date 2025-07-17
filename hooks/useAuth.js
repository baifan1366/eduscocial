'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useLoginMutation from './auth/useLoginMutation';
import useLogoutMutation from './auth/useLogoutMutation';
import useRegisterMutation from './auth/useRegisterMutation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();
  const isSessionLoading = status === "loading";

  // Use React Query login mutation
  const { 
    mutateAsync: loginMutation, 
    isPending: isLoginPending 
  } = useLoginMutation();
  
  // Use React Query logout mutation
  const { 
    mutateAsync: logoutMutation, 
    isPending: isLogoutPending 
  } = useLogoutMutation({
    onSuccess: () => {
      router.push('/login');
    }
  });
  
  // Use React Query register mutation
  const { 
    mutateAsync: registerMutation, 
    isPending: isRegisterPending 
  } = useRegisterMutation();
  
  useEffect(() => {
    // We can rely on NextAuth session loading
    setLoading(isSessionLoading || isLoginPending || isLogoutPending || isRegisterPending);
  }, [isSessionLoading, isLoginPending, isLogoutPending, isRegisterPending]);

  const login = async (email, password) => {
    try {
      // 调用自定义登录API
      const data = await loginMutation({ email, password });
      console.log('Login mutation result:', data);
      
      // 确保用户有完整的信息
      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || email.split('@')[0] || 'User',
        role: data.user.role || 'USER',
      };
      
      // 使用 NextAuth signIn 方法登录
      try {
        console.log('Signing in with NextAuth...');
        // 导入 signIn 函数
        const { signIn } = await import("next-auth/react");
        
        // 执行登录，设置redirect: false确保不会自动重定向
        const result = await signIn('credentials', { 
          redirect: false,
          email: email,
          password: password
        });
        
        console.log('NextAuth sign in result:', result);
        
        if (result?.error) {
          console.error('NextAuth sign in error:', result.error);
          return { success: false, error: result.error || 'Authentication failed' };
        }
      } catch (nextAuthError) {
        console.error('NextAuth sign in error:', nextAuthError);
        // 继续，因为我们的自定义API登录已经成功
      }
      
      // 更新next-auth会话
      try {
        console.log('Updating session with user data:', userData);
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            ...userData,
            isSignedIn: true
          }
        });
        console.log('Session updated successfully');
      } catch (sessionError) {
        console.error('Update session error:', sessionError);
      }

      // 强制刷新路由状态和页面
      router.refresh();
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login failed with error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await logoutMutation();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Logout failed' };
    }
  };

  const register = async (userData) => {
    try {
      const result = await registerMutation(userData);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const value = {
    user: session?.user || null,
    loading,
    login,
    logout,
    register,
    session
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default function useAuth() {
  return useContext(AuthContext);
} 