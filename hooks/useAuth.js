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
  const { data: session, status } = useSession();
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
      const result = await loginMutation({ email, password });
      
      // Refresh the session
      router.refresh();
      
      return { success: true, user: result.user };
    } catch (error) {
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
    isAuthenticated: !!session?.user,
    session
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default function useAuth() {
  return useContext(AuthContext);
} 