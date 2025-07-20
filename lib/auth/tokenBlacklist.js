/**
 * JWT Token Blacklist Management
 * Provides Redis-based token blacklisting functionality for immediate token revocation
 */

import redis from '../redis/redis.js';
import { verifyJWT } from './jwt.js';

/**
 * Extract token signature for blacklist storage
 * Uses last 32 characters of signature for uniqueness while minimizing storage
 * @param {string} token - JWT token
 * @returns {string} Token signature for blacklist storage
 * @throws {Error} If token format is invalid
 */
export function getTokenSignature(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token: token must be a non-empty string');
  }
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format: JWT must have 3 parts');
  }
  
  const signature = parts[2];
  if (!signature || signature.length < 32) {
    throw new Error('Invalid token signature: signature too short');
  }
  
  // Use last 32 characters of signature for uniqueness
  return signature.slice(-32);
}

/**
 * Calculate appropriate TTL for blacklisted token
 * Ensures blacklist entry expires when token would naturally expire
 * @param {string} token - JWT token
 * @returns {number} TTL in seconds
 * @throws {Error} If token is invalid or expired
 */
export function calculateBlacklistTTL(token) {
  try {
    // First verify the token structure without checking expiration
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    // Decode payload manually to get expiration
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    if (!payload.exp) {
      throw new Error('Token missing expiration claim');
    }
    
    const now = Math.floor(Date.now() / 1000);
    const remainingTime = payload.exp - now;
    
    // If token is already expired, use minimum TTL for cleanup
    if (remainingTime <= 0) {
      return 60; // 1 minute minimum for cleanup
    }
    
    // Ensure minimum TTL of 1 minute, maximum of 24 hours
    return Math.max(60, Math.min(remainingTime, 86400));
  } catch (error) {
    console.error('Error calculating blacklist TTL:', error);
    // Default to 1 hour if calculation fails
    return 3600;
  }
}

/**
 * Add a single token to the blacklist
 * @param {string} token - JWT token to blacklist
 * @param {number} [customTTL] - Custom TTL in seconds (optional)
 * @returns {Promise<void>}
 * @throws {Error} If token is invalid or Redis operation fails
 */
export async function blacklistToken(token, customTTL = null) {
  try {
    const signature = getTokenSignature(token);
    const ttl = customTTL || calculateBlacklistTTL(token);
    
    const key = `blacklist:token:${signature}`;
    
    // Store token signature with TTL
    await redis.set(key, '1', { ex: ttl });
    
    console.log(`Token blacklisted: ${signature.substring(0, 8)}... (TTL: ${ttl}s)`);
  } catch (error) {
    console.error('Error blacklisting token:', error);
    throw new Error(`Failed to blacklist token: ${error.message}`);
  }
}

/**
 * Add all tokens for a user to the blacklist
 * Uses user token tracking to find and blacklist all active tokens
 * @param {string} userId - User ID whose tokens should be blacklisted
 * @param {string} [reason] - Reason for blacklisting (for logging)
 * @returns {Promise<number>} Number of tokens blacklisted
 */
export async function blacklistUserTokens(userId, reason = 'user_logout') {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const userTokensKey = `user:tokens:${userId}`;
    
    // Get all token signatures for this user
    const tokenSignatures = await redis.smembers(userTokensKey);
    
    if (!tokenSignatures || tokenSignatures.length === 0) {
      console.log(`No active tokens found for user ${userId}`);
      return 0;
    }
    
    let blacklistedCount = 0;
    const pipeline = redis.pipeline();
    
    // Blacklist each token signature
    for (const signature of tokenSignatures) {
      const blacklistKey = `blacklist:token:${signature}`;
      // Use default TTL of 24 hours for user token blacklisting
      pipeline.set(blacklistKey, '1', { ex: 86400 });
      blacklistedCount++;
    }
    
    // Clear the user's token tracking set
    pipeline.del(userTokensKey);
    
    // Execute all operations
    await pipeline.exec();
    
    console.log(`Blacklisted ${blacklistedCount} tokens for user ${userId} (reason: ${reason})`);
    return blacklistedCount;
  } catch (error) {
    console.error('Error blacklisting user tokens:', error);
    throw new Error(`Failed to blacklist user tokens: ${error.message}`);
  }
}

/**
 * Check if a token is blacklisted
 * @param {string} token - JWT token to check
 * @returns {Promise<boolean>} True if token is blacklisted
 */
export async function isTokenBlacklisted(token) {
  try {
    const signature = getTokenSignature(token);
    const key = `blacklist:token:${signature}`;
    
    const result = await redis.get(key);
    return result !== null;
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    // In case of Redis error, allow the request to proceed
    // This provides graceful degradation
    return false;
  }
}

/**
 * Remove a token from the blacklist (for testing/admin purposes)
 * @param {string} token - JWT token to remove from blacklist
 * @returns {Promise<boolean>} True if token was removed, false if not found
 */
export async function removeFromBlacklist(token) {
  try {
    const signature = getTokenSignature(token);
    const key = `blacklist:token:${signature}`;
    
    const result = await redis.del(key);
    return result === 1;
  } catch (error) {
    console.error('Error removing token from blacklist:', error);
    throw new Error(`Failed to remove token from blacklist: ${error.message}`);
  }
}

/**
 * Track a token for a user (for global logout functionality)
 * @param {string} userId - User ID
 * @param {string} token - JWT token to track
 * @returns {Promise<void>}
 */
export async function trackUserToken(userId, token) {
  try {
    if (!userId || !token) {
      throw new Error('User ID and token are required');
    }
    
    const signature = getTokenSignature(token);
    const userTokensKey = `user:tokens:${userId}`;
    
    // Add token signature to user's token set
    await redis.sadd(userTokensKey, signature);
    
    // Set TTL for the tracking set (24 hours, refreshed on each login)
    await redis.expire(userTokensKey, 86400);
  } catch (error) {
    console.error('Error tracking user token:', error);
    // Don't throw error for token tracking failures to avoid breaking login
  }
}

/**
 * Get blacklist statistics
 * @returns {Promise<Object>} Blacklist statistics
 */
export async function getBlacklistStats() {
  try {
    // Get all blacklist keys
    const blacklistKeys = await redis.keys('blacklist:token:*');
    const totalBlacklistedTokens = blacklistKeys.length;
    
    // Count tokens expiring soon (within 1 hour)
    let tokensExpiringSoon = 0;
    const oneHourFromNow = Math.floor(Date.now() / 1000) + 3600;
    
    // Check TTL for each blacklisted token
    const pipeline = redis.pipeline();
    blacklistKeys.forEach(key => {
      pipeline.ttl(key);
    });
    
    const ttlResults = await pipeline.exec();
    if (ttlResults && Array.isArray(ttlResults)) {
      ttlResults.forEach((result) => {
        // Handle different Redis client response formats
        const ttl = Array.isArray(result) ? result[1] : result;
        if (typeof ttl === 'number' && ttl > 0 && ttl <= 3600) {
          tokensExpiringSoon++;
        }
      });
    }
    
    // Get approximate memory usage (rough estimate)
    const avgKeySize = 50; // Approximate bytes per blacklist entry
    const memoryUsage = `${(totalBlacklistedTokens * avgKeySize / 1024).toFixed(2)} KB`;
    
    return {
      totalBlacklistedTokens,
      tokensExpiringSoon,
      memoryUsage,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting blacklist statistics:', error);
    return {
      totalBlacklistedTokens: 0,
      tokensExpiringSoon: 0,
      memoryUsage: '0 KB',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Cleanup expired blacklist entries (maintenance function)
 * Redis TTL should handle this automatically, but this provides manual cleanup
 * @returns {Promise<number>} Number of entries cleaned up
 */
export async function cleanupExpiredBlacklistEntries() {
  try {
    const blacklistKeys = await redis.keys('blacklist:token:*');
    let cleanedUp = 0;
    
    const pipeline = redis.pipeline();
    
    for (const key of blacklistKeys) {
      const ttl = await redis.ttl(key);
      // Remove keys that have expired or have no TTL set
      if (ttl === -1 || ttl === -2) {
        pipeline.del(key);
        cleanedUp++;
      }
    }
    
    if (cleanedUp > 0) {
      await pipeline.exec();
      console.log(`Cleaned up ${cleanedUp} expired blacklist entries`);
    }
    
    return cleanedUp;
  } catch (error) {
    console.error('Error cleaning up blacklist entries:', error);
    return 0;
  }
}