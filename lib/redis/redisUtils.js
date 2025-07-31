import redis from './redis';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for database operations
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? 
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null;

/**
 * Increment post view count and sync with database if needed
 * @param {string} postId - The ID of the post
 * @returns {Promise<number>} - The updated view count
 */
export async function incrementPostView(postId) {
  const key = `post:${postId}:views`;
  const count = await redis.incr(key);
  
  // Optional: Sync with database if the count is divisible by 10 (reduces database writes)
  if (count % 10 === 0) {
    // This would typically update the database
    // await supabase
    //   .from('posts')
    //   .update({ view_count: count })
    //   .eq('id', postId);
  }
  
  return count;
}



/**
 * Track user online/offline status
 * @param {string} userId - The ID of the user
 * @param {boolean} isOnline - Whether the user is online (true) or offline (false)
 * @returns {Promise<void>}
 */
export async function updateUserOnlineStatus(userId, isOnline) {
  // 如果userId为空，直接返回
  if (!userId) {
    return;
  }
  
  const key = 'online_users';
  
  try {
    if (isOnline) {
      // Add user to online set with current timestamp
      await redis.hset(key, userId, Date.now());
    } else {
      // Remove user from online set
      await redis.hdel(key, userId);
    }
  } catch (error) {
    console.error('Error updating user online status in Redis:', error);
  }
}

/**
 * Check if a user is online (active in the last 5 minutes)
 * @param {string} userId - The ID of the user
 * @returns {Promise<boolean>} - Whether the user is online
 */
export async function isUserOnline(userId) {
  const key = 'online_users';
  const timestamp = await redis.hget(key, userId);
  
  if (!timestamp) return false;
  
  // Consider users online if they've been active in the last 5 minutes
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  return parseInt(timestamp) > fiveMinutesAgo;
}

/**
 * Get all online users
 * @returns {Promise<string[]>} - Array of user IDs who are currently online
 */
export async function getOnlineUsers() {
  const key = 'online_users';
  const users = await redis.hgetall(key);
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  
  return Object.entries(users)
    .filter(([_, timestamp]) => parseInt(timestamp) > fiveMinutesAgo)
    .map(([userId, _]) => userId);
}

/**
 * Store user session data in Redis
 * @param {string} userId - The ID of the user
 * @param {object} sessionData - Session data to store (tokens, provider, etc)
 * @param {number} ttlInSeconds - Time to live in seconds (default: 24 hours)
 * @returns {Promise<void>}
 */
export async function storeUserSession(userId, sessionData, ttlInSeconds = 86400) {
  const sessionKey = `user:${userId}:session`;
  
  // Store the session data
  await redis.hset(sessionKey, sessionData);
  
  // Set expiration time
  await redis.expire(sessionKey, ttlInSeconds);
  
  // Update online status
  await updateUserOnlineStatus(userId, true);
}

/**
 * Get user session data from Redis
 * @param {string} userId - The ID of the user
 * @returns {Promise<object|null>} - Session data or null if not found
 */
export async function getUserSession(userId) {
  // 如果userId为空，直接返回null
  if (!userId) {
    return null;
  }
  
  const sessionKey = `user:${userId}:session`;
  
  try {
    const sessionData = await redis.hgetall(sessionKey);
    
    // 确保sessionData是对象且不为空
    if (sessionData && typeof sessionData === 'object' && Object.keys(sessionData).length > 0) {
      // Update last active timestamp if session exists
      await updateUserOnlineStatus(userId, true);
      return sessionData;
    }
  } catch (error) {
    console.error('Error fetching session from Redis:', error);
  }
  
  return null;
}

/**
 * Remove user session from Redis
 * @param {string} userId - The ID of the user
 * @returns {Promise<void>}
 */
export async function removeUserSession(userId) {
  // 如果userId为空，直接返回
  if (!userId) {
    return;
  }
  
  const sessionKey = `user:${userId}:session`;
  
  try {
    // Remove session data
    await redis.del(sessionKey);
    
    // Update online status
    await updateUserOnlineStatus(userId, false);
  } catch (error) {
    console.error('Error removing session from Redis:', error);
  }
}

/**
 * Store admin session data in Redis
 * @param {string} userId - The ID of the admin
 * @param {object} sessionData - Session data to store (tokens, provider, etc)
 * @param {number} ttlInSeconds - Time to live in seconds (default: 24 hours)
 * @returns {Promise<void>}
 */
export async function storeAdminSession(userId, sessionData, ttlInSeconds = 86400) {
  const sessionKey = `admin:${userId}:session`;
  
  // Store the session data
  await redis.hset(sessionKey, sessionData);
  
  // Set expiration time
  await redis.expire(sessionKey, ttlInSeconds);
  
  // Update online status
  await updateUserOnlineStatus(userId, true);
}

/**
 * Get admin session data from Redis
 * @param {string} userId - The ID of the admin
 * @returns {Promise<object|null>} - Session data or null if not found
 */
export async function getAdminSession(userId) {
  // 如果userId为空，直接返回null
  if (!userId) {
    return null;
  }
  
  const sessionKey = `admin:${userId}:session`;
  
  try {
    const sessionData = await redis.hgetall(sessionKey);
    
    // 确保sessionData是对象且不为空
    if (sessionData && typeof sessionData === 'object' && Object.keys(sessionData).length > 0) {
      // Update last active timestamp if session exists
      await updateUserOnlineStatus(userId, true);
      return sessionData;
    }
  } catch (error) {
    console.error('Error fetching session from Redis:', error);
  }
  
  return null;
}

/**
 * Remove admin session from Redis
 * @param {string} userId - The ID of the admin
 * @returns {Promise<void>}
 */
export async function removeAdminSession(userId) {
  // 如果userId为空，直接返回
  if (!userId) {
    return;
  }
  
  const sessionKey = `admin:${userId}:session`;
  
  try {
    // Remove session data
    await redis.del(sessionKey);
    
    // Update online status
    await updateUserOnlineStatus(userId, false);
  } catch (error) {
    console.error('Error removing session from Redis:', error);
  }
}

/**
 * Store provider tokens in Redis
 * @param {string} userId - The ID of the admin
 * @param {string} provider - The authentication provider (google, github, etc)
 * @param {object} tokens - The tokens to store (access_token, refresh_token, etc)
 * @returns {Promise<void>}
 */
export async function storeProviderTokens(userId, provider, tokens) {
  const tokenKey = `admin:${userId}:tokens:${provider}`;
  
  // Store tokens with appropriate expiration
  await redis.hset(tokenKey, tokens);
  
  // Set expiration if access_token has expiry
  if (tokens.expires_at) {
    // Calculate TTL (expires_at is typically in seconds since epoch)
    const now = Math.floor(Date.now() / 1000);
    const ttl = Math.max(tokens.expires_at - now, 0);
    await redis.expire(tokenKey, ttl);
  } else if (tokens.expires_in) {
    // If we have expires_in instead
    await redis.expire(tokenKey, tokens.expires_in);
  }
}

/**
 * Get provider tokens from Redis
 * @param {string} userId - The ID of the user
 * @param {string} provider - The authentication provider
 * @returns {Promise<object|null>} - The tokens or null if not found
 */
export async function getProviderTokens(userId, provider) {
  const tokenKey = `user:${userId}:tokens:${provider}`;
  const tokens = await redis.hgetall(tokenKey);
  
  return Object.keys(tokens).length > 0 ? tokens : null;
} 

/**
 * Cache hot posts in Redis for quick access
 * @param {object[]} posts - Array of post objects to cache
 * @param {number} ttlInSeconds - Time to live in seconds (default: 1 hour)
 * @returns {Promise<void>}
 */
export async function cacheHotPosts(posts, ttlInSeconds = 3600) {
  const key = 'hot_posts';
  
  // Store serialized posts
  await redis.set(key, JSON.stringify(posts));
  
  // Set expiration
  await redis.expire(key, ttlInSeconds);
}

/**
 * Get hot posts from Redis cache
 * @returns {Promise<object[]|null>} - Array of post objects or null if not found
 */
export async function getHotPosts() {
  const key = 'hot_posts';
  const postsData = await redis.get(key);
  
  if (!postsData) return null;
  
  try {
    return postsData;
  } catch (error) {
    console.error('Error parsing hot posts data:', error);
    return [];
  }
}

/**
 * Cache trending tags in Redis
 * @param {object[]} tags - Array of tag objects with counts
 * @param {number} ttlInSeconds - Time to live in seconds (default: 6 hours)
 * @returns {Promise<void>}
 */
export async function cacheTrendingTags(tags, ttlInSeconds = 21600) {
  const key = 'trending_tags';
  
  // Store serialized tags
  await redis.set(key, JSON.stringify(tags));
  
  // Set expiration
  await redis.expire(key, ttlInSeconds);
}

/**
 * Get trending tags from Redis cache
 * @returns {Promise<object[]|null>} - Array of tag objects or null if not found
 */
export async function getTrendingTags() {
  const key = 'trending_tags';
  const tagsData = await redis.get(key);
  
  return tagsData ? JSON.parse(tagsData) : null;
}

/**
 * Store user interests in Redis for quick access
 * @param {string} userId - The ID of the user
 * @param {object[]} interests - Array of interest objects (tags, topics)
 * @returns {Promise<void>}
 */
export async function storeUserInterests(userId, interests) {
  const key = `user:${userId}:interests`;
  
  // Store serialized interests
  await redis.set(key, JSON.stringify(interests));
}

/**
 * Get user interests from Redis
 * @param {string} userId - The ID of the user
 * @returns {Promise<object[]|null>} - Array of interest objects or null if not found
 */
export async function getUserInterests(userId) {
  const key = `user:${userId}:interests`;
  const interestsData = await redis.get(key);
  
  return interestsData ? JSON.parse(interestsData) : null;
}

/**
 * Check if user is new (has not selected interests yet)
 * @param {string} userId - The ID of the user
 * @returns {Promise<boolean>} - True if user is new, false otherwise
 */
export async function isNewUser(userId) {
  const interestsKey = `user:${userId}:interests`;
  const hasInterests = await redis.exists(interestsKey);
  
  // Also check if this is the first login
  const sessionKey = `user:${userId}:session`;
  const sessionData = await redis.hgetall(sessionKey);
  
  // Consider a user new if they have no interests stored and this is their first login
  return !hasInterests && (!sessionData.loginCount || sessionData.loginCount === '1');
}

/**
 * Cache personalized post recommendations for a user
 * @param {string} userId - The ID of the user
 * @param {object[]} posts - Array of recommended post objects
 * @param {number} ttlInSeconds - Time to live in seconds (default: 15 minutes)
 * @returns {Promise<void>}
 */
export async function cachePersonalizedRecommendations(userId, posts, ttlInSeconds = 900) {
  const key = `user:${userId}:recommended_posts`;
  
  // Store serialized posts
  await redis.set(key, JSON.stringify(posts));
  
  // Set expiration
  await redis.expire(key, ttlInSeconds);
}

/**
 * Get personalized post recommendations for a user
 * @param {string} userId - The ID of the user
 * @returns {Promise<object[]|null>} - Array of recommended post objects or null if not found
 */
export async function getPersonalizedRecommendations(userId) {
  const key = `user:${userId}:recommended_posts`;
  const postsData = await redis.get(key);
  
  return postsData ? JSON.parse(postsData) : null;
}

// ============================================================================
// JWT TOKEN BLACKLIST UTILITIES
// ============================================================================

/**
 * Add a token signature to the blacklist
 * @param {string} tokenSignature - The token signature to blacklist
 * @param {number} ttlInSeconds - Time to live in seconds
 * @returns {Promise<void>}
 */
export async function addTokenToBlacklist(tokenSignature, ttlInSeconds) {
  if (!tokenSignature) {
    throw new Error('Token signature is required');
  }
  
  const key = `blacklist:token:${tokenSignature}`;
  
  try {
    // Set the token as blacklisted with TTL
    await redis.set(key, '1', 'EX', ttlInSeconds);
    
    // Update blacklist statistics
    await incrementBlacklistStats('total_tokens');
  } catch (error) {
    console.error('Error adding token to blacklist:', error);
    throw error;
  }
}

/**
 * Check if a token signature is blacklisted
 * @param {string} tokenSignature - The token signature to check
 * @returns {Promise<boolean>} - True if token is blacklisted, false otherwise
 */
export async function isTokenBlacklisted(tokenSignature) {
  if (!tokenSignature) {
    return false;
  }
  
  const key = `blacklist:token:${tokenSignature}`;
  
  try {
    const result = await redis.get(key);
    return result === '1';
  } catch (error) {
    console.error('Error checking token blacklist status:', error);
    // In case of Redis error, assume token is not blacklisted to avoid blocking valid requests
    return false;
  }
}

/**
 * Remove a token signature from the blacklist
 * @param {string} tokenSignature - The token signature to remove
 * @returns {Promise<boolean>} - True if token was removed, false if it wasn't blacklisted
 */
export async function removeTokenFromBlacklist(tokenSignature) {
  if (!tokenSignature) {
    return false;
  }
  
  const key = `blacklist:token:${tokenSignature}`;
  
  try {
    const result = await redis.del(key);
    
    if (result > 0) {
      // Update blacklist statistics
      await decrementBlacklistStats('total_tokens');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error removing token from blacklist:', error);
    throw error;
  }
}

/**
 * Add a token signature to a user's token set for tracking
 * @param {string} userId - The user ID
 * @param {string} tokenSignature - The token signature to track
 * @param {number} ttlInSeconds - Time to live for the user token set (default: 24 hours)
 * @returns {Promise<void>}
 */
export async function addUserToken(userId, tokenSignature, ttlInSeconds = 86400) {
  if (!userId || !tokenSignature) {
    throw new Error('User ID and token signature are required');
  }
  
  const key = `user:tokens:${userId}`;
  
  try {
    // Add token signature to user's token set
    await redis.sadd(key, tokenSignature);
    
    // Refresh TTL for the user token set
    await redis.expire(key, ttlInSeconds);
  } catch (error) {
    console.error('Error adding user token:', error);
    throw error;
  }
}

/**
 * Get all token signatures for a user
 * @param {string} userId - The user ID
 * @returns {Promise<string[]>} - Array of token signatures
 */
export async function getUserTokens(userId) {
  if (!userId) {
    return [];
  }
  
  const key = `user:tokens:${userId}`;
  
  try {
    const tokens = await redis.smembers(key);
    return tokens || [];
  } catch (error) {
    console.error('Error getting user tokens:', error);
    return [];
  }
}

/**
 * Remove a token signature from a user's token set
 * @param {string} userId - The user ID
 * @param {string} tokenSignature - The token signature to remove
 * @returns {Promise<boolean>} - True if token was removed, false otherwise
 */
export async function removeUserToken(userId, tokenSignature) {
  if (!userId || !tokenSignature) {
    return false;
  }
  
  const key = `user:tokens:${userId}`;
  
  try {
    const result = await redis.srem(key, tokenSignature);
    return result > 0;
  } catch (error) {
    console.error('Error removing user token:', error);
    return false;
  }
}

/**
 * Blacklist all tokens for a specific user
 * @param {string} userId - The user ID
 * @param {number} ttlInSeconds - Time to live for blacklisted tokens
 * @returns {Promise<number>} - Number of tokens blacklisted
 */
export async function blacklistAllUserTokens(userId, ttlInSeconds) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    // Get all user tokens
    const tokenSignatures = await getUserTokens(userId);
    
    if (tokenSignatures.length === 0) {
      return 0;
    }
    
    // Blacklist each token
    const promises = tokenSignatures.map(signature => 
      addTokenToBlacklist(signature, ttlInSeconds)
    );
    
    await Promise.all(promises);
    
    // Clear the user's token set since all tokens are now blacklisted
    const userTokensKey = `user:tokens:${userId}`;
    await redis.del(userTokensKey);
    
    return tokenSignatures.length;
  } catch (error) {
    console.error('Error blacklisting all user tokens:', error);
    throw error;
  }
}

/**
 * Get blacklist statistics
 * @returns {Promise<object>} - Blacklist statistics object
 */
export async function getBlacklistStats() {
  const statsKey = 'blacklist:stats';
  
  try {
    const stats = await redis.hgetall(statsKey);
    
    // Get additional runtime statistics
    const [totalKeys, memoryUsage] = await Promise.all([
      getBlacklistTokenCount(),
      getRedisMemoryUsage()
    ]);
    
    return {
      totalBlacklistedTokens: parseInt(stats.total_tokens || '0'),
      tokensExpiringSoon: parseInt(stats.tokens_expiring_soon || '0'),
      lastCleanup: stats.last_cleanup || null,
      memoryUsage: memoryUsage,
      activeBlacklistKeys: totalKeys,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting blacklist statistics:', error);
    return {
      totalBlacklistedTokens: 0,
      tokensExpiringSoon: 0,
      lastCleanup: null,
      memoryUsage: 'unknown',
      activeBlacklistKeys: 0,
      lastUpdated: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Increment a blacklist statistic counter
 * @param {string} statName - The statistic name to increment
 * @param {number} increment - The amount to increment (default: 1)
 * @returns {Promise<void>}
 */
export async function incrementBlacklistStats(statName, increment = 1) {
  const statsKey = 'blacklist:stats';
  
  try {
    await redis.hincrby(statsKey, statName, increment);
    await redis.hset(statsKey, 'last_updated', new Date().toISOString());
  } catch (error) {
    console.error('Error incrementing blacklist stats:', error);
  }
}

/**
 * Decrement a blacklist statistic counter
 * @param {string} statName - The statistic name to decrement
 * @param {number} decrement - The amount to decrement (default: 1)
 * @returns {Promise<void>}
 */
export async function decrementBlacklistStats(statName, decrement = 1) {
  const statsKey = 'blacklist:stats';
  
  try {
    await redis.hincrby(statsKey, statName, -decrement);
    await redis.hset(statsKey, 'last_updated', new Date().toISOString());
  } catch (error) {
    console.error('Error decrementing blacklist stats:', error);
  }
}

/**
 * Get the count of active blacklist tokens
 * @returns {Promise<number>} - Number of active blacklist keys
 */
export async function getBlacklistTokenCount() {
  try {
    const keys = await redis.keys('blacklist:token:*');
    return keys.length;
  } catch (error) {
    console.error('Error getting blacklist token count:', error);
    return 0;
  }
}

/**
 * Get Redis memory usage information
 * @returns {Promise<string>} - Memory usage information
 */
export async function getRedisMemoryUsage() {
  try {
    const info = await redis.info('memory');
    const lines = info.split('\r\n');
    const memoryLine = lines.find(line => line.startsWith('used_memory_human:'));
    
    if (memoryLine) {
      return memoryLine.split(':')[1];
    }
    
    return 'unknown';
  } catch (error) {
    console.error('Error getting Redis memory usage:', error);
    return 'unknown';
  }
}

/**
 * Clean up expired blacklist entries (manual cleanup for monitoring)
 * @returns {Promise<object>} - Cleanup results
 */
export async function cleanupExpiredBlacklistEntries() {
  const startTime = Date.now();
  let cleanedCount = 0;
  let errorCount = 0;
  
  try {
    // Get all blacklist keys
    const keys = await redis.keys('blacklist:token:*');
    
    if (keys.length === 0) {
      return {
        cleanedCount: 0,
        errorCount: 0,
        duration: Date.now() - startTime,
        message: 'No blacklist entries found'
      };
    }
    
    // Check TTL for each key and remove expired ones
    for (const key of keys) {
      try {
        const ttl = await redis.ttl(key);
        
        // TTL of -2 means key doesn't exist, -1 means no expiry set
        if (ttl === -2) {
          cleanedCount++;
        } else if (ttl === -1) {
          // Key exists but has no expiry - this shouldn't happen in normal operation
          // We could optionally set a default TTL or log this as an anomaly
          console.warn(`Blacklist key without TTL found: ${key}`);
        }
      } catch (error) {
        console.error(`Error checking TTL for key ${key}:`, error);
        errorCount++;
      }
    }
    
    // Update cleanup statistics
    await redis.hset('blacklist:stats', {
      'last_cleanup': new Date().toISOString(),
      'last_cleanup_duration': Date.now() - startTime,
      'last_cleanup_cleaned': cleanedCount,
      'last_cleanup_errors': errorCount
    });
    
    return {
      cleanedCount,
      errorCount,
      duration: Date.now() - startTime,
      totalKeysChecked: keys.length,
      message: `Cleanup completed. ${cleanedCount} expired entries cleaned.`
    };
    
  } catch (error) {
    console.error('Error during blacklist cleanup:', error);
    return {
      cleanedCount,
      errorCount: errorCount + 1,
      duration: Date.now() - startTime,
      error: error.message,
      message: 'Cleanup failed with errors'
    };
  }
}

/**
 * Get tokens that are expiring soon (within specified minutes)
 * @param {number} withinMinutes - Check for tokens expiring within this many minutes (default: 60)
 * @returns {Promise<object[]>} - Array of token information objects
 */
export async function getTokensExpiringSoon(withinMinutes = 60) {
  const withinSeconds = withinMinutes * 60;
  const expiringSoon = [];
  
  try {
    const keys = await redis.keys('blacklist:token:*');
    
    for (const key of keys) {
      try {
        const ttl = await redis.ttl(key);
        
        if (ttl > 0 && ttl <= withinSeconds) {
          expiringSoon.push({
            key,
            tokenSignature: key.replace('blacklist:token:', ''),
            ttlSeconds: ttl,
            expiresAt: new Date(Date.now() + (ttl * 1000)).toISOString()
          });
        }
      } catch (error) {
        console.error(`Error checking TTL for key ${key}:`, error);
      }
    }
    
    // Update statistics
    await redis.hset('blacklist:stats', 'tokens_expiring_soon', expiringSoon.length);
    
    return expiringSoon;
    
  } catch (error) {
    console.error('Error getting tokens expiring soon:', error);
    return [];
  }
}

/**
 * Batch blacklist multiple token signatures
 * @param {string[]} tokenSignatures - Array of token signatures to blacklist
 * @param {number} ttlInSeconds - Time to live for all tokens
 * @returns {Promise<object>} - Batch operation results
 */
export async function batchBlacklistTokens(tokenSignatures, ttlInSeconds) {
  if (!Array.isArray(tokenSignatures) || tokenSignatures.length === 0) {
    return { success: 0, failed: 0, errors: [] };
  }
  
  const results = { success: 0, failed: 0, errors: [] };
  
  try {
    // Use Redis pipeline for better performance
    const pipeline = redis.pipeline();
    
    tokenSignatures.forEach(signature => {
      if (signature) {
        const key = `blacklist:token:${signature}`;
        pipeline.set(key, '1', 'EX', ttlInSeconds);
      }
    });
    
    const pipelineResults = await pipeline.exec();
    
    // Process results
    pipelineResults.forEach((result, index) => {
      if (result[0]) {
        // Error occurred
        results.failed++;
        results.errors.push({
          tokenSignature: tokenSignatures[index],
          error: result[0].message
        });
      } else {
        results.success++;
      }
    });
    
    // Update statistics
    if (results.success > 0) {
      await incrementBlacklistStats('total_tokens', results.success);
    }
    
    return results;
    
  } catch (error) {
    console.error('Error in batch blacklist operation:', error);
    return {
      success: 0,
      failed: tokenSignatures.length,
      errors: [{ error: error.message }]
    };
  }
} 

/**
 * Buffer user action to Redis for batch processing
 * @param {string} userId - The ID of the user
 * @param {string} action - The action performed
 * @param {string} targetTable - The target table
 * @param {string} targetId - The target record ID
 * @param {object} oldData - Previous data state
 * @param {object} newData - New data state
 * @param {object} metadata - Additional action metadata
 * @returns {Promise<void>}
 */
export async function bufferUserAction(userId, action, targetTable = null, targetId = null, oldData = null, newData = null, metadata = {}) {
  const actionData = {
    user_id: userId,
    action,
    target_table: targetTable,
    target_id: targetId,
    old_data: oldData,
    new_data: newData,
    metadata,
    occurred_at: new Date().toISOString()
  };
  
  try {
    // Push to Redis list for batch processing
    await redis.lpush('pending_user_actions', JSON.stringify(actionData));
    
    // Optionally cap the list size to prevent memory issues
    await redis.ltrim('pending_user_actions', 0, 9999);
  } catch (error) {
    console.error('Error buffering user action to Redis:', error);
    // Fallback: If Redis fails, we could immediately write to DB or log the error
  }
}

/**
 * Process pending user actions in batch
 * @param {number} batchSize - Number of actions to process in one batch (default: 100)
 * @returns {Promise<number>} - Number of actions processed
 */
export async function processPendingUserActions(batchSize = 100) {
  let processed = 0;
  const actions = [];

  try {
    // Pull multiple items at once using multi-exec
    const multi = redis.multi();

    // Get batch size items from the right of the list
    for (let i = 0; i < batchSize; i++) {
      multi.rpop('pending_user_actions');
    }

    const results = await multi.exec();

    // Filter out null results and parse JSON
    for (const [err, result] of results) {
      if (err) {
        console.error('Error popping action from Redis:', err);
        continue;
      }

      if (result) {
        try {
          const action = JSON.parse(result);
          actions.push(action);
          processed++;
        } catch (parseError) {
          console.error('Error parsing action JSON:', parseError);
        }
      }
    }

    // If we have actions to process, batch insert them
    if (actions.length > 0 && supabase) {
      // Insert into action_log table using Supabase
      const { error } = await supabase
        .from('action_log')
        .insert(actions);

      if (error) {
        console.error('Error inserting actions into database:', error);

        // In case of error, we could push the actions back to Redis
        const failedBatch = actions.map(action => JSON.stringify(action));
        if (failedBatch.length > 0) {
          await redis.lpush('pending_user_actions', ...failedBatch);
        }
      } else {
        console.log(`Successfully inserted ${actions.length} user actions into database`);
      }
    }

    return processed;
  } catch (error) {
    console.error('Error batch processing user actions:', error);
    return processed;
  }
}

// ============================================================================
// COMMENT CACHING UTILITIES
// ============================================================================

/**
 * Cache comment count for a post
 * @param {string} postId - The post ID
 * @param {number} count - The comment count
 * @param {number} ttlInSeconds - Time to live in seconds (default: 1 hour)
 * @returns {Promise<void>}
 */
export async function cachePostCommentCount(postId, count, ttlInSeconds = 3600) {
  const key = `post:${postId}:comment_count`;

  try {
    await redis.set(key, count.toString());
    await redis.expire(key, ttlInSeconds);
  } catch (error) {
    console.error('Error caching post comment count:', error);
  }
}

/**
 * Get cached comment count for a post
 * @param {string} postId - The post ID
 * @returns {Promise<number|null>} - The cached comment count or null if not found
 */
export async function getCachedPostCommentCount(postId) {
  const key = `post:${postId}:comment_count`;

  try {
    const count = await redis.get(key);
    return count ? parseInt(count, 10) : null;
  } catch (error) {
    console.error('Error getting cached post comment count:', error);
    return null;
  }
}

/**
 * Increment comment count in cache
 * @param {string} postId - The post ID
 * @returns {Promise<number>} - The new comment count
 */
export async function incrementCachedCommentCount(postId) {
  const key = `post:${postId}:comment_count`;

  try {
    const newCount = await redis.incr(key);
    // Reset TTL when incrementing
    await redis.expire(key, 3600);
    return newCount;
  } catch (error) {
    console.error('Error incrementing cached comment count:', error);
    return 0;
  }
}

/**
 * Decrement comment count in cache
 * @param {string} postId - The post ID
 * @returns {Promise<number>} - The new comment count
 */
export async function decrementCachedCommentCount(postId) {
  const key = `post:${postId}:comment_count`;

  try {
    const newCount = await redis.decr(key);
    // Ensure count doesn't go below 0
    if (newCount < 0) {
      await redis.set(key, '0');
      return 0;
    }
    // Reset TTL when decrementing
    await redis.expire(key, 3600);
    return newCount;
  } catch (error) {
    console.error('Error decrementing cached comment count:', error);
    return 0;
  }
}

/**
 * Cache hot comments for a post
 * @param {string} postId - The post ID
 * @param {object[]} comments - Array of comment objects
 * @param {number} ttlInSeconds - Time to live in seconds (default: 30 minutes)
 * @returns {Promise<void>}
 */
export async function cachePostHotComments(postId, comments, ttlInSeconds = 1800) {
  const key = `post:${postId}:hot_comments`;

  try {
    await redis.set(key, JSON.stringify(comments));
    await redis.expire(key, ttlInSeconds);
  } catch (error) {
    console.error('Error caching post hot comments:', error);
  }
}

/**
 * Get cached hot comments for a post
 * @param {string} postId - The post ID
 * @returns {Promise<object[]|null>} - Array of comment objects or null if not found
 */
export async function getCachedPostHotComments(postId) {
  const key = `post:${postId}:hot_comments`;

  try {
    const commentsData = await redis.get(key);
    return commentsData ? JSON.parse(commentsData) : null;
  } catch (error) {
    console.error('Error getting cached post hot comments:', error);
    return null;
  }
}

/**
 * Buffer comment operation to Redis for batch processing
 * @param {string} userId - The user ID
 * @param {string} postId - The post ID
 * @param {string} commentId - The comment ID
 * @param {string} action - The action ('create', 'update', 'delete')
 * @param {object} commentData - The comment data
 * @returns {Promise<void>}
 */
export async function bufferCommentOperation(userId, postId, commentId, action, commentData = {}) {
  const operationData = {
    user_id: userId,
    post_id: postId,
    comment_id: commentId,
    action,
    comment_data: commentData,
    timestamp: Date.now()
  };

  try {
    // Add to pending operations list
    await redis.lpush('pending_comment_operations', JSON.stringify(operationData));

    // Cap the list size to prevent memory issues
    await redis.ltrim('pending_comment_operations', 0, 9999);

    // Update real-time counters
    if (action === 'create') {
      await incrementCachedCommentCount(postId);
    } else if (action === 'delete') {
      await decrementCachedCommentCount(postId);
    }
  } catch (error) {
    console.error('Error buffering comment operation:', error);
  }
}

/**
 * Process pending comment operations in batch
 * @param {number} batchSize - Number of operations to process in one batch (default: 100)
 * @returns {Promise<number>} - Number of operations processed
 */
export async function processPendingCommentOperations(batchSize = 100) {
  let processed = 0;
  const operations = [];

  try {
    // Pull multiple items at once
    const multi = redis.multi();

    for (let i = 0; i < batchSize; i++) {
      multi.rpop('pending_comment_operations');
    }

    const results = await multi.exec();

    // Filter out null results and parse JSON
    if (results && Array.isArray(results)) {
      for (const [err, result] of results) {
      if (err) {
        console.error('Error popping comment operation from Redis:', err);
        continue;
      }

      if (result) {
        try {
          const operation = JSON.parse(result);
          operations.push(operation);
          processed++;
        } catch (parseError) {
          console.error('Error parsing comment operation JSON:', parseError);
        }
      }
    }
    }

    // Process operations and sync with database
    if (operations.length > 0 && supabase) {
      const postUpdates = new Map();

      // Group operations by post to batch update comment counts
      for (const operation of operations) {
        const { post_id, action } = operation;

        if (!postUpdates.has(post_id)) {
          postUpdates.set(post_id, { creates: 0, deletes: 0 });
        }

        const counts = postUpdates.get(post_id);
        if (action === 'create') {
          counts.creates++;
        } else if (action === 'delete') {
          counts.deletes++;
        }
      }

      // Update comment counts in database
      for (const [postId, counts] of postUpdates) {
        const netChange = counts.creates - counts.deletes;

        if (netChange !== 0) {
          try {
            // Get current count from database
            const { data: post, error: fetchError } = await supabase
              .from('posts')
              .select('comment_count')
              .eq('id', postId)
              .single();

            if (!fetchError && post) {
              const newCount = Math.max(0, (post.comment_count || 0) + netChange);

              const { error: updateError } = await supabase
                .from('posts')
                .update({ comment_count: newCount })
                .eq('id', postId);

              if (updateError) {
                console.error(`Error updating comment count for post ${postId}:`, updateError);
              } else {
                console.log(`Updated comment count for post ${postId}: ${newCount}`);
              }
            }
          } catch (error) {
            console.error(`Error processing comment count update for post ${postId}:`, error);
          }
        }
      }
    }

    return processed;
  } catch (error) {
    console.error('Error batch processing comment operations:', error);
    return processed;
  }
}

// ============================================================================
// LIKE CACHING UTILITIES
// ============================================================================

/**
 * Cache like count for a post
 * @param {string} postId - The post ID
 * @param {number} count - The like count
 * @param {number} ttlInSeconds - Time to live in seconds (default: 1 hour)
 * @returns {Promise<void>}
 */
export async function cachePostLikeCount(postId, count, ttlInSeconds = 3600) {
  const key = `post:${postId}:like_count`;

  try {
    await redis.set(key, count.toString());
    await redis.expire(key, ttlInSeconds);
  } catch (error) {
    console.error('Error caching post like count:', error);
  }
}

/**
 * Get cached like count for a post
 * @param {string} postId - The post ID
 * @returns {Promise<number|null>} - The cached like count or null if not found
 */
export async function getCachedPostLikeCount(postId) {
  const key = `post:${postId}:like_count`;

  try {
    const count = await redis.get(key);
    return count ? parseInt(count, 10) : null;
  } catch (error) {
    console.error('Error getting cached post like count:', error);
    return null;
  }
}

/**
 * Increment like count in cache
 * @param {string} postId - The post ID
 * @returns {Promise<number>} - The new like count
 */
export async function incrementCachedLikeCount(postId) {
  const key = `post:${postId}:like_count`;

  try {
    const newCount = await redis.incr(key);
    // Reset TTL when incrementing
    await redis.expire(key, 3600);
    return newCount;
  } catch (error) {
    console.error('Error incrementing cached like count:', error);
    return 0;
  }
}

/**
 * Decrement like count in cache
 * @param {string} postId - The post ID
 * @returns {Promise<number>} - The new like count
 */
export async function decrementCachedLikeCount(postId) {
  const key = `post:${postId}:like_count`;

  try {
    const newCount = await redis.decr(key);
    // Ensure count doesn't go below 0
    if (newCount < 0) {
      await redis.set(key, '0');
      return 0;
    }
    // Reset TTL when decrementing
    await redis.expire(key, 3600);
    return newCount;
  } catch (error) {
    console.error('Error decrementing cached like count:', error);
    return 0;
  }
}

/**
 * Buffer like operation to Redis for batch processing
 * @param {string} userId - The user ID
 * @param {string} postId - The post ID
 * @param {string} action - The action ('like', 'unlike')
 * @returns {Promise<void>}
 */
export async function bufferLikeOperation(userId, postId, action) {
  const operationData = {
    user_id: userId,
    post_id: postId,
    action,
    timestamp: Date.now()
  };

  try {
    // Add to pending operations list
    await redis.lpush('pending_like_operations', JSON.stringify(operationData));

    // Cap the list size to prevent memory issues
    await redis.ltrim('pending_like_operations', 0, 9999);

    // Update real-time counters
    if (action === 'like') {
      await incrementCachedLikeCount(postId);
    } else if (action === 'unlike') {
      await decrementCachedLikeCount(postId);
    }
  } catch (error) {
    console.error('Error buffering like operation:', error);
  }
}

/**
 * Cache comment vote counts
 * @param {string} commentId - The comment ID
 * @param {number} likeCount - The like count
 * @param {number} dislikeCount - The dislike count
 * @param {number} ttlInSeconds - Time to live in seconds (default: 1 hour)
 * @returns {Promise<void>}
 */
export async function cacheCommentVoteCounts(commentId, likeCount, dislikeCount, ttlInSeconds = 3600) {
  const likeKey = `comment:${commentId}:like_count`;
  const dislikeKey = `comment:${commentId}:dislike_count`;

  try {
    await Promise.all([
      redis.set(likeKey, likeCount.toString()),
      redis.set(dislikeKey, dislikeCount.toString()),
      redis.expire(likeKey, ttlInSeconds),
      redis.expire(dislikeKey, ttlInSeconds)
    ]);
  } catch (error) {
    console.error('Error caching comment vote counts:', error);
  }
}

/**
 * Get cached comment vote counts
 * @param {string} commentId - The comment ID
 * @returns {Promise<{likeCount: number|null, dislikeCount: number|null}>}
 */
export async function getCachedCommentVoteCounts(commentId) {
  const likeKey = `comment:${commentId}:like_count`;
  const dislikeKey = `comment:${commentId}:dislike_count`;

  try {
    const [likeCount, dislikeCount] = await Promise.all([
      redis.get(likeKey),
      redis.get(dislikeKey)
    ]);

    return {
      likeCount: likeCount !== null ? parseInt(likeCount, 10) : null,
      dislikeCount: dislikeCount !== null ? parseInt(dislikeCount, 10) : null
    };
  } catch (error) {
    console.error('Error getting cached comment vote counts:', error);
    return { likeCount: null, dislikeCount: null };
  }
}

/**
 * Get user's vote status for a comment
 * @param {string} userId - The user ID
 * @param {string} commentId - The comment ID
 * @returns {Promise<string|null>} - The vote type ('like', 'dislike') or null
 */
export async function getUserCommentVoteStatus(userId, commentId) {
  const userVoteKey = `comment_vote:${commentId}:${userId}`;

  try {
    const voteType = await redis.get(userVoteKey);
    return voteType;
  } catch (error) {
    console.error('Error getting user comment vote status:', error);
    return null;
  }
}

/**
 * Increment comment like count in cache
 * @param {string} commentId - The comment ID
 * @returns {Promise<number>} - The new like count
 */
export async function incrementCachedCommentLikeCount(commentId) {
  const key = `comment:${commentId}:like_count`;

  try {
    const newCount = await redis.incr(key);
    // Reset TTL when incrementing
    await redis.expire(key, 3600);
    return newCount;
  } catch (error) {
    console.error('Error incrementing cached comment like count:', error);
    return 0;
  }
}

/**
 * Increment comment dislike count in cache
 * @param {string} commentId - The comment ID
 * @returns {Promise<number>} - The new dislike count
 */
export async function incrementCachedCommentDislikeCount(commentId) {
  const key = `comment:${commentId}:dislike_count`;

  try {
    const newCount = await redis.incr(key);
    // Reset TTL when incrementing
    await redis.expire(key, 3600);
    return newCount;
  } catch (error) {
    console.error('Error incrementing cached comment dislike count:', error);
    return 0;
  }
}

/**
 * Decrement comment like count in cache
 * @param {string} commentId - The comment ID
 * @returns {Promise<number>} - The new like count
 */
export async function decrementCachedCommentLikeCount(commentId) {
  const key = `comment:${commentId}:like_count`;

  try {
    const newCount = await redis.decr(key);
    // Ensure count doesn't go below 0
    if (newCount < 0) {
      await redis.set(key, 0);
      return 0;
    }
    // Reset TTL when decrementing
    await redis.expire(key, 3600);
    return newCount;
  } catch (error) {
    console.error('Error decrementing cached comment like count:', error);
    return 0;
  }
}

/**
 * Decrement comment dislike count in cache
 * @param {string} commentId - The comment ID
 * @returns {Promise<number>} - The new dislike count
 */
export async function decrementCachedCommentDislikeCount(commentId) {
  const key = `comment:${commentId}:dislike_count`;

  try {
    const newCount = await redis.decr(key);
    // Ensure count doesn't go below 0
    if (newCount < 0) {
      await redis.set(key, 0);
      return 0;
    }
    // Reset TTL when decrementing
    await redis.expire(key, 3600);
    return newCount;
  } catch (error) {
    console.error('Error decrementing cached comment dislike count:', error);
    return 0;
  }
}

/**
 * Buffer a comment vote operation for later processing
 * @param {string} userId - The user ID
 * @param {string} commentId - The comment ID
 * @param {string} action - The action ('like', 'dislike', 'remove')
 * @returns {Promise<{success: boolean, action: string, previousVote?: string}>}
 */
export async function bufferCommentVoteOperation(userId, commentId, action) {
  const userVoteKey = `comment_vote:${commentId}:${userId}`;

  try {
    // Check current user vote status
    const currentVote = await redis.get(userVoteKey);

    // If user is trying to vote the same way they already voted, ignore it
    if (currentVote === action) {
      console.log(`[bufferCommentVoteOperation] User ${userId} already voted ${action} on comment ${commentId}`);
      return { success: false, action: 'duplicate', previousVote: currentVote };
    }

    const operationData = {
      user_id: userId,
      comment_id: commentId,
      action,
      previous_vote: currentVote,
      timestamp: Date.now()
    };

    // Add to pending operations list
    await redis.lpush('pending_comment_vote_operations', JSON.stringify(operationData));

    // Cap the list size to prevent memory issues
    await redis.ltrim('pending_comment_vote_operations', 0, 9999);

    // Update user vote status in cache
    if (action === 'remove') {
      await redis.del(userVoteKey);
    } else {
      await redis.setex(userVoteKey, 86400 * 30, action); // Expire in 30 days
    }

    // Update real-time counters
    if (currentVote === 'like') {
      await decrementCachedCommentLikeCount(commentId);
    } else if (currentVote === 'dislike') {
      await decrementCachedCommentDislikeCount(commentId);
    }

    if (action === 'like') {
      await incrementCachedCommentLikeCount(commentId);
    } else if (action === 'dislike') {
      await incrementCachedCommentDislikeCount(commentId);
    }

    console.log(`[bufferCommentVoteOperation] Buffered ${action} for comment ${commentId} by user ${userId}, previous: ${currentVote || 'none'}`);
    return { success: true, action, previousVote: currentVote };
  } catch (error) {
    console.error('Error buffering comment vote operation:', error);
    throw error;
  }
}

/**
 * Process pending like operations in batch
 * @param {number} batchSize - Number of operations to process in one batch (default: 100)
 * @returns {Promise<number>} - Number of operations processed
 */
export async function processPendingLikeOperations(batchSize = 100) {
  let processed = 0;
  const operations = [];

  try {
    // Pull multiple items at once
    const multi = redis.multi();

    for (let i = 0; i < batchSize; i++) {
      multi.rpop('pending_like_operations');
    }

    const results = await multi.exec();

    // Filter out null results and parse JSON
    if (results && Array.isArray(results)) {
      for (const [err, result] of results) {
      if (err) {
        console.error('Error popping like operation from Redis:', err);
        continue;
      }

      if (result) {
        try {
          const operation = JSON.parse(result);
          operations.push(operation);
          processed++;
        } catch (parseError) {
          console.error('Error parsing like operation JSON:', parseError);
        }
      }
    }
    }

    // Process operations and sync with database
    if (operations.length > 0 && supabase) {
      const postUpdates = new Map();
      const voteOperations = [];

      // Group operations by post to batch update like counts
      for (const operation of operations) {
        const { user_id, post_id, action } = operation;

        if (!postUpdates.has(post_id)) {
          postUpdates.set(post_id, { likes: 0, unlikes: 0 });
        }

        const counts = postUpdates.get(post_id);
        if (action === 'like') {
          counts.likes++;
          voteOperations.push({
            user_id,
            post_id,
            vote_type: 'like',
            created_at: new Date().toISOString()
          });
        } else if (action === 'unlike') {
          counts.unlikes++;
          // For unlikes, we'll need to delete the vote record
          voteOperations.push({
            user_id,
            post_id,
            action: 'delete'
          });
        }
      }

      // Process vote operations
      for (const voteOp of voteOperations) {
        try {
          if (voteOp.action === 'delete') {
            await supabase
              .from('votes')
              .delete()
              .eq('user_id', voteOp.user_id)
              .eq('post_id', voteOp.post_id);
          } else {
            await supabase
              .from('votes')
              .upsert(voteOp, { onConflict: 'user_id,post_id' });
          }
        } catch (error) {
          console.error('Error processing vote operation:', error);
        }
      }

      // Update like counts in database
      for (const [postId, counts] of postUpdates) {
        const netChange = counts.likes - counts.unlikes;

        if (netChange !== 0) {
          try {
            // Get current count from database
            const { data: post, error: fetchError } = await supabase
              .from('posts')
              .select('like_count')
              .eq('id', postId)
              .single();

            if (!fetchError && post) {
              const newCount = Math.max(0, (post.like_count || 0) + netChange);

              const { error: updateError } = await supabase
                .from('posts')
                .update({ like_count: newCount })
                .eq('id', postId);

              if (updateError) {
                console.error(`Error updating like count for post ${postId}:`, updateError);
              } else {
                console.log(`Updated like count for post ${postId}: ${newCount}`);
              }
            }
          } catch (error) {
            console.error(`Error processing like count update for post ${postId}:`, error);
          }
        }
      }
    }

    return processed;
  } catch (error) {
    console.error('Error batch processing like operations:', error);
    return processed;
  }
}

/**
 * Process pending comment vote operations from Redis
 * @returns {Promise<number>} Number of operations processed
 */
export async function processPendingCommentVoteOperations() {
  let processed = 0;

  try {
    // Get all pending operations (up to 100 at a time)
    const results = await redis.multi()
      .lrange('pending_comment_vote_operations', 0, 99)
      .ltrim('pending_comment_vote_operations', 100, -1)
      .exec();

    if (!results || !Array.isArray(results) || results.length < 2) {
      return processed;
    }

    const operations = results[0][1]; // First command result

    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return processed;
    }

    console.log(`[processPendingCommentVoteOperations] Processing ${operations.length} comment vote operations`);

    // Group operations by comment and user
    const groupedOps = {};

    for (const opStr of operations) {
      try {
        const op = JSON.parse(opStr);
        const key = `${op.user_id}:${op.comment_id}`;

        if (!groupedOps[key]) {
          groupedOps[key] = [];
        }
        groupedOps[key].push(op);
      } catch (parseError) {
        console.error('Error parsing comment vote operation:', parseError);
      }
    }

    // Process each group
    for (const [key, ops] of Object.entries(groupedOps)) {
      try {
        // Get the latest operation for this user-comment pair
        const latestOp = ops.sort((a, b) => b.timestamp - a.timestamp)[0];

        await processCommentVoteOperation(latestOp);
        processed++;
      } catch (error) {
        console.error(`Error processing comment vote operations for ${key}:`, error);
      }
    }

    console.log(`[processPendingCommentVoteOperations] Successfully processed ${processed} comment vote operations`);

  } catch (error) {
    console.error('Error batch processing comment vote operations:', error);
  }

  return processed;
}

/**
 * Process a single comment vote operation
 * @param {Object} operation - The vote operation
 */
async function processCommentVoteOperation(operation) {
  const { user_id, comment_id, action } = operation;

  try {
    const supabase = createServerSupabaseClient(true); // Use service role

    // Check if vote already exists
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id, vote_type')
      .eq('user_id', user_id)
      .eq('comment_id', comment_id)
      .maybeSingle();

    if (action === 'remove') {
      // Remove vote if it exists
      if (existingVote) {
        await supabase
          .from('votes')
          .delete()
          .eq('id', existingVote.id);
      }
    } else {
      // Create or update vote
      if (existingVote) {
        // Update existing vote
        await supabase
          .from('votes')
          .update({
            vote_type: action,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingVote.id);
      } else {
        // Create new vote
        await supabase
          .from('votes')
          .insert({
            user_id,
            comment_id,
            vote_type: action,
            created_by: user_id
          });
      }
    }

    console.log(`[processCommentVoteOperation] Processed ${action} vote for comment ${comment_id} by user ${user_id}`);

  } catch (error) {
    console.error(`Error processing comment vote operation:`, error);
    throw error;
  }
}