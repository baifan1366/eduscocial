'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { isAdmin, isModerator } from '@/lib/auth';

/**
 * Custom authentication hook for NextAuth.js
 * 
 * @returns {object} Authentication utilities and user data
 */
export function useAuth() {
  const { data: session, status } = useSession();
  
  const user = session?.user;
  const loading = status === 'loading';
  const authenticated = status === 'authenticated';
  
  /**
   * Login with credentials
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Login result
   */
  const login = async (email, password) => {
    return signIn('credentials', { email, password });
  };
  
  /**
   * Login with Google
   * @param {object} options - SignIn options
   * @returns {Promise} Login result
   */
  const loginWithGoogle = (options = {}) => {
    return signIn('google', options);
  };
  
  /**
   * Logout the current user
   * @returns {Promise} Logout result
   */
  const logout = () => {
    return signOut();
  };

  /**
   * Check if user has admin role
   * @returns {boolean} Is admin
   */
  const checkIsAdmin = () => isAdmin(session);

  /**
   * Check if user has moderator role
   * @returns {boolean} Is moderator
   */
  const checkIsModerator = () => isModerator(session);
  
  return {
    user,
    session,
    status,
    loading,
    authenticated,
    login,
    loginWithGoogle,
    logout,
    isAdmin: checkIsAdmin(),
    isModerator: checkIsModerator(),
  };
} 