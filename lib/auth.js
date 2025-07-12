/**
 * Helper functions for authentication
 */

import bcrypt from 'bcrypt';
import prisma from './prisma';
import { storeUserSession, removeUserSession, storeProviderTokens } from './redis/redisUtils';

/**
 * Checks if an email is from an educational institution
 * @param {string} email - The email to check
 * @returns {boolean} True if the email is from an educational institution
 */
export function isEducationalEmail(email) {
  if (!email) return false;
  
  // List of common educational domains
  const educationalDomains = [
    '.edu',
    '.edu.',
    '.ac.',
    'university',
    'school',
    'college',
    'academy'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  return educationalDomains.some(eduDomain => domain.includes(eduDomain));
}

/**
 * Get user info from session
 * @param {object} session - The NextAuth session object
 * @returns {object} User info
 */
export function getUserFromSession(session) {
  return session?.user || null;
}

/**
 * Check if the current user has admin role
 * @param {object} session - The NextAuth session object
 * @returns {boolean} True if user has admin role
 */
export function isAdmin(session) {
  return session?.user?.role === 'ADMIN';
}

/**
 * Check if the current user has moderator role
 * @param {object} session - The NextAuth session object
 * @returns {boolean} True if user has moderator role
 */
export function isModerator(session) {
  return session?.user?.role === 'MODERATOR' || isAdmin(session);
}

/**
 * Login user with email and password
 * @param {object} credentials - User credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<{user: object, session: object}>} User and session objects
 * @throws {Error} If login fails
 */
export async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  // If no user found
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Update last login time
  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: new Date() }
  });

  // Create session in Redis
  const sessionData = {
    email: user.email,
    name: user.name || user.username,
    role: user.role || 'USER',
    loginTime: Date.now()
  };

  await storeUserSession(user.id, sessionData);

  return {
    user,
    session: sessionData
  };
}

/**
 * Register new user
 * @param {object} userData - User data
 * @param {string} userData.name - User name
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @returns {Promise<object>} Created user object
 * @throws {Error} If registration fails
 */
export async function registerUser({ name, email, password }) {
  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required');
  }

  // Check if email is educational
  if (!isEducationalEmail(email)) {
    throw new Error('Only educational email addresses are allowed');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existingUser) {
    throw new Error('User already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate username from email
  const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      username,
      password: hashedPassword
    }
  });

  return user;
}

/**
 * Logout user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function logoutUser(userId) {
  if (!userId) {
    return;
  }
  
  await removeUserSession(userId);
}

/**
 * Store OAuth provider tokens in Redis
 * @param {string} userId - User ID
 * @param {string} provider - Provider name (google, github, etc)
 * @param {object} tokens - Provider tokens
 * @returns {Promise<void>}
 */
export async function storeOAuthTokens(userId, provider, tokens) {
  if (!userId || !provider || !tokens) {
    return;
  }
  
  await storeProviderTokens(userId, provider, tokens);
} 