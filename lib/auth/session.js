/**
 * Session management utilities
 * Handles session storage and retrieval using Redis
 */

import redis from '../redis/redis';
import { verifyJWT } from './jwt';
import { getAuthCookie } from './cookies';
import { createServerSupabaseClient } from '../supabase';

// Session TTL in seconds (23 hours)
const SESSION_TTL = 60 * 60 * 23;

/**
 * Store user session data in Redis
 * @param {string} userId - User ID
 * @param {object} sessionData - Session data to store
 * @returns {Promise<boolean>} Success status
 */
export async function storeSession(userId, sessionData) {
  try {
    const sessionKey = `user:${userId}:session`;
    
    // Store session data in Redis
    await redis.hset(sessionKey, {
      ...sessionData,
      lastActive: Date.now()
    });
    
    // Set TTL on the session
    await redis.expire(sessionKey, SESSION_TTL);
    
    return true;
  } catch (error) {
    console.error('Error storing session in Redis:', error);
    return false;
  }
}

/**
 * Get user session data from Redis
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} Session data or null if not found
 */
export async function getSession(userId) {
  try {
    const sessionKey = `user:${userId}:session`;
    const sessionData = await redis.hgetall(sessionKey);
    
    // If session exists, refresh its TTL and update last active timestamp
    if (sessionData && Object.keys(sessionData).length > 0) {
      await redis.hset(sessionKey, 'lastActive', Date.now());
      await redis.expire(sessionKey, SESSION_TTL);
      
      return sessionData;
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving session from Redis:', error);
    return null;
  }
}

/**
 * Delete user session from Redis
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteSession(userId) {
  try {
    const sessionKey = `user:${userId}:session`;
    await redis.del(sessionKey);
    return true;
  } catch (error) {
    console.error('Error deleting session from Redis:', error);
    return false;
  }
}

/**
 * Get current authenticated user from token in request
 * Falls back to database if Redis cache is unavailable
 * @returns {Promise<object|null>} User data or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    // Get JWT token from cookie
    const token = getAuthCookie();
    if (!token) return null;
    
    // Verify and decode JWT
    const decodedToken = await verifyJWT(token);
    if (!decodedToken || !decodedToken.id) return null;
    
    const userId = decodedToken.id;
    
    // Try to get session from Redis first (fast)
    const sessionData = await getSession(userId);
    if (sessionData && sessionData.id === userId) {
      return {
        id: sessionData.id,
        email: sessionData.email,
        username: sessionData.username,
        displayName: sessionData.displayName,
        role: sessionData.role || 'user'
      };
    }
    
    // If not in Redis, get from database (slower)
    const supabase = createServerSupabaseClient();
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, email, username, admin_users(role)')
      .eq('id', userId)
      .single();
    
    if (error || !userData) return null;
    
    // Determine if user is an admin and what role they have
    const role = userData.admin_users && userData.admin_users.length > 0
      ? userData.admin_users[0].role
      : 'user';
    
    const user = {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      role
    };
    
    // Store in Redis for next time
    await storeSession(userId, user);
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Store temporary token in Redis (for email verification, password reset, etc.)
 * @param {string} tokenType - Type of token (verification, reset, etc.)
 * @param {string} token - The token
 * @param {string} userId - Associated user ID
 * @param {number} ttlSeconds - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
export async function storeTemporaryToken(tokenType, token, userId, ttlSeconds = 3600) {
  try {
    const key = `token:${tokenType}:${token}`;
    await redis.set(key, userId);
    await redis.expire(key, ttlSeconds);
    return true;
  } catch (error) {
    console.error(`Error storing ${tokenType} token:`, error);
    return false;
  }
}

/**
 * Validate and consume a temporary token from Redis
 * @param {string} tokenType - Type of token (verification, reset, etc.)
 * @param {string} token - The token to validate
 * @returns {Promise<string|null>} User ID if valid, null if invalid
 */
export async function validateTemporaryToken(tokenType, token) {
  try {
    const key = `token:${tokenType}:${token}`;
    
    // Get user ID associated with token
    const userId = await redis.get(key);
    
    if (userId) {
      // Delete token so it can't be used again (consume it)
      await redis.del(key);
      return userId;
    }
    
    return null;
  } catch (error) {
    console.error(`Error validating ${tokenType} token:`, error);
    return null;
  }
} 