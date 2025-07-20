'use client';

import { createContext, useContext } from 'react';
import { useSession } from '@/hooks/useAuth';

// Create context
export const AuthContext = createContext(null);

// Auth provider component
export function BusinessAuthProvider({ children }) {
  const { user, status, isAuthenticated, hasRole } = useSession();
  
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
    throw new Error('useAuth must be used within an BusinessAuthProvider');
  }
  
  return context;
}

// Default export for convenience
export default BusinessAuthProvider; 