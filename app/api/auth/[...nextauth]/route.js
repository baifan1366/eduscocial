import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcrypt";
import { isEducationalEmail, storeOAuthTokens } from "@/lib/auth";
import { updateUserOnlineStatus } from "@/lib/redis/redisUtils";
import prisma from "@/lib/prisma";

/**
 * NextAuth.js configuration options
 */
export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Email/Password authentication
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        // If no user or no password (OAuth account)
        if (!user || !user.password) {
          return null;
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Update user's online status in Redis
        await updateUserOnlineStatus(user.id, true);

        return user;
      }
    }),
    
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      profile(profile) {
        // Only allow educational emails
        if (!isEducationalEmail(profile.email)) {
          throw new Error("Only educational email addresses are allowed");
        }
        
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: new Date(),
        };
      },
    }),
    
    // Add other OAuth providers here as needed
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/error',
    verifyRequest: '/verify-request',
    newUser: '/register'
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Include user ID in JWT token
      if (user) {
        token.userId = user.id;
        token.role = user.role || "USER";
      }
      
      // If it's an OAuth login, mark as verified
      if (account && account.provider !== "credentials") {
        token.emailVerified = true;
        
        // Store OAuth tokens in Redis
        if (user && account.access_token) {
          await storeOAuthTokens(user.id, account.provider, {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            token_type: account.token_type
          });
          
          // Update user's online status
          await updateUserOnlineStatus(user.id, true);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      // Add user ID and role to session
      if (session.user && token) {
        session.user.id = token.userId;
        session.user.role = token.role;
      }
      return session;
    },
    // Only allow educational emails
    async signIn({ user }) {
      // Skip check for already verified users
      if (user.emailVerified) {
        return true;
      }
      
      // Check if email is from an educational institution
      const email = user.email;
      if (!email || !isEducationalEmail(email)) {
        return false;
      }
      
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // Any additional actions on user creation
      console.log(`New user created: ${user.email}`);
    },
    async signIn({ user }) {
      // Update user's last login time
      await prisma.user.update({
        where: { id: user.id },
        data: { last_login_at: new Date() }
      });
      
      // Update user's online status
      await updateUserOnlineStatus(user.id, true);
    },
    async signOut({ token }) {
      // Update user's online status
      if (token?.userId) {
        await updateUserOnlineStatus(token.userId, false);
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

/**
 * Export the NextAuth.js handler
 */
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 