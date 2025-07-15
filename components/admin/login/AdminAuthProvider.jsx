'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '../../../hooks/useAdminAuth';

export default function AdminAuthProvider({ children }) {
  
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SessionProvider>
  );
} 