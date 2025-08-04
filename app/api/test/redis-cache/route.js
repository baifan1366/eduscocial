import { NextResponse } from 'next/server';
import redis from '@/lib/redis/redis';

/**
 * GET handler for checking Redis cache status
 * This is for development/testing purposes only
 */
export async function GET() {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        error: 'Cache inspection not allowed in production' 
      }, { status: 403 });
    }

    const cacheData = {
      pendingLikeOperations: [],
      likeCountCaches: {},
      timestamp: new Date().toISOString()
    };

    // Get pending like operations
    try {
      const pendingOps = await redis.lrange('pending_like_operations', 0, -1);
      cacheData.pendingLikeOperations = pendingOps.map(op => {
        try {
          return JSON.parse(op);
        } catch (e) {
          return { raw: op, parseError: e.message };
        }
      });
    } catch (error) {
      cacheData.pendingLikeOperationsError = error.message;
    }

    // Get some sample like count caches
    const testPostIds = ['test-post-123', '1', '2', '3'];
    for (const postId of testPostIds) {
      try {
        const count = await redis.get(`post:${postId}:like_count`);
        if (count !== null) {
          cacheData.likeCountCaches[postId] = parseInt(count);
        }
      } catch (error) {
        cacheData.likeCountCaches[`${postId}_error`] = error.message;
      }
    }

    return NextResponse.json({
      success: true,
      cache: cacheData
    });

  } catch (error) {
    console.error('[GET /api/test/redis-cache] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
