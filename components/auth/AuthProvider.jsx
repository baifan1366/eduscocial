'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from '@/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';

// Create context
export const AuthContext = createContext(null);

// Auth provider component
export function AuthProvider({ children }) {
  const { user, status, isAuthenticated, hasRole } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  // Value provided to context consumers
  const value = {
    user,
    status,
    isAuthenticated,
    hasRole,
    isLoading: status === 'loading',
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Default export for convenience
export default AuthProvider; 