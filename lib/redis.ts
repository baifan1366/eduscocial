import { Redis } from '@upstash/redis';

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Redis key prefixes for different data types
const KEY_PREFIXES = {
  USER: 'user:',
  SESSION: 'session:',
  EMAIL_VERIFICATION: 'email_verify:',
  RATE_LIMIT: 'rate_limit:',
};

// Type definitions for better type safety
export interface UserData {
  id: string;
  email: string;
  name: string;
  hashedPassword: string;
  emailVerified?: boolean;
  createdAt?: string;
}

export interface SessionData {
  userId: string;
  sessionToken: string;
  expires: string;
}

export interface EmailVerificationData {
  email: string;
  token: string;
  expires: string;
}

// Helper functions for user-related operations
export async function getUserByEmail(email: string): Promise<UserData | null> {
  const userId = await redis.get(`${KEY_PREFIXES.USER}email:${email}`);
  if (!userId) return null;
  
  return getUserById(userId.toString());
}

export async function getUserById(id: string): Promise<UserData | null> {
  const user = await redis.hgetall(`${KEY_PREFIXES.USER}${id}`);
  if (!user || Object.keys(user).length === 0) return null;
  
  return user as unknown as UserData;
}

export async function createUser(userData: {
  id: string;
  email: string;
  hashedPassword: string;
  name: string;
  emailVerified?: boolean;
}): Promise<UserData | null> {
  const { id, email, ...rest } = userData;
  
  // Create a transaction to ensure atomic operations
  const pipeline = redis.pipeline();
  
  // Store user data
  pipeline.hset(`${KEY_PREFIXES.USER}${id}`, {
    id,
    email,
    ...rest,
    createdAt: new Date().toISOString(),
  });
  
  // Create email to ID mapping for lookups
  pipeline.set(`${KEY_PREFIXES.USER}email:${email}`, id);
  
  await pipeline.exec();
  return getUserById(id);
}

// Session management
export async function createSession(userId: string, sessionToken: string, expires: Date): Promise<void> {
  await redis.hset(`${KEY_PREFIXES.SESSION}${sessionToken}`, {
    userId,
    expires: expires.toISOString(),
    sessionToken,
  });
  
  // Set expiration on the session key
  const ttl = Math.floor((expires.getTime() - Date.now()) / 1000);
  if (ttl > 0) {
    await redis.expire(`${KEY_PREFIXES.SESSION}${sessionToken}`, ttl);
  }
}

export async function getSessionByToken(sessionToken: string): Promise<SessionData | null> {
  const session = await redis.hgetall(`${KEY_PREFIXES.SESSION}${sessionToken}`);
  if (!session || Object.keys(session).length === 0) return null;
  
  return session as unknown as SessionData;
}

export async function deleteSession(sessionToken: string): Promise<void> {
  await redis.del(`${KEY_PREFIXES.SESSION}${sessionToken}`);
}

// Email verification
export async function createEmailVerificationToken(email: string, token: string, expires: Date): Promise<void> {
  await redis.hset(`${KEY_PREFIXES.EMAIL_VERIFICATION}${token}`, {
    email,
    token,
    expires: expires.toISOString(),
  });
  
  // Set expiration on the verification token
  const ttl = Math.floor((expires.getTime() - Date.now()) / 1000);
  if (ttl > 0) {
    await redis.expire(`${KEY_PREFIXES.EMAIL_VERIFICATION}${token}`, ttl);
  }
}

export async function getEmailVerificationToken(token: string): Promise<EmailVerificationData | null> {
  const verification = await redis.hgetall(`${KEY_PREFIXES.EMAIL_VERIFICATION}${token}`);
  if (!verification || Object.keys(verification).length === 0) return null;
  
  return verification as unknown as EmailVerificationData;
}

export async function deleteEmailVerificationToken(token: string): Promise<void> {
  await redis.del(`${KEY_PREFIXES.EMAIL_VERIFICATION}${token}`);
}
