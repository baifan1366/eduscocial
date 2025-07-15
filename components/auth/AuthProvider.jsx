"use client";

import { SessionProvider } from 'next-auth/react';
import { SettingsProvider } from '@/hooks/useSettings';

export default function AuthProvider({ children, session }) {
  return (
    <SessionProvider session={session}>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </SessionProvider>
  );
} 