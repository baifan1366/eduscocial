import { Redis } from '@upstash/redis'

/**
 * Redis client instance from Upstash
 * Uses environment variables for configuration:
 * - UPSTASH_REDIS_REST_URL: The REST URL for Upstash Redis
 * - UPSTASH_REDIS_REST_TOKEN: The authentication token for Upstash Redis
 */
const redis = new Redis({
    url: 'https://adjusted-beetle-21820.upstash.io',
    token: 'AVU8AAIjcDFmNjE5MDIzZDQ0OGI0MDIwYTg4MmFmY2I2YWYyY2YzZnAxMA',
  })

/**
 * Example usage:
 * ```js
 * await redis.set("key", "value");
 * const value = await redis.get("key");
 * ```
 */

export default redis 