"use client";

import { AuthProvider as CustomAuthProvider } from '../../hooks/useAuth';

export default function AuthProvider({ children }) {
  return (
    <CustomAuthProvider>
      {children}
    </CustomAuthProvider>
  );
} 