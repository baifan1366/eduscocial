import { Redis } from '@upstash/redis'

/**
 * Redis client instance from Upstash
 * Uses environment variables for configuration:
 * - UPSTASH_REDIS_REST_URL: The REST URL for Upstash Redis
 * - UPSTASH_REDIS_REST_TOKEN: The authentication token for Upstash Redis
 */
let redis = null;

try {
  // Use environment variables if available
  const url = process.env.UPSTASH_REDIS_REST_URL || 'https://adjusted-beetle-21820.upstash.io';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || 'AVU8AAIjcDFmNjE5MDIzZDQ0OGI0MDIwYTg4MmFmY2I2YWYyY2YzZnAxMA';

  redis = new Redis({ url, token });
  
  // Test connection
  setTimeout(async () => {
    try {
      await redis.ping();
      console.log('Redis connection successful');
    } catch (error) {
      console.error('Redis connection test failed:', error);
    }
  }, 1000);
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
  
  // Create a mock client for development mode
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Creating mock Redis client for development');
    const mockStorage = new Map();
    
    redis = {
      set: async (key, value, ...args) => {
        if (args.includes('EX')) {
          // Handle expiration in mock (simplified)
          const ttlIndex = args.indexOf('EX') + 1;
          // We just store the value without actually implementing TTL
        }
        mockStorage.set(key, value);
        return 'OK';
      },
      get: async (key) => mockStorage.get(key),
      hset: async (key, field, value) => {
        const hash = mockStorage.get(key) || {};
        hash[field] = value;
        mockStorage.set(key, hash);
        return 'OK';
      },
      hget: async (key, field) => {
        const hash = mockStorage.get(key);
        return hash ? hash[field] : null;
      },
      hgetall: async (key) => mockStorage.get(key) || {},
      del: async (key) => {
        return mockStorage.delete(key) ? 1 : 0;
      },
      lpush: async (key, ...values) => {
        const list = mockStorage.get(key) || [];
        list.unshift(...values);
        mockStorage.set(key, list);
        return list.length;
      },
      rpop: async (key) => {
        const list = mockStorage.get(key) || [];
        return list.length > 0 ? list.pop() : null;
      },
      ltrim: async (key, start, stop) => {
        const list = mockStorage.get(key) || [];
        mockStorage.set(key, list.slice(start, stop + 1));
        return 'OK';
      },
      exists: async (key) => mockStorage.has(key) ? 1 : 0,
      expire: async () => 1, // Always succeed but do nothing
      incr: async (key) => {
        const val = parseInt(mockStorage.get(key) || '0');
        mockStorage.set(key, (val + 1).toString());
        return val + 1;
      },
      multi: () => {
        const commands = [];
        return {
          lpush: (key, ...values) => {
            commands.push({ cmd: 'lpush', key, values });
            return this;
          },
          rpop: (key) => {
            commands.push({ cmd: 'rpop', key });
            return this;
          },
          exec: async () => {
            return commands.map(cmd => {
              try {
                return [null, null]; // Mock success with null result
              } catch (err) {
                return [err, null];
              }
            });
          }
        };
      },
      ping: async () => 'PONG'
    };
  }
}

/**
 * Example usage:
 * ```js
 * await redis.set("key", "value");
 * const value = await redis.get("key");
 * ```
 */

export default redis 