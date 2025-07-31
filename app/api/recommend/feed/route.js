import { getServerSession } from '@/lib/auth/serverAuth';
import { vectorRecallByUserInterests } from '@/lib/vectorSearch';
import { rankPostsPersonalized, getDefaultRankingParameters } from '@/lib/rankingSystem';
import { getUserSession, bufferUserAction } from '@/lib/redis/redisUtils';
import redis from '@/lib/redis/redis';

/**
 * GET handler for the unified recommendation feed API
 * This endpoint combines both recall and ranking phases in one API call
 * and provides a complete personalized feed for users
 */
export async function GET(request) {
  try {
    // Get user authentication
    const session = await getServerSession();;
    
    if (!session || !session.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const userId = session.id;
    const url = new URL(request.url);
    
    // Parse query parameters with defaults
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    const skipCache = url.searchParams.get('skip_cache') === 'true';
    
    // Custom ranking parameters (optional)
    const similarityWeight = parseFloat(url.searchParams.get('similarity_weight') || '0');
    const recencyWeight = parseFloat(url.searchParams.get('recency_weight') || '0');
    const engagementWeight = parseFloat(url.searchParams.get('engagement_weight') || '0');
    const applyDiversity = url.searchParams.get('diversity') !== 'false';
    
    // Board filter (optional)
    const boardFilter = url.searchParams.get('board');
    
    // Get exclude post IDs
    const excludeParam = url.searchParams.get('exclude') || '';
    let excludePostIds = excludeParam ? excludeParam.split(',') : [];
    
    // // Get recently viewed posts to exclude
    // if (session && session.recently_viewed_posts) {
    //   try {
    //     const recentlyViewed = JSON.parse(session.recently_viewed_posts);
    //     if (Array.isArray(recentlyViewed)) {
    //       excludePostIds = [...excludePostIds, ...recentlyViewed];
    //     }
    //   } catch (error) {
    //     console.error('Error parsing recently viewed posts:', error);
    //   }
    // }
    
    // Check cache for feed results (unless skipped or forcing refresh)
    if (!skipCache && !forceRefresh) {
      const cacheKey = `user:${userId}:feed:${page}:${limit}:${boardFilter || 'all'}`;
      try {
        const cachedFeed = await redis.get(cacheKey);
        if (cachedFeed) {
          const parsed = JSON.parse(cachedFeed);
          
          // Filter out excluded posts from cached results
          if (excludePostIds.length > 0) {
            const excludeSet = new Set(excludePostIds);
            parsed.posts = parsed.posts.filter(post => !excludeSet.has(post.id));
          }
          
          // If we still have enough results after filtering, use the cache
          if (parsed.posts.length >= Math.floor(limit * 0.8)) {
            // Log this feed view for analytics (don't await)
            bufferUserAction(userId, 'view_feed', null, null, null, {
              source: 'cache',
              page,
              limit,
              count: parsed.posts.length
            });
            
            return new Response(JSON.stringify({
              ...parsed,
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
    
    // Step 1: Get recall results (top ~1000 posts by vector similarity)
    const recallLimit = boardFilter ? 2000 : 1000; // Get more if filtering by board
    const recallOptions = { 
      limit: recallLimit,
      excludePostIds,
      forceRefresh
    };
    
    const recallPosts = await vectorRecallByUserInterests(userId, recallOptions);
    
    if (!recallPosts || recallPosts.length === 0) {
      // Log this feed view for analytics (don't await)
      bufferUserAction(userId, 'view_feed', null, null, null, {
        source: 'empty_recall',
        page,
        limit
      });
      
      return new Response(JSON.stringify({
        posts: [],
        page,
        limit,
        total: 0,
        hasMore: false,
        message: 'No recommendations found'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Step 2: Get ranking parameters (either from query params or user preferences)
    let rankingParams;
    if (similarityWeight > 0 && recencyWeight > 0 && engagementWeight > 0) {
      // If all weights are provided in query, use them
      rankingParams = {
        similarityWeight,
        recencyWeight, 
        engagementWeight,
        applyDiversity
      };
    } else {
      // Otherwise get defaults or user preferences
      rankingParams = await getDefaultRankingParameters(userId);
    }
    
    // Step 3: Rank posts using personalized ranking
    let rankedPosts = await rankPostsPersonalized(userId, recallPosts, rankingParams);
    
    // Apply board filter if specified
    if (boardFilter) {
      rankedPosts = rankedPosts.filter(post => post.board_id === boardFilter);
    }
    
    // Step 4: Paginate the results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = rankedPosts.slice(startIndex, endIndex);
    
    // Step 5: Prepare the response
    const response = {
      posts: paginatedPosts,
      page,
      limit,
      total: rankedPosts.length,
      hasMore: endIndex < rankedPosts.length,
      rankingParams
    };
    
    // Cache the results
    if (!skipCache) {
      try {
        const cacheKey = `user:${userId}:feed:${page}:${limit}:${boardFilter || 'all'}`;
        
        // Cache full results with ranking scores
        await redis.set(cacheKey, JSON.stringify({
          posts: rankedPosts,
          page,
          limit,
          total: rankedPosts.length,
          rankingParams
        }));
        
        // Set expiration (20 minutes)
        await redis.expire(cacheKey, 60 * 20);
      } catch (cacheError) {
        console.error('Error caching feed results:', cacheError);
      }
    }
    
    // Log this feed view for analytics (don't await)
    bufferUserAction(userId, 'view_feed', null, null, null, {
      source: 'fresh',
      page,
      limit,
      count: paginatedPosts.length
    });
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error generating recommendation feed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 