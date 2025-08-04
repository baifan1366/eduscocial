import { getServerSession } from '@/lib/auth/serverAuth';
import { vectorRecallByUserInterests } from '@/lib/vectorSearch';
import { rankPostsPersonalized, getDefaultRankingParameters } from '@/lib/rankingSystem';
import redis from '@/lib/redis/redis';

/**
 * GET handler for fully ranked recommendations
 * This combines the recall and ranking phases to produce the final recommendations
 */
export async function GET(request) {
  try {
    // Get user authentication
    const session = await getServerSession();

    if (!session || !session.user || !session.user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = session.user.id;
    const url = new URL(request.url);
    
    // Parse query parameters
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    // Get ranking parameters from query or use defaults
    const similarityWeight = parseFloat(url.searchParams.get('similarity_weight') || '0');
    const recencyWeight = parseFloat(url.searchParams.get('recency_weight') || '0');
    const engagementWeight = parseFloat(url.searchParams.get('engagement_weight') || '0');
    const applyDiversity = url.searchParams.get('diversity') !== 'false';
    
    // Get exclude post IDs
    const excludeParam = url.searchParams.get('exclude') || '';
    const excludePostIds = excludeParam ? excludeParam.split(',') : [];
    
    // Check cache first for ranked results
    const cacheKey = `user:${userId}:ranked_recommendations:${page}:${limit}`;
    
    if (!forceRefresh) {
      try {
        const cachedRankedPosts = await redis.get(cacheKey);
        if (cachedRankedPosts) {
          const parsed = JSON.parse(cachedRankedPosts);
          
          // Filter out any excluded posts
          if (excludePostIds.length > 0) {
            const excludeSet = new Set(excludePostIds);
            parsed.posts = parsed.posts.filter(post => !excludeSet.has(post.id));
          }
          
          // If we still have enough results after filtering, use the cache
          if (parsed.posts.length >= Math.floor(limit * 0.8)) {
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
    const recallLimit = 1000; // Get enough posts to allow for diverse ranking
    const recallOptions = { 
      limit: recallLimit,
      excludePostIds,
      forceRefresh
    };
    
    const recallPosts = await vectorRecallByUserInterests(userId, recallOptions);
    
    if (!recallPosts || recallPosts.length === 0) {
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
    const rankedPosts = await rankPostsPersonalized(userId, recallPosts, rankingParams);
    
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
    
    // Cache the results (store the full rankedPosts array)
    try {
      // Cache full results with ranking scores
      await redis.set(cacheKey, JSON.stringify({
        posts: rankedPosts,
        page,
        limit,
        total: rankedPosts.length,
        rankingParams
      }));
      
      // Set expiration (30 minutes)
      await redis.expire(cacheKey, 60 * 30);
    } catch (cacheError) {
      console.error('Error caching ranked results:', cacheError);
    }
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in recommendation ranking:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 