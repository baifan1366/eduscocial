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
  const key = 'online_users';
  
  if (isOnline) {
    // Add user to online set with current timestamp
    await redis.hset(key, userId, Date.now());
  } else {
    // Remove user from online set
    await redis.hdel(key, userId);
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
  const sessionKey = `user:${userId}:session`;
  const sessionData = await redis.hgetall(sessionKey);
  
  // Update last active timestamp if session exists
  if (Object.keys(sessionData).length > 0) {
    await updateUserOnlineStatus(userId, true);
    return sessionData;
  }
  
  return null;
}

/**
 * Remove user session from Redis
 * @param {string} userId - The ID of the user
 * @returns {Promise<void>}
 */
export async function removeUserSession(userId) {
  const sessionKey = `user:${userId}:session`;
  
  // Remove session data
  await redis.del(sessionKey);
  
  // Update online status
  await updateUserOnlineStatus(userId, false);
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