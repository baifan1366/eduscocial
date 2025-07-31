import { createClient } from '@supabase/supabase-js';
import { getUserFromToken } from '@/lib/auth/serverAuth';
import { vectorRecallByUserInterests } from '@/lib/vectorSearch';
import { getUserSession } from '@/lib/redis/redisUtils';
import redis from '@/lib/redis/redis';

// Initialize Supabase client
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ?
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null;

/**
 * GET handler for the recall phase of recommendations
 * Retrieves top N posts (default 1000) that match a user's interests based on vector similarity
 */
export async function GET(request) {
  try {
    // Get user authentication
    const user = await getUserFromToken(request);
    
    if (!user || !user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const userId = user.id;
    const url = new URL(request.url);
    
    // Parse query parameters
    const limit = parseInt(url.searchParams.get('limit') || '1000', 10);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    const cacheResults = url.searchParams.get('cache') !== 'false';
    
    // Get exclude post IDs
    const excludeParam = url.searchParams.get('exclude') || '';
    let excludePostIds = excludeParam ? excludeParam.split(',') : [];
    
    // Get recently viewed posts to exclude
    const session = await getUserSession(userId);
    if (session && session.recently_viewed_posts) {
      try {
        const recentlyViewed = JSON.parse(session.recently_viewed_posts);
        if (Array.isArray(recentlyViewed)) {
          excludePostIds = [...excludePostIds, ...recentlyViewed];
        }
      } catch (error) {
        console.error('Error parsing recently viewed posts:', error);
      }
    }
    
    // Check if we have cached recall results and they're not being force refreshed
    let postMatches = [];
    const cacheKey = `user:${userId}:recall:posts`;
    
    if (!forceRefresh) {
      try {
        const cachedRecall = await redis.get(cacheKey);
        if (cachedRecall) {
          postMatches = JSON.parse(cachedRecall);
          
          // Filter out excluded posts from cache
          if (excludePostIds.length > 0) {
            const excludeSet = new Set(excludePostIds);
            postMatches = postMatches.filter(match => !excludeSet.has(match.post_id));
          }
          
          // If we still have enough results after filtering, use the cache
          if (postMatches.length >= limit * 0.8) {
            return new Response(JSON.stringify({
              posts: postMatches.slice(0, limit),
              total: postMatches.length,
              fromCache: true
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
      } catch (cacheError) {
        console.error('Error reading cache:', cacheError);
      }
    }
    
    // Perform vector recall
    postMatches = await vectorRecallByUserInterests(userId, {
      limit,
      excludePostIds,
      forceRefresh
    });
    
    // Cache the results if enabled
    if (cacheResults && postMatches.length > 0) {
      try {
        await redis.set(cacheKey, JSON.stringify(postMatches));
        // Cache for 2 hours
        await redis.expire(cacheKey, 60 * 60 * 2);
      } catch (cacheError) {
        console.error('Error caching recall results:', cacheError);
      }
    }
    
    return new Response(JSON.stringify({
      posts: postMatches,
      total: postMatches.length,
      fromCache: false
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in recommendation recall:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 