/**
 * Helper functions for authentication
 */

import bcrypt from 'bcrypt';
import { supabase } from '@/lib/supabase';
import { storeUserSession, removeUserSession, storeProviderTokens } from './redis/redisUtils';
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import FacebookProvider from "next-auth/providers/facebook";
import { updateUserOnlineStatus } from "@/lib/redis/redisUtils";

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
          console.log('Authorization failed: Missing email or password');
          throw new Error('缺少邮箱或密码');
        }

        try {
          // Find user by email
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single();

          // If no user found
          if (error || !user) {
            console.log('Authorization failed: User not found');
            throw new Error('用户不存在');
          }

          // If user doesn't have password (OAuth account)
          if (!user.password) {
            console.log('Authorization failed: OAuth account trying to login with password');
            throw new Error('此账户使用第三方登录，请使用对应的第三方登录方式');
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            console.log('Authorization failed: Invalid password');
            throw new Error('密码错误');
          }

          // Update user's online status in Redis
          await updateUserOnlineStatus(user.id, true);

          // Return a clean user object without sensitive data
          return {
            id: user.id,
            name: user.display_name || user.username,
            email: user.email,
            image: user.avatar_url,
            role: user.role || 'USER'
          };
        } catch (error) {
          console.error('Authorization error:', error);
          throw error; // 重新抛出错误，让前端能捕获到具体错误信息
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
        console.log('Google profile received:', JSON.stringify(profile, null, 2));
        
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
        console.log('GitHub profile received:', JSON.stringify(profile, null, 2));
        
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          emailVerified: profile.email ? new Date() : null,
        };
      },
    }),
    
    // Facebook OAuth
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      profile(profile) {
        console.log('Facebook profile received:', JSON.stringify(profile, null, 2));
        
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture?.data?.url,
          emailVerified: profile.email ? new Date() : null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login', // 移除语言前缀，让中间件处理
    signOut: '/logout',
    error: '/error',
    verifyRequest: '/verify-request',
    newUser: '/register'
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Add debugging logs
      console.log('JWT Callback - Account:', JSON.stringify(account, null, 2));
      console.log('JWT Callback - Profile:', JSON.stringify(profile, null, 2));
      
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
      // Add debugging logs
      console.log('Session Callback - Token:', JSON.stringify(token, null, 2));
      
      // Add user ID and role to session
      if (session.user && token) {
        session.user.id = token.userId;
        session.user.role = token.role;
        session.provider = token.provider;
        session.providerId = token.providerId;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Add debugging logs
      console.log('SignIn Callback - User:', JSON.stringify(user, null, 2));
      console.log('SignIn Callback - Account:', JSON.stringify(account, null, 2));
      console.log('SignIn Callback - Profile:', JSON.stringify(profile, null, 2));
      
      // Always allow sign-in for users with valid credentials
      if (account?.provider === 'credentials') {
        return true;
      }
      
      // For OAuth providers, handle user creation/update
      if (account && account.provider !== "credentials") {
        try {
          // Check if user exists
          const { data: existingUser, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Database error:', error);
            return false;
          }

          if (!existingUser) {
            // Create new user for OAuth
            const { error: createError } = await supabase
              .from('users')
              .insert({
                email: user.email,
                username: user.email,
                display_name: user.name,
                avatar_url: user.image,
                email_verified: true,
                oauth_provider: account.provider,
                oauth_provider_id: account.providerAccountId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (createError) {
              console.error('Error creating OAuth user:', createError);
              return false;
            }
          } else {
            // Update existing user
            const { error: updateError } = await supabase
              .from('users')
              .update({
                display_name: user.name,
                avatar_url: user.image,
                email_verified: true,
                oauth_provider: account.provider,
                oauth_provider_id: account.providerAccountId,
                updated_at: new Date().toISOString()
              })
              .eq('email', user.email);

            if (updateError) {
              console.error('Error updating OAuth user:', updateError);
              return false;
            }
          }
        } catch (error) {
          console.error('OAuth user handling error:', error);
          return false;
        }
      }
      
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Log for debugging
      console.log('Redirect Callback - URL:', url, 'BaseURL:', baseUrl);
      
      // If it's a relative URL, make it absolute
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // If it's the same origin, allow it
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Default to base URL
      return baseUrl;
    }
  },
  events: {
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

// Helper function to store OAuth tokens (implement this based on your needs)
async function storeOAuthTokens(userId, provider, tokens) {
  try {
    await storeProviderTokens(userId, provider, tokens);
  } catch (error) {
    console.error('Error storing OAuth tokens:', error);
  }
}