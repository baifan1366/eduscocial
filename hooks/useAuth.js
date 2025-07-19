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
 * 安全地解析JSON字符串
 * @param {string} jsonString - 要解析的JSON字符串
 * @param {any} defaultValue - 解析失败时返回的默认值
 * @returns {any} 解析后的对象或默认值
 */
const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
  } catch (error) {
    console.error('JSON解析错误:', error);
    return defaultValue;
  }
};

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

  // 在hook初始化时检查用户是否已登录
  useEffect(() => {
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
      if (userData.user && userData.user.id) {
        try {
          localStorage.setItem('userId', userData.user.id);
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
        // 从Redis中移除会话
        if (session?.user?.id) {
          await removeUserSession(session.user.id);
          
          // 从localStorage中清除用户ID
          try {
            localStorage.removeItem('userId');
          } catch (e) {
            console.error('Error removing userId from localStorage:', e);
          }
        }
        
        // 根据用户角色调用不同的登出API
        if (session?.user?.role === 'business') {
          return await api.auth.businessLogout();
        } else if (['support', 'ads_manager', 'superadmin'].includes(session?.user?.role)) {
          return await api.auth.adminLogout();
        } else {
          return await api.auth.logout();
        }
      } catch (error) {
        console.error('Logout process error:', error);
        setError(error.message || 'Logout failed');
        throw error;
      }
    },
    onSuccess: () => {
      // Clear session in React Query cache
      queryClient.setQueryData(['session'], { authenticated: false, user: null });
      
      // 获取当前语言环境
      let locale = 'en';
      try {
        locale = pathname.split('/')[1] || 'en';
      } catch (e) {
        console.error('Error getting locale:', e);
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
      console.error('Logout error:', error);
      setError(error.message || 'Logout failed');
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

  const { data, error, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        // 从本地存储获取用户ID（假设在登录时存储了用户ID）
        let userId = null;
        try {
          userId = localStorage.getItem('userId');
        } catch (e) {
          console.error('Error retrieving userId from localStorage:', e);
        }
        
        // 如果有用户ID，尝试从Redis获取会话
        if (userId) {
          try {
            const sessionData = await getUserSession(userId);
            
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
            console.error('Error retrieving session from Redis:', redisError);
            // 如果Redis出错，继续尝试API获取
          }
        }
        
        // 如果没有Redis会话，调用API获取当前用户
        const sessionData = await api.users.getCurrentUser();
        
        // 如果API返回用户数据，将其存储到Redis和localStorage
        if (sessionData?.user?.id) {
          try {
            localStorage.setItem('userId', sessionData.user.id);
            
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
            console.error('Error storing session data:', e);
          }
        }
        
        setStatus(sessionData.user ? 'authenticated' : 'unauthenticated');
        
        return {
          authenticated: !!sessionData.user,
          user: sessionData.user
        };
      } catch (error) {
        console.error('Session error:', error);
        setStatus('error');
        
        // 清除可能无效的localStorage数据
        try {
          localStorage.removeItem('userId');
        } catch (e) {
          console.error('Error removing userId from localStorage:', e);
        }
        
        return {
          authenticated: false,
          user: null
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1, // 只重试一次
    refetchOnWindowFocus: process.env.NODE_ENV === 'production' // Only in production
  });

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
    isAuthenticated,
    hasRole,
    isAdmin,
    isBusiness,
    isSuperAdmin
  };
} 