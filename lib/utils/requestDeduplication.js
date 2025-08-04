/**
 * Request deduplication utility to prevent duplicate API calls
 * This helps reduce server load when multiple components request the same data
 */

class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  /**
   * Get or create a deduplicated request
   * @param {string} key - Unique key for the request
   * @param {Function} requestFn - Function that returns a Promise
   * @param {number} cacheTime - Cache time in milliseconds (optional)
   * @returns {Promise} The request promise
   */
  async getOrCreate(key, requestFn, cacheTime = this.cacheTimeout) {
    // Check if we have a cached result
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      console.log(`[RequestDeduplicator] Returning cached result for key: ${key}`);
      return cached.data;
    }

    // Check if there's already a pending request for this key
    if (this.pendingRequests.has(key)) {
      console.log(`[RequestDeduplicator] Joining existing request for key: ${key}`);
      return this.pendingRequests.get(key);
    }

    // Create new request
    console.log(`[RequestDeduplicator] Creating new request for key: ${key}`);
    const promise = requestFn()
      .then(result => {
        // Cache the result
        this.cache.set(key, {
          data: result,
          timestamp: Date.now()
        });
        
        // Remove from pending requests
        this.pendingRequests.delete(key);
        
        return result;
      })
      .catch(error => {
        // Remove from pending requests on error
        this.pendingRequests.delete(key);
        throw error;
      });

    // Store the pending request
    this.pendingRequests.set(key, promise);
    
    return promise;
  }

  /**
   * Clear cache for a specific key
   * @param {string} key - The key to clear
   */
  clearCache(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.cache.clear();
  }

  /**
   * Get cache stats
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      cacheKeys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clean up expired cache entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }
}

// Global instance
const requestDeduplicator = new RequestDeduplicator();

// Clean up expired cache entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    requestDeduplicator.cleanup();
  }, 5 * 60 * 1000);
}

export default requestDeduplicator;

/**
 * Helper function for hot comments requests
 * @param {Array} postIds - Array of post IDs
 * @returns {Promise} Request promise
 */
export const getHotCommentsBatch = (postIds) => {
  const key = `hot-comments-batch-${postIds.sort().join(',')}`;
  
  return requestDeduplicator.getOrCreate(
    key,
    async () => {
      const response = await fetch('/api/posts/batch-hot-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postIds }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    60000 // 1 minute cache for hot comments
  );
};

/**
 * Helper function for cached counts requests
 * @param {Array} postIds - Array of post IDs
 * @returns {Promise} Request promise
 */
export const getCachedCountsBatch = (postIds) => {
  const key = `cached-counts-batch-${postIds.sort().join(',')}`;
  
  return requestDeduplicator.getOrCreate(
    key,
    async () => {
      const response = await fetch('/api/posts/cached-counts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postIds }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    30000 // 30 seconds cache for counts
  );
};
