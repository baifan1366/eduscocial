/**
 * Authentication hooks for React Query
 * Provides login, register, logout, and session management
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSearchParams, usePathname } from 'next/navigation';
import { api } from '../lib/api';
import { getUserSession, storeUserSession, removeUserSession } from '../lib/redis/redisUtils';

/**
 * Custom hook for user login
 * @returns {Object} Login mutation and status
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [error, setError] = useState(null);

  // 在hook初始化时检查用户是否已登录 - 只在登录页面执行
  useEffect(() => {
    // 只在登录相关页面执行自动重定向逻辑
    const isLoginPage = pathname.includes('/login') || pathname.includes('/register');
    if (!isLoginPage) {
      return;
    }

    async function checkExistingLogin() {
      try {
        // 检查是否已经存在用户id
        let userId = null;
        try {
          userId = localStorage.getItem('userId');
        } catch (e) {
          console.error('Error retrieving userId from localStorage:', e);
        }

        // 如果有userId，尝试从Redis获取会话
        if (userId) {
          const sessionData = await getUserSession(userId);
          
          // 如果Redis中有有效会话，直接重定向到home页面
          if (sessionData && sessionData.valid) {
            let locale = 'en';
            try {
              locale = pathname.split('/')[1] || 'en';
            } catch (e) {
              console.error('Error getting locale:', e);
            }
            
            // 从URL参数获取回调URL
            let callbackUrl = '';
            try {
              callbackUrl = searchParams.get('callbackUrl') || '';
            } catch (e) {
              console.error('Error parsing URL parameters:', e);
            }
            
            // 如果有回调URL则重定向到回调URL，否则重定向到home页面
            if (callbackUrl) {
              router.push(callbackUrl);
            } else {
              router.push(`/${locale}/home`);
            }
          }
        }
      } catch (error) {
        console.error('Error checking existing login:', error);
      }
    }
    
    checkExistingLogin();
  }, [pathname, router, searchParams]);

  const mutation = useMutation({
    mutationFn: async (credentials) => {
      // Reset previous errors
      setError(null);
      
      try {
        // 检查是否已经存在用户id，例如从localStorage获取
        let userId = null;
        try {
          userId = localStorage.getItem('userId');
        } catch (e) {
          console.error('Error retrieving userId from localStorage:', e);
        }

        // 如果有userId，尝试从Redis获取会话
        if (userId) {
          const sessionData = await getUserSession(userId);
          
          // 如果Redis中有有效会话，直接返回会话数据
          if (sessionData && sessionData.valid && sessionData.email === credentials.email) {
            return { user: { email: credentials.email, ...sessionData } };
          }
        }
        
        // 否则调用正常登录API
        const loginResult = await api.auth.login(credentials);
        
        // 登录成功后，将会话存储到Redis
        if (loginResult && loginResult.user) {
          // 确保只存储可序列化的数据
          const sessionInfo = {
            email: loginResult.user.email,
            role: loginResult.user.role,
            valid: true,
            loginCount: loginResult.user.loginCount || '1',
            name: loginResult.user.name || '',
            id: loginResult.user.id
          };
          
          await storeUserSession(loginResult.user.id, sessionInfo);
        }
        
        return loginResult;
      } catch (error) {
        console.error('Login process error:', error);
        setError(error.message || 'Login failed');
        throw error;
      }
    },
    onSuccess: (data) => {
      // 确保data是有效的对象
      const userData = data && typeof data === 'object' ? data : {};
      
      // Invalidate and refetch user session
      queryClient.invalidateQueries({ queryKey: ['session'] });
      
      // 如果登录成功且返回了用户ID，将其存储到localStorage
      if (userData.user) {
        try {
          // 尝试多种可能的ID字段
          const userId = userData.user.id || userData.user.userId || userData.userId || userData.id;
          if (userId) {
            localStorage.setItem('userId', userId);
            console.log('已成功将用户ID保存到localStorage:', userId);
            
            // 确保auth_token cookie也被设置 - 这是与middleware同步所必需的
            if (userData.token) {
              document.cookie = `auth_token=${userData.token}; path=/; max-age=2592000; SameSite=Lax`; // 30天过期
              console.log('已设置auth_token cookie');
            } else {
              console.warn('登录成功但未找到token，无法设置auth_token cookie');
            }
          } else {
            console.warn('登录成功但未找到用户ID，无法保存到localStorage');
          }
        } catch (e) {
          console.error('Error storing userId in localStorage:', e);
        }
      }
      
      // 从URL参数获取回调URL
      let callbackUrl = '';
      let locale = 'en';
      
      try {
        callbackUrl = searchParams.get('callbackUrl') || '';
        locale = pathname.split('/')[1] || 'en';
      } catch (e) {
        console.error('Error parsing URL parameters:', e);
      }
      
      // 如果有回调URL则重定向到回调URL，否则重定向到home页面
      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        router.push(`/${locale}/home`);
      }
    },
    onError: (error) => {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
    }
  });

  return {
    login: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    setError,
    isSuccess: mutation.isSuccess
  };
}

/**
 * Custom hook for user registration
 * @returns {Object} Registration mutation and status
 */
export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: async (userData) => {
      // Reset previous errors
      setError(null);

      try {
        // Call register API
        const result = await api.auth.register(userData);
        
        // 注册成功不再存储会话到Redis
        // 不再自动登录用户
        
        return result;
      } catch (error) {
        console.error('Registration process error:', error);
        setError(error.message || 'Registration failed');
        throw error;
      }
    },
    onSuccess: (data) => {
      // 确保data是有效的对象
      const userData = data && typeof data === 'object' ? data : {};
      
      // 注册成功后，不再进行会话查询
      // queryClient.invalidateQueries({ queryKey: ['session'] });
      
      let locale = 'en';
      try {
        locale = pathname.split('/')[1] || 'en';
      } catch (e) {
        console.error('Error getting locale:', e);
      }
      
      // 检查是否需要验证电子邮件
      if (userData.requiresEmailVerification) {
        // 提示用户检查电子邮件（将来实现）
        router.push(`/${locale}/verify-email?email=${encodeURIComponent(userData.email || '')}`);
      } else {
        // 重定向到登录页面，而不是直接进入home页面
        router.push(`/${locale}/login?registered=true`);
      }
    },
    onError: (error) => {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed');
    }
  });

  return {
    register: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    setError,
    isSuccess: mutation.isSuccess
  };
}

/**
 * Custom hook for admin login
 * @returns {Object} Admin login mutation and status
 */
export function useAdminLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: async (credentials) => {
      // Reset previous errors
      setError(null);
      
      try {
        // 检查是否已经存在用户id，例如从localStorage获取
        let userId = null;
        try {
          userId = localStorage.getItem('userId');
        } catch (e) {
          console.error('Error retrieving userId from localStorage:', e);
        }

        // 如果有userId，尝试从Redis获取会话
        if (userId) {
          const sessionData = await getUserSession(userId);
          
          // 如果Redis中有有效会话且用户是管理员，直接返回会话数据
          if (sessionData && sessionData.valid && 
              ['support', 'ads_manager', 'superadmin'].includes(sessionData.role) &&
              sessionData.email === credentials.email) {
            return { user: { email: credentials.email, ...sessionData } };
          }
        }
        
        // 否则调用正常管理员登录API
        const loginResult = await api.auth.adminLogin(credentials);
        
        // 登录成功后，将会话存储到Redis
        if (loginResult && loginResult.user) {
          // 确保只存储可序列化的数据
          const sessionInfo = {
            email: loginResult.user.email,
            role: loginResult.user.role,
            valid: true,
            loginCount: loginResult.user.loginCount || '1',
            isAdmin: true,
            name: loginResult.user.name || '',
            id: loginResult.user.id
          };
          
          await storeUserSession(loginResult.user.id, sessionInfo);
          
          // 存储用户ID到localStorage
          try {
            localStorage.setItem('userId', loginResult.user.id);
          } catch (e) {
            console.error('Error storing userId in localStorage:', e);
          }
        }
        
        return loginResult;
      } catch (error) {
        console.error('Admin login process error:', error);
        setError(error.message || 'Login failed');
        throw error;
      }
    },
    onSuccess: (data) => {
      // 确保data是有效的对象
      const userData = data && typeof data === 'object' ? data : {};
      
      // Invalidate and refetch user session
      queryClient.invalidateQueries({ queryKey: ['session'] });
      
      // 获取当前语言环境
      let locale = 'en';
      try {
        locale = pathname.split('/')[1] || 'en';
      } catch (e) {
        console.error('Error getting locale:', e);
      }
      
      // 重定向到管理员面板
      router.push(`/${locale}/admin/dashboard`);
    },
    onError: (error) => {
      console.error('Admin login error:', error);
      setError(error.message || 'Login failed');
    }
  });

  return {
    login: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    setError,
    isSuccess: mutation.isSuccess
  };
}

/**
 * Custom hook for business login
 * @returns {Object} Business login mutation and status
 */
export function useBusinessLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: async (credentials) => {
      // Reset previous errors
      setError(null);
      
      try {
        // 检查是否已经存在用户id，例如从localStorage获取
        let userId = null;
        try {
          userId = localStorage.getItem('userId');
        } catch (e) {
          console.error('Error retrieving userId from localStorage:', e);
        }

        // 如果有userId，尝试从Redis获取会话
        if (userId) {
          const sessionData = await getUserSession(userId);
          
          // 如果Redis中有有效会话且用户是商家，直接返回会话数据
          if (sessionData && sessionData.valid && 
              sessionData.role === 'business' && 
              sessionData.email === credentials.email) {
            return { user: { email: credentials.email, ...sessionData } };
          }
        }
        
        // 否则调用商家登录API
        const loginResult = await api.auth.businessLogin(credentials);
        
        // 登录成功后，将会话存储到Redis
        if (loginResult && loginResult.user) {
          // 确保只存储可序列化的数据
          const sessionInfo = {
            email: loginResult.user.email,
            role: loginResult.user.role,
            valid: true,
            loginCount: loginResult.user.loginCount || '1',
            isBusiness: true,
            name: loginResult.user.name || '',
            id: loginResult.user.id
          };
          
          await storeUserSession(loginResult.user.id, sessionInfo);
          
          // 存储用户ID到localStorage
          try {
            localStorage.setItem('userId', loginResult.user.id);
          } catch (e) {
            console.error('Error storing userId in localStorage:', e);
          }
        }
        
        return loginResult;
      } catch (error) {
        console.error('Business login process error:', error);
        setError(error.message || 'Login failed');
        throw error;
      }
    },
    onSuccess: (data) => {
      // 确保data是有效的对象
      const userData = data && typeof data === 'object' ? data : {};
      
      // Invalidate and refetch user session
      queryClient.invalidateQueries({ queryKey: ['session'] });
      
      // 获取当前语言环境
      let locale = 'en';
      try {
        locale = pathname.split('/')[1] || 'en';
      } catch (e) {
        console.error('Error getting locale:', e);
      }
      
      // 重定向到商家面板
      router.push(`/${locale}/business/dashboard`);
    },
    onError: (error) => {
      console.error('Business login error:', error);
      setError(error.message || 'Login failed');
    }
  });

  return {
    login: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    setError,
    isSuccess: mutation.isSuccess
  };
}

/**
 * Custom hook for user logout
 * @returns {Object} Logout mutation and status
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState(null);
  const { data: session } = useSession();

  const mutation = useMutation({
    mutationFn: async () => {
      // Reset previous errors
      setError(null);

      try {
        // 从localStorage中清除用户ID
        try {
          const userId = localStorage.getItem('userId');
          if (userId) {
            console.log('Logout: 清除本地用户ID:', userId);
            localStorage.removeItem('userId');
          }
        } catch (e) {
          console.error('Logout: 清除localStorage用户ID失败:', e);
        }
        
        // 清除auth_token cookie
        try {
          document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
          console.log('Logout: 已清除auth_token cookie');
        } catch (e) {
          console.error('Logout: 清除cookie失败:', e);
        }
        
        // 从Redis中移除会话
        if (session?.user?.id) {
          await removeUserSession(session.user.id);
          console.log('Logout: 已从Redis中移除会话');
        }
        
        // 根据用户角色调用不同的登出API
        let result = { success: true };
        try {
          if (session?.user?.role === 'business') {
            result = await api.auth.businessLogout();
          } else if (['support', 'ads_manager', 'superadmin'].includes(session?.user?.role)) {
            result = await api.auth.adminLogout();
          } else {
            result = await api.auth.logout();
          }
          console.log('Logout: API返回结果:', result);
        } catch (apiError) {
          console.error('Logout: API调用失败:', apiError);
          // 即使API调用失败，仍然返回成功结果，因为我们已经清除了本地存储
          result = { success: true, apiError: true };
        }
        
        return result;
      } catch (error) {
        console.error('Logout: 过程错误:', error);
        setError(error.message || 'Logout failed');
        
        // 无论如何，尝试清除本地存储
        try {
          localStorage.removeItem('userId');
        } catch (e) {
          console.error('Logout: 清除localStorage用户ID失败(错误处理中):', e);
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      // Clear session in React Query cache
      queryClient.setQueryData(['session'], { authenticated: false, user: null });
      queryClient.invalidateQueries({ queryKey: ['session'] });
      
      // 获取当前语言环境
      let locale = 'en';
      try {
        locale = pathname.split('/')[1] || 'en';
      } catch (e) {
        console.error('Logout: 获取语言环境失败:', e);
      }
      
      // Redirect based on role
      if (session?.user?.role === 'business') {
        router.push(`/${locale}/business/login`);
      } else if (['support', 'ads_manager', 'superadmin'].includes(session?.user?.role)) {
        router.push(`/${locale}/admin/login`);
      } else {
        router.push(`/${locale}/login`);
      }
    },
    onError: (error) => {
      console.error('Logout: 错误:', error);
      setError(error.message || 'Logout failed');
      
      // 即使出错，也要重定向到登录页面
      let locale = 'en';
      try {
        locale = pathname.split('/')[1] || 'en';
      } catch (e) {}
      
      router.push(`/${locale}/login`);
    }
  });

  return {
    logout: mutation.mutate,
    isLoading: mutation.isPending,
    error
  };
}

/**
 * Custom hook for email verification
 * @returns {Object} Email verification mutation and status
 */
export function useVerifyEmail() {
  const [error, setError] = useState(null);
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async ({ token }) => {
      // Reset previous errors
      setError(null);
      
      try {
        // 调用验证邮箱的API
        return await api.auth.verifyEmail(token);
      } catch (error) {
        console.error('Email verification process error:', error);
        setError(error.message || 'Verification failed');
        throw error;
      }
    },
    onSuccess: (data) => {
      // 获取当前语言环境
      let locale = 'en';
      try {
        locale = router.pathname.split('/')[1] || 'en';
      } catch (e) {
        console.error('Error getting locale:', e);
      }
      
      // 验证成功后重定向到登录页面
      router.push(`/${locale}/login?verified=true`);
    },
    onError: (error) => {
      console.error('Email verification error:', error);
      setError(error.message || 'Verification failed');
    }
  });

  return {
    verifyEmail: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    setError
  };
}

/**
 * Custom hook for resending verification email
 * @returns {Object} Resend email mutation and status
 */
export function useResendVerificationEmail() {
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: async ({ email }) => {
      // Reset previous errors
      setError(null);
      
      try {
        // 调用重新发送验证邮件的API
        return await api.auth.sendVerificationEmail(email);
      } catch (error) {
        console.error('Resend verification email process error:', error);
        setError(error.message || 'Failed to resend verification email');
        throw error;
      }
    },
    onSuccess: () => {
      // 成功发送邮件不需要重定向
    },
    onError: (error) => {
      console.error('Resend verification email error:', error);
      setError(error.message || 'Failed to resend verification email');
    }
  });

  return {
    resendEmail: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    setError
  };
}

/**
 * Custom hook for getting current user session
 * @returns {Object} Session data and status
 */
export function useSession() {
  const [status, setStatus] = useState('loading');

  // 添加检查cookie的辅助函数
  const checkAuthCookie = () => {
    if (typeof document !== 'undefined') {
      return document.cookie.split(';').some(item => item.trim().startsWith('auth_token='));
    }
    return false;
  };

  const { data, error, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        // 首先尝试从本地存储获取用户ID
        let userId = null;
        try {
          userId = localStorage.getItem('userId');
          console.log('useSession: 从localStorage获取userId:', userId);
        } catch (e) {
          console.error('useSession: 获取localStorage userId失败:', e);
        }
        
        // 如果有用户ID，尝试从Redis获取会话
        if (userId) {
          try {
            const sessionData = await getUserSession(userId);
            console.log('useSession: Redis会话数据:', sessionData);
            
            // 如果Redis中有有效会话，直接使用Redis会话数据
            if (sessionData && sessionData.valid) {
              setStatus('authenticated');
              
              // 确保会话数据是有效的对象
              const cleanSessionData = typeof sessionData === 'object' ? 
                sessionData : { email: sessionData, valid: true };
              
              return {
                authenticated: true,
                user: {
                  id: userId,
                  email: cleanSessionData.email,
                  role: cleanSessionData.role,
                  ...cleanSessionData
                }
              };
            }
          } catch (redisError) {
            console.error('useSession: 从Redis获取会话出错:', redisError);
            // 如果Redis出错，继续尝试API获取
          }
        }
        
        console.log('useSession: 从API获取当前用户');
        // 如果没有Redis会话，调用API获取当前用户
        const sessionData = await api.users.getCurrentUser();
        console.log('useSession: API返回数据:', sessionData);
        
        // 如果API返回用户数据，将其存储到Redis和localStorage
        if (sessionData?.user?.id) {
          try {
            localStorage.setItem('userId', sessionData.user.id);
            console.log('useSession: 已保存用户ID到localStorage:', sessionData.user.id);
            
            // 确保只存储可序列化的数据
            const sessionInfo = {
              email: sessionData.user.email,
              role: sessionData.user.role,
              valid: true,
              loginCount: sessionData.user.loginCount || '1',
              name: sessionData.user.name || ''
            };
            
            await storeUserSession(sessionData.user.id, sessionInfo);
          } catch (e) {
            console.error('useSession: 保存会话数据失败:', e);
          }
        } else {
          console.log('useSession: API返回无用户数据或用户未认证，状态:', sessionData);
          
          // 不要立即清除localStorage，可能只是临时的API问题
          // 只有在确认用户真的未认证时才清除
          if (sessionData && sessionData.authenticated === false) {
            try {
              localStorage.removeItem('userId');
              console.log('useSession: 已清除localStorage userId');
            } catch (e) {
              console.error('useSession: 清除userId失败:', e);
            }
          }
        }
        
        const isAuthenticated = !!sessionData?.user;
        setStatus(isAuthenticated ? 'authenticated' : 'unauthenticated');
        console.log('useSession: 最终认证状态:', isAuthenticated ? 'authenticated' : 'unauthenticated');
        
        return {
          authenticated: isAuthenticated,
          user: sessionData?.user || null
        };
      } catch (error) {
        console.error('useSession: 会话获取错误:', error);
        setStatus('error');
        
        // 不要因为网络错误就清除用户数据
        // 只记录错误，让用户可以重试
        
        return {
          authenticated: false,
          user: null
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: process.env.NODE_ENV === 'production', // Only in production
    refetchInterval: false, // 禁用自动重新获取
    refetchOnMount: true,
    refetchOnReconnect: true,
    cacheTime: 1000 * 60 * 10, // 10 minutes
    // 设置超时以避免无限加载状态
    retry: (failureCount, error) => {
      // 如果是401错误（未授权），不重试
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2; // 最多重试2次
    },
    retryDelay: 1000, // 重试间隔1秒
  });
  
  // 当查询结束时更新状态
  useEffect(() => {
    if (!isLoading) {
      if (error) {
        setStatus('error');
      } else if (data?.authenticated) {
        setStatus('authenticated');
      } else {
        setStatus('unauthenticated');
      }
    }
  }, [isLoading, data, error]);

  // Helper function to check if user is authenticated
  const isAuthenticated = data?.authenticated ?? false;

  // Helper function to check if user has specific role
  const hasRole = (role) => {
    if (!isAuthenticated || !data?.user?.role) return false;
    
    // If role is an array, check if user role is in the array
    if (Array.isArray(role)) {
      return role.includes(data.user.role);
    }
    
    // Otherwise, check if roles match
    return data.user.role === role;
  };

  // Helper function to check if user is an admin
  const isAdmin = () => {
    if (!isAuthenticated || !data?.user?.role) return false;
    return ['support', 'ads_manager', 'superadmin'].includes(data.user.role);
  };

  // Helper function to check if user is a business user
  const isBusiness = () => {
    if (!isAuthenticated || !data?.user?.role) return false;
    return data.user.role === 'business';
  };

  // Helper function to check if user is a super admin
  const isSuperAdmin = () => {
    if (!isAuthenticated || !data?.user?.role) return false;
    return data.user.role === 'superadmin';
  };

  return {
    data,
    user: data?.user || null,
    status,
    isLoading,
    error,
    isAuthenticated,
    hasRole,
    isAdmin,
    isBusiness,
    isSuperAdmin
  };
}

/**
 * Combined authentication hook
 * @returns {Object} All auth functions and user state
 */
export default function useAuth() {
  const { login } = useLogin();
  const { register } = useRegister();
  const { logout } = useLogout();
  const { verifyEmail } = useVerifyEmail();
  const { resendEmail } = useResendVerificationEmail();
  const { 
    data, 
    user, 
    status, 
    isLoading,
    isAuthenticated, 
    hasRole, 
    isAdmin, 
    isBusiness, 
    isSuperAdmin 
  } = useSession();

  return {
    login,
    register,
    logout,
    verifyEmail,
    resendEmail,
    data,
    user,
    status,
    isLoading,
    isAuthenticated,
    hasRole,
    isAdmin,
    isBusiness,
    isSuperAdmin
  };
} 