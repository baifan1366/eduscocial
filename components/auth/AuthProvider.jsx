"use client";

import { SessionProvider } from 'next-auth/react';
import { AuthProvider as CustomAuthProvider } from '../../hooks/useAuth';

export default function AuthProvider({ children, session }) {
  return (
    <SessionProvider session={session}>
      <CustomAuthProvider>
        {children}
      </CustomAuthProvider>
    </SessionProvider>
  );
} 