"use client";

import { SessionProvider } from "next-auth/react";

/**
 * NextAuth.js SessionProvider wrapper component
 * 
 * Provides authentication session to all child components
 * 
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} Wrapped component with auth session
 */
export default function AuthProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
} 