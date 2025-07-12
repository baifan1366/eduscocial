import NextAuth, { AuthOptions } from "next-auth";
// Import mock adapter until you can install the real package
// Replace with: import { PrismaAdapter } from "@auth/prisma-adapter"; when you can install it
import { PrismaAdapter } from "@/lib/prisma-adapter-mock";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";
import { isEducationalEmail } from "@/lib/auth";

// Configure NextAuth
export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma) as any, // Cast to any to avoid type errors
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

        return user;
      }
    }),
    
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
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
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user'
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Include user ID in JWT token
      if (user) {
        token.userId = user.id;
        token.role = (user as any).role || "user";
      }
      
      // If it's an OAuth login, mark as verified
      if (account && account.provider !== "credentials") {
        token.emailVerified = true;
      }
      
      return token;
    },
    async session({ session, token }) {
      // Add user ID and role to session
      if (session.user && token) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    // Only allow educational emails
    async signIn({ user }) {
      // Skip check for already verified users
      if ((user as any).emailVerified) {
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
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 