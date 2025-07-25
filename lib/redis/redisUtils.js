import redis from './redis';

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
 * Buffer like/dislike operations to reduce database writes
 * @param {string} userId - The ID of the user
 * @param {string} postId - The ID of the post
 * @param {boolean} isLike - Whether this is a like (true) or dislike (false)
 * @returns {Promise<void>}
 */
export async function bufferLikeOperation(userId, postId, isLike) {
  const key = `post:${postId}:${isLike ? 'likes' : 'dislikes'}`;
  const userKey = `user:${userId}:liked:${postId}`;
  
  // Store the like operation with a timestamp
  const timestamp = Date.now();
  await redis.hset(userKey, {
    type: isLike ? 'like' : 'dislike',
    timestamp
  });
  
  // Add user to the set of users who liked/disliked the post
  await redis.sadd(key, userId);
  
  // Optional: Add to a list for batch processing
  await redis.lpush('pending_like_operations', JSON.stringify({
    userId,
    postId,
    isLike,
    timestamp
  }));
}

/**
 * Process pending like operations in batch
 * @param {number} batchSize - Number of operations to process in one batch
 * @returns {Promise<number>} - Number of operations processed
 */
export async function processPendingLikeOperations(batchSize = 100) {
  let processed = 0;
  
  for (let i = 0; i < batchSize; i++) {
    const operation = await redis.rpop('pending_like_operations');
    if (!operation) break;
    
    const { userId, postId, isLike, timestamp } = JSON.parse(operation);
    
    // This would typically update the database with Supabase
    // await supabase
    //   .from('votes')
    //   .upsert({ 
    //     user_id: userId, 
    //     post_id: postId, 
    //     vote_type: isLike ? 'like' : 'dislike',
    //     created_at: new Date().toISOString(),
    //     updated_at: new Date().toISOString()
    //   }, { 
    //     onConflict: 'user_id,post_id' 
    //   });
    
    processed++;
  }
  
  return processed;
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
 * Store provider tokens in Redis
 * @param {string} userId - The ID of the user
 * @param {string} provider - The authentication provider (google, github, etc)
 * @param {object} tokens - The tokens to store (access_token, refresh_token, etc)
 * @returns {Promise<void>}
 */
export async function storeProviderTokens(userId, provider, tokens) {
  const tokenKey = `user:${userId}:tokens:${provider}`;
  
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