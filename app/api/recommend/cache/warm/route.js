import { createClient } from '@supabase/supabase-js';
import { verifyQStashSignature } from '@/lib/qstash';
import { vectorRecallByUserInterests } from '@/lib/vectorSearch';
import { rankPostsPersonalized, getDefaultRankingParameters } from '@/lib/rankingSystem';
import redis from '@/lib/redis/redis';

// Initialize Supabase client
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ?
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null;

// Number of active users to cache recommendations for
const ACTIVE_USERS_LIMIT = 100;

// Number of recommendations to cache per user
const RECOMMENDATIONS_PER_USER = 50;

/**
 * POST handler to warm recommendation caches for active users
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
    
    // Get most active users from the last 24 hours
    const { data: activeUsers, error: userError } = await supabase
      .from('action_log')
      .select('user_id, count(*)')
      .gte('occurred_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .not('user_id', 'is', null)
      .group('user_id')
      .order('count', { ascending: false })
      .limit(ACTIVE_USERS_LIMIT);
    
    if (userError) {
      throw new Error(`Error fetching active users: ${userError.message}`);
    }
    
    if (!activeUsers || activeUsers.length === 0) {
      return new Response(JSON.stringify({
        message: 'No active users found',
        cached: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const results = {
      total: activeUsers.length,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    // Process each active user
    for (const user of activeUsers) {
      try {
        const userId = user.user_id;
        
        // Step 1: Get user's ranking parameters
        const rankingParams = await getDefaultRankingParameters(userId);
        
        // Step 2: Perform recall phase
        const recallLimit = 1000;
        const recallPosts = await vectorRecallByUserInterests(userId, {
          limit: recallLimit,
          forceRefresh: false // Use existing user embedding if available
        });
        
        if (!recallPosts || recallPosts.length === 0) {
          results.failed++;
          results.errors.push({
            userId,
            error: 'No recall posts found'
          });
          continue;
        }
        
        // Step 3: Rank the posts
        const rankedPosts = await rankPostsPersonalized(userId, recallPosts, rankingParams);
        
        if (!rankedPosts || rankedPosts.length === 0) {
          results.failed++;
          results.errors.push({
            userId,
            error: 'Ranking phase returned no posts'
          });
          continue;
        }
        
        // Step 4: Cache the top N recommendations
        const topRecommendations = rankedPosts.slice(0, RECOMMENDATIONS_PER_USER);
        
        // Cache user's feed (page 1, standard limit)
        const feedCacheKey = `user:${userId}:feed:1:20:all`;
        await redis.set(feedCacheKey, JSON.stringify({
          posts: rankedPosts,
          page: 1,
          limit: 20,
          total: rankedPosts.length,
          hasMore: rankedPosts.length > 20,
          rankingParams
        }));
        await redis.expire(feedCacheKey, 60 * 60); // 1 hour TTL
        
        // Also cache the recall results
        const recallCacheKey = `user:${userId}:recall:posts`;
        await redis.set(recallCacheKey, JSON.stringify(recallPosts));
        await redis.expire(recallCacheKey, 2 * 60 * 60); // 2 hour TTL
        
        results.successful++;
      } catch (userError) {
        results.failed++;
        results.errors.push({
          userId: user.user_id,
          error: userError.message
        });
      }
    }
    
    return new Response(JSON.stringify({
      message: `Cache warming completed. Successfully cached recommendations for ${results.successful} users.`,
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in recommendation cache warming:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 