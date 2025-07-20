'use client';

import { createContext, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '../../../hooks/useAuth';

// Create auth context
export const AdminAuthContext = createContext({
  isAdmin: false,
  user: null,
  isLoading: true,
  error: null,
  logout: () => {},
});

export default function AdminAuthProvider({ children }) {
  const router = useRouter();
  const { user, status, isLoading, error, logout, isAdmin } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Redirect if not authenticated or not an admin
  useEffect(() => {
    if (!isLoading && status !== 'loading') {
      setIsCheckingAuth(false);

      // If not authenticated, redirect to login
      if (status === 'unauthenticated') {
        router.replace('/admin/login');
        return;
      }

      // If authenticated but not an admin, redirect to unauthorized page
      if (user && !isAdmin()) {
        router.replace('/unauthorized');
        return;
      }
    }
  }, [isLoading, status, user, isAdmin, router]);

  // Logout handler
  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/admin/login');
  }, [logout, router]);

  // Context value
  const value = {
    isAdmin: user ? isAdmin() : false,
    user,
    isLoading: isLoading || isCheckingAuth,
    error,
    logout: handleLogout,
  };

  // Don't render children until authentication check is complete
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FF7D00]"></div>
      </div>
    );
  }

  // If not authenticated or not an admin, don't render children
  if (status === 'unauthenticated' || (user && !isAdmin())) {
    return null;
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
} 