import NextAuth, { DefaultSession, DefaultUser, DefaultJWT } from "next-auth";

// Extend the built-in session types
declare module "next-auth" {
  /**
   * Extend the built-in session type
   */
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  /**
   * Extend the built-in user type
   */
  interface User extends DefaultUser {
    role?: string;
    username?: string;
    university?: string;
    studyField?: string;
  }
}

// Extend the JWT type
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId?: string;
    role?: string;
    emailVerified?: boolean;
  }
} 