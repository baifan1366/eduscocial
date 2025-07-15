import { Redis } from '@upstash/redis'

/**
 * Redis client instance from Upstash
 * Uses environment variables for configuration:
 * - UPSTASH_REDIS_REST_URL: The REST URL for Upstash Redis
 * - UPSTASH_REDIS_REST_TOKEN: The authentication token for Upstash Redis
 */
let redis;

try {
  // Check if we have the required environment variables
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('Redis environment variables are missing. Using a mock Redis client.');
    // Create a mock Redis client to prevent errors
    redis = {
      get: async () => null,
      set: async () => null,
      hgetall: async () => ({}),
      hset: async () => null,
      expire: async () => null,
      incr: async () => 0,
      sadd: async () => null,
      lpush: async () => null,
      rpop: async () => null,
      hdel: async () => null,
      del: async () => null,
      exists: async () => 0,
      pipeline: () => ({
        exec: async () => []
      })
    };
  } else {
    // Initialize Redis with proper URL
    redis = Redis.fromEnv();
  }
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
  // Provide a fallback mock implementation
  redis = {
    get: async () => null,
    set: async () => null,
    hgetall: async () => ({}),
    hset: async () => null,
    expire: async () => null,
    incr: async () => 0,
    sadd: async () => null,
    lpush: async () => null,
    rpop: async () => null,
    hdel: async () => null,
    del: async () => null,
    exists: async () => 0,
    pipeline: () => ({
      exec: async () => []
    })
  };
}

/**
 * Example usage:
 * ```js
 * await redis.set("key", "value");
 * const value = await redis.get("key");
 * ```
 */

export default redis 