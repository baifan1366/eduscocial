'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useSession, signOut as nextAuthSignOut, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Create context with a default value to avoid undefined errors
const AuthContext = createContext({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => ({ success: false, error: 'AuthContext not initialized' }),
  logout: async () => ({ success: false, error: 'AuthContext not initialized' }),
  register: async () => ({ success: false, error: 'AuthContext not initialized' }),
  session: null
});

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();
  const isSessionLoading = status === "loading";

  // Explicitly sync with NextAuth session
  useEffect(() => {
    const syncSession = async () => {
      try {
        // Refresh session data
        await getSession();
        setLoading(isSessionLoading);
      } catch (error) {
        console.error("Failed to sync session:", error);
        setLoading(false);
      }
    };

    syncSession();
  }, [isSessionLoading]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Refresh the session
      await getSession();
      router.refresh();
      
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // First call our custom logout endpoint
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Logout failed');
      }
      
      // Then signout from NextAuth
      await nextAuthSignOut({ redirect: false });

      router.push('/login');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user: session?.user || null,
    loading: loading || isSessionLoading,
    login,
    logout,
    register,
    isAuthenticated: !!session?.user,
    session
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default function useAuth() {
  const context = useContext(AuthContext);
  // Provide a useful console message in development if used outside provider
  if (process.env.NODE_ENV !== 'production' && !context) {
    console.warn(
      'useAuth() was called outside of AuthProvider. Make sure your component is wrapped in AuthProvider.'
    );
  }
  return context;
} 