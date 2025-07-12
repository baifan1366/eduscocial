import { Redis } from '@upstash/redis'

/**
 * Redis client instance from Upstash
 * Uses environment variables for configuration:
 * - UPSTASH_REDIS_REST_URL: The REST URL for Upstash Redis
 * - UPSTASH_REDIS_REST_TOKEN: The authentication token for Upstash Redis
 */
const redis = Redis.fromEnv()

/**
 * Example usage:
 * ```js
 * await redis.set("key", "value");
 * const value = await redis.get("key");
 * ```
 */

export default redis 