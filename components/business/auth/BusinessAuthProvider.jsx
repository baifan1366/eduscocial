import { createContext, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '../../../hooks/useAuth';

// Create auth context
export const BusinessAuthContext = createContext({
  isBusiness: false,
  user: null,
  isLoading: true,
  error: null,
  logout: () => {},
});

export default function BusinessAuthProvider({ children }) {
  const router = useRouter();
  const { user, status, isLoading, error, logout, isBusiness } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Redirect if not authenticated or not a business user
  useEffect(() => {
    if (!isLoading && status !== 'loading') {
      setIsCheckingAuth(false);

      // If not authenticated, redirect to login
      if (status === 'unauthenticated') {
        router.replace('/business/login');
        return;
      }

      // If authenticated but not a business user, redirect to unauthorized page
      if (user && !isBusiness()) {
        router.replace('/unauthorized');
        return;
      }
    }
  }, [isLoading, status, user, isBusiness, router]);

  // Logout handler
  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/business/login');
  }, [logout, router]);

  // Context value
  const value = {
    isBusiness: user ? isBusiness() : false,
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

  // If not authenticated or not a business user, don't render children
  if (status === 'unauthenticated' || (user && !isBusiness())) {
    return null;
  }

  return (
    <BusinessAuthContext.Provider value={value}>
      {children}
    </BusinessAuthContext.Provider>
  );
} 