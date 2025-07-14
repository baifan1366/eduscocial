import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import FacebookProvider from "next-auth/providers/facebook";
import bcrypt from "bcrypt";
import { isEducationalEmail, storeOAuthTokens } from "@/lib/auth";
import { updateUserOnlineStatus } from "@/lib/redis/redisUtils";
import { supabase } from "@/lib/supabase";

/**
 * NextAuth.js configuration options
 */
export const authOptions = {
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

        try {
          // Find user by email
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single();

          // If no user or no password (OAuth account)
          if (error || !user || !user.password) {
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
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      }
    }),
    
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
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
    
    // GitHub OAuth
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      profile(profile) {
        // Check if the email is educational (GitHub may not provide email)
        const email = profile.email || '';
        if (email && !isEducationalEmail(email)) {
          throw new Error("Only educational email addresses are allowed");
        }
        
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          emailVerified: email ? new Date() : null,
        };
      },
    }),
    
    // Facebook OAuth
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      profile(profile) {
        // Only allow educational emails
        if (profile.email && !isEducationalEmail(profile.email)) {
          throw new Error("Only educational email addresses are allowed");
        }
        
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture?.data?.url,
          emailVerified: profile.email ? new Date() : null,
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
    async jwt({ token, user, account, profile }) {
      // Include user ID in JWT token
      if (user) {
        token.userId = user.id;
        token.role = user.role || "USER";
      }
      
      // If it's an OAuth login, mark as verified and include provider info
      if (account && account.provider !== "credentials") {
        token.emailVerified = true;
        token.provider = account.provider;
        token.providerId = account.providerAccountId;
        
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
        session.provider = token.provider;
        session.providerId = token.providerId;
      }
      return session;
    },
    // Only allow educational emails
    async signIn({ user, account, profile }) {
      // Skip check for already verified users
      if (user.emailVerified) {
        return true;
      }
      
      // Check if email is from an educational institution
      const email = user.email;
      if (!email || !isEducationalEmail(email)) {
        return false;
      }
      
      // Create or update user record after successful OAuth sign in
      if (account && account.provider !== "credentials") {
        try {
          // Just return true to complete the sign in process
          // The OAuth success handling will be done in the events.signIn callback
          return true;
        } catch (error) {
          console.error("Error in sign in callback:", error);
          return false; // Prevent sign in if there's an error
        }
      }
      
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // Any additional actions on user creation
      console.log(`New user created: ${user.email}`);
    },
    async signIn({ user, account, isNewUser }) {
      try {
        // Update user's last login time
        const { error } = await supabase
          .from('users')
          .update({ last_login_at: new Date() })
          .eq('id', user.id);
        
        if (error) {
          console.error('Error updating last login time:', error);
        }
        
        // Update user's online status
        await updateUserOnlineStatus(user.id, true);
        
        // If it's an OAuth login
        if (account && account.provider !== "credentials") {
          // Store provider data
          const providerData = {
            user_id: user.id,
            provider_name: account.provider,
            provider_user_id: account.providerAccountId,
            provider_email: user.email,
            profile_data: {
              name: user.name,
              image: user.image
            }
          };
          
          // Update or insert provider connection
          const { data: existingProvider } = await supabase
            .from('user_providers')
            .select('id')
            .eq('user_id', user.id)
            .eq('provider_name', account.provider)
            .single();
          
          if (existingProvider) {
            await supabase
              .from('user_providers')
              .update(providerData)
              .eq('id', existingProvider.id);
          } else {
            await supabase
              .from('user_providers')
              .insert(providerData);
          }
        }
      } catch (error) {
        console.error('Error updating user data on sign in:', error);
      }
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