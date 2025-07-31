import { NextResponse } from 'next/server';
import redis from '@/lib/redis/redis';

/**
 * POST handler to clear invalid hot comments cache entries
 */
export async function POST(request) {
  try {
    console.log('[POST /api/posts/clear-invalid-cache] Starting cache cleanup');

    // Get all keys matching the hot comments pattern
    const pattern = 'post:*:hot_comments';
    const keys = await redis.keys(pattern);

    if (keys.length === 0) {
      return NextResponse.json({
        message: 'No hot comments cache entries found',
        cleared: 0
      });
    }

    console.log(`[POST /api/posts/clear-invalid-cache] Found ${keys.length} cache entries to check`);

    let clearedCount = 0;
    let validCount = 0;
    const results = [];

    // Check each cache entry
    for (const key of keys) {
      try {
        const data = await redis.get(key);
        
        if (!data) {
          continue;
        }

        // Check if data is invalid
        const dataStr = String(data);
        if (dataStr === '[object Object]' || dataStr.startsWith('[object')) {
          console.log(`[POST /api/posts/clear-invalid-cache] Clearing invalid cache: ${key}`);
          await redis.del(key);
          clearedCount++;
          results.push({
            key,
            status: 'cleared',
            reason: 'Invalid [object Object] data'
          });
        } else {
          // Try to parse JSON
          try {
            JSON.parse(data);
            validCount++;
            results.push({
              key,
              status: 'valid',
              reason: 'Valid JSON data'
            });
          } catch (parseError) {
            console.log(`[POST /api/posts/clear-invalid-cache] Clearing unparseable cache: ${key}`);
            await redis.del(key);
            clearedCount++;
            results.push({
              key,
              status: 'cleared',
              reason: 'Invalid JSON format'
            });
          }
        }
      } catch (error) {
        console.error(`[POST /api/posts/clear-invalid-cache] Error processing ${key}:`, error);
        results.push({
          key,
          status: 'error',
          reason: error.message
        });
      }
    }

    console.log(`[POST /api/posts/clear-invalid-cache] Cleanup completed: ${clearedCount} cleared, ${validCount} valid`);

    return NextResponse.json({
      message: 'Cache cleanup completed',
      totalChecked: keys.length,
      cleared: clearedCount,
      valid: validCount,
      results: results
    });

  } catch (error) {
    console.error('[POST /api/posts/clear-invalid-cache] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * GET handler to check cache status without clearing
 */
export async function GET(request) {
  try {
    console.log('[GET /api/posts/clear-invalid-cache] Checking cache status');

    // Get all keys matching the hot comments pattern
    const pattern = 'post:*:hot_comments';
    const keys = await redis.keys(pattern);

    if (keys.length === 0) {
      return NextResponse.json({
        message: 'No hot comments cache entries found',
        totalEntries: 0,
        invalid: 0,
        valid: 0
      });
    }

    let invalidCount = 0;
    let validCount = 0;
    const sampleResults = [];

    // Check first 10 entries as sample
    const sampleKeys = keys.slice(0, 10);

    for (const key of sampleKeys) {
      try {
        const data = await redis.get(key);
        
        if (!data) {
          continue;
        }

        // Check if data is invalid
        const dataStr = String(data);
        if (dataStr === '[object Object]' || dataStr.startsWith('[object')) {
          invalidCount++;
          sampleResults.push({
            key,
            status: 'invalid',
            reason: 'Contains [object Object]',
            preview: data.substring(0, 50)
          });
        } else {
          // Try to parse JSON
          try {
            JSON.parse(data);
            validCount++;
            sampleResults.push({
              key,
              status: 'valid',
              reason: 'Valid JSON',
              preview: data.substring(0, 50)
            });
          } catch (parseError) {
            invalidCount++;
            sampleResults.push({
              key,
              status: 'invalid',
              reason: 'Invalid JSON format',
              preview: data.substring(0, 50)
            });
          }
        }
      } catch (error) {
        sampleResults.push({
          key,
          status: 'error',
          reason: error.message
        });
      }
    }

    return NextResponse.json({
      message: 'Cache status check completed',
      totalEntries: keys.length,
      sampleSize: sampleKeys.length,
      invalid: invalidCount,
      valid: validCount,
      invalidPercentage: Math.round((invalidCount / sampleKeys.length) * 100),
      sampleResults: sampleResults
    });

  } catch (error) {
    console.error('[GET /api/posts/clear-invalid-cache] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
