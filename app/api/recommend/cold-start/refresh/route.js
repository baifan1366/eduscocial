import { createClient } from '@supabase/supabase-js';
import { verifyQStashSignature } from '@/lib/qstash';
import { cacheHotPosts, cacheTrendingTags } from '@/lib/redis/redisUtils';
import redis from '@/lib/redis/redis';

// Initialize Supabase client
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ?
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null;

// Popular post cache keys by time window
const CACHE_KEYS = {
  DAILY_POPULAR: 'cold_start:daily_popular',
  WEEKLY_POPULAR: 'cold_start:weekly_popular',
  ALL_TIME_POPULAR: 'cold_start:all_time_popular',
  TRENDING_TOPICS: 'cold_start:trending_topics',
  NEW_POSTS: 'cold_start:new_posts'
};

// Cache TTLs
const CACHE_TTL = {
  DAILY_POPULAR: 6 * 60 * 60,      // 6 hours
  WEEKLY_POPULAR: 12 * 60 * 60,    // 12 hours
  ALL_TIME_POPULAR: 24 * 60 * 60,  // 24 hours
  TRENDING_TOPICS: 12 * 60 * 60,   // 12 hours
  NEW_POSTS: 60 * 60               // 1 hour
};

/**
 * POST handler to refresh cold-start content
 * This is triggered on a schedule by QStash
 */
export async function POST(request) {
  try {
    // Verify request is from QStash
    const isValid = await verifyQStashSignature(request);
    
    if (!isValid && process.env.NODE_ENV === 'production') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const results = {
      dailyPopular: { count: 0, status: 'failed' },
      weeklyPopular: { count: 0, status: 'failed' },
      allTimePopular: { count: 0, status: 'failed' },
      trendingTopics: { count: 0, status: 'failed' },
      newPosts: { count: 0, status: 'failed' }
    };
    
    // 1. Get daily popular posts (last 24 hours)
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: dailyPopular, error } = await supabase
        .from('posts')
        .select('id, title, content, author_id, board_id, created_at, like_count, comment_count, view_count')
        .gte('created_at', oneDayAgo)
        .eq('is_deleted', false)
        .order('like_count', { ascending: false })
        .limit(100);
        
      if (error) {
        throw new Error(`Error fetching daily popular posts: ${error.message}`);
      }
      
      if (dailyPopular && dailyPopular.length > 0) {
        // Cache in Redis
        await redis.set(CACHE_KEYS.DAILY_POPULAR, JSON.stringify(dailyPopular));
        await redis.expire(CACHE_KEYS.DAILY_POPULAR, CACHE_TTL.DAILY_POPULAR);
        
        results.dailyPopular.count = dailyPopular.length;
        results.dailyPopular.status = 'success';
      }
    } catch (error) {
      console.error('Error refreshing daily popular posts:', error);
      results.dailyPopular.error = error.message;
    }
    
    // 2. Get weekly popular posts (last 7 days)
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: weeklyPopular, error } = await supabase
        .from('posts')
        .select('id, title, content, author_id, board_id, created_at, like_count, comment_count, view_count')
        .gte('created_at', sevenDaysAgo)
        .eq('is_deleted', false)
        .order('like_count', { ascending: false })
        .limit(100);
        
      if (error) {
        throw new Error(`Error fetching weekly popular posts: ${error.message}`);
      }
      
      if (weeklyPopular && weeklyPopular.length > 0) {
        // Cache in Redis
        await redis.set(CACHE_KEYS.WEEKLY_POPULAR, JSON.stringify(weeklyPopular));
        await redis.expire(CACHE_KEYS.WEEKLY_POPULAR, CACHE_TTL.WEEKLY_POPULAR);
        
        results.weeklyPopular.count = weeklyPopular.length;
        results.weeklyPopular.status = 'success';
      }
    } catch (error) {
      console.error('Error refreshing weekly popular posts:', error);
      results.weeklyPopular.error = error.message;
    }
    
    // 3. Get all-time popular posts
    try {
      const { data: allTimePopular, error } = await supabase
        .from('posts')
        .select('id, title, content, author_id, board_id, created_at, like_count, comment_count, view_count')
        .eq('is_deleted', false)
        .order('like_count', { ascending: false })
        .limit(100);
        
      if (error) {
        throw new Error(`Error fetching all-time popular posts: ${error.message}`);
      }
      
      if (allTimePopular && allTimePopular.length > 0) {
        // Cache in Redis
        await redis.set(CACHE_KEYS.ALL_TIME_POPULAR, JSON.stringify(allTimePopular));
        await redis.expire(CACHE_KEYS.ALL_TIME_POPULAR, CACHE_TTL.ALL_TIME_POPULAR);
        
        results.allTimePopular.count = allTimePopular.length;
        results.allTimePopular.status = 'success';
      }
    } catch (error) {
      console.error('Error refreshing all-time popular posts:', error);
      results.allTimePopular.error = error.message;
    }
    
    // 4. Get trending topics
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      // Get trending hashtags
      const { data: trendingHashtags, error: hashtagError } = await supabase
        .from('hashtags')
        .select('id, name, usage_count')
        .order('usage_count', { ascending: false })
        .limit(50);
      
      if (hashtagError) {
        throw new Error(`Error fetching trending hashtags: ${hashtagError.message}`);
      }
      
      // Get trending topics
      const { data: trendingTopics, error: topicsError } = await supabase
        .from('topics')
        .select('id, name')
        .limit(50);
      
      if (topicsError) {
        throw new Error(`Error fetching trending topics: ${topicsError.message}`);
      }
      
      // Combine hashtags and topics
      const trendingItems = [
        ...(trendingHashtags || []).map(h => ({ id: h.id, name: h.name, count: h.usage_count, type: 'hashtag' })),
        ...(trendingTopics || []).map(t => ({ id: t.id, name: t.name, type: 'topic' }))
      ];
      
      if (trendingItems.length > 0) {
        // Cache in Redis
        await redis.set(CACHE_KEYS.TRENDING_TOPICS, JSON.stringify(trendingItems));
        await redis.expire(CACHE_KEYS.TRENDING_TOPICS, CACHE_TTL.TRENDING_TOPICS);
        
        // Also use the caching utility
        await cacheTrendingTags(trendingItems, CACHE_TTL.TRENDING_TOPICS);
        
        results.trendingTopics.count = trendingItems.length;
        results.trendingTopics.status = 'success';
      }
    } catch (error) {
      console.error('Error refreshing trending topics:', error);
      results.trendingTopics.error = error.message;
    }
    
    // 5. Get newest posts
    try {
      const { data: newPosts, error } = await supabase
        .from('posts')
        .select('id, title, content, author_id, board_id, created_at, like_count, comment_count, view_count')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (error) {
        throw new Error(`Error fetching new posts: ${error.message}`);
      }
      
      if (newPosts && newPosts.length > 0) {
        // Cache in Redis
        await redis.set(CACHE_KEYS.NEW_POSTS, JSON.stringify(newPosts));
        await redis.expire(CACHE_KEYS.NEW_POSTS, CACHE_TTL.NEW_POSTS);
        
        results.newPosts.count = newPosts.length;
        results.newPosts.status = 'success';
      }
    } catch (error) {
      console.error('Error refreshing new posts:', error);
      results.newPosts.error = error.message;
    }
    
    return new Response(JSON.stringify({
      message: 'Cold-start content refresh completed',
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in cold-start content refresh:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * GET handler to retrieve cold-start recommendations
 * Used for new users or when personalized recommendations aren't available
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'daily';
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    
    let cacheKey;
    
    // Map type parameter to cache key
    switch (type) {
      case 'daily':
        cacheKey = CACHE_KEYS.DAILY_POPULAR;
        break;
      case 'weekly':
        cacheKey = CACHE_KEYS.WEEKLY_POPULAR;
        break;
      case 'alltime':
        cacheKey = CACHE_KEYS.ALL_TIME_POPULAR;
        break;
      case 'new':
        cacheKey = CACHE_KEYS.NEW_POSTS;
        break;
      case 'topics':
        cacheKey = CACHE_KEYS.TRENDING_TOPICS;
        break;
      default:
        cacheKey = CACHE_KEYS.DAILY_POPULAR;
    }
    
    // Retrieve from Redis cache
    const cachedData = await redis.get(cacheKey);
    
    if (cachedData) {
      const posts = JSON.parse(cachedData);
      
      return new Response(JSON.stringify({
        items: posts.slice(0, limit),
        total: posts.length,
        type
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // If cache miss, trigger a refresh but return empty result
      // The next request should hit the cache
      if (process.env.NODE_ENV !== 'production') {
        // In development, just perform the refresh directly
        const refresh = new Request(request.url, {
          method: 'POST',
          headers: request.headers
        });
        await POST(refresh);
      } else {
        // In production, this would be handled by the scheduled job
        console.log('Cache miss for cold-start content, waiting for next refresh cycle');
      }
      
      return new Response(JSON.stringify({
        items: [],
        total: 0,
        type,
        message: 'Content not cached yet, try again later'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error retrieving cold-start recommendations:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 