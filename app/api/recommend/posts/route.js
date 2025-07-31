import { getUserEmbedding, getPersonalizedRecommendations } from '@/lib/userEmbedding';
import { getUserSession } from '@/lib/redis/redisUtils';
import { getServerSession } from '@/lib/auth/serverAuth';
import { createServerSupabaseClient } from '@/lib/supabase';

// Initialize Supabase client
const supabase = createServerSupabaseClient(true); // Use service role

/**
 * GET handler for personalized post recommendations
 * This endpoint uses user embeddings to find posts that match a user's interests
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
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const threshold = parseFloat(url.searchParams.get('threshold') || '0.3');
    
    // Check if we already have seen posts to exclude
    const excludeParam = url.searchParams.get('exclude') || '';
    const excludePostIds = excludeParam ? excludeParam.split(',') : [];
    
    // Get user session for tracking purposes
    const userSession = await getUserSession(userId);

    // Add recently viewed posts to exclude list
    if (userSession && userSession.recently_viewed_posts) {
      try {
        const recentlyViewed = JSON.parse(userSession.recently_viewed_posts);
        if (Array.isArray(recentlyViewed)) {
          excludePostIds.push(...recentlyViewed);
        }
      } catch (e) {
        console.error('Error parsing recently viewed posts:', e);
      }
    }
    
    // Get personalized recommendations using user embedding
    const recommendationOptions = {
      limit: limit * 2, // Get more than we need to allow for filtering
      threshold,
      excludePostIds
    };
    
    const recommendedPostIds = await getPersonalizedRecommendations(userId, recommendationOptions);
    
    if (!recommendedPostIds || recommendedPostIds.length === 0) {
      // Fallback to non-personalized recommendations if no embedding-based recommendations available
      const { data: fallbackPosts, error: fallbackError } = await supabase
        .from('posts')
        .select('id, title, content, slug, author_id, board_id, created_at, like_count, comment_count, view_count, is_anonymous')
        .eq('is_deleted', false)
        .not('id', 'in', `(${excludePostIds.join(',')})`)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range((page - 1) * limit, page * limit - 1);
      
      if (fallbackError) {
        throw new Error(`Error fetching fallback posts: ${fallbackError.message}`);
      }
      
      return new Response(JSON.stringify({
        posts: fallbackPosts || [],
        page,
        limit,
        total: fallbackPosts?.length || 0,
        hasMore: (fallbackPosts?.length || 0) === limit,
        isPersonalized: false,
        message: 'No personalized recommendations available, showing recent posts instead'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get the post IDs from the recommendations, sorted by similarity
    const postIds = recommendedPostIds.map(rec => rec.post_id);
    
    // Fetch full post data for recommended posts
    // Using direct select rather than 'in' for better control over order
    const posts = [];
    
    // Create a lookup table for similarity scores
    const similarityScores = Object.fromEntries(
      recommendedPostIds.map(item => [item.post_id, item.similarity])
    );
    
    // Fetch each post in batches of 10
    const batchSize = 10;
    for (let i = 0; i < postIds.length; i += batchSize) {
      const batchIds = postIds.slice(i, i + batchSize);
      
      // If this batch is empty, continue to next batch
      if (batchIds.length === 0) continue;
      
      const { data: batchPosts, error: batchError } = await supabase
        .from('posts')
        .select('id, title, content, slug, author_id, board_id, created_at, like_count, comment_count, view_count, is_anonymous')
        .in('id', batchIds)
        .eq('is_deleted', false);
      
      if (batchError) {
        console.error(`Error fetching batch posts:`, batchError);
        continue;
      }
      
      if (batchPosts && batchPosts.length > 0) {
        // Add posts from this batch to the results
        posts.push(...batchPosts);
      }
    }
    
    // Sort the posts by similarity score (same order as the recommendations)
    posts.sort((a, b) => {
      return (similarityScores[b.id] || 0) - (similarityScores[a.id] || 0);
    });
    
    // Apply pagination to the sorted results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = posts.slice(startIndex, endIndex);
    
    // Calculate if there are more results after this page
    const hasMore = endIndex < posts.length;
    
    // Add the similarity scores to the response
    const postsWithScores = paginatedPosts.map(post => ({
      ...post,
      similarity_score: similarityScores[post.id] || 0
    }));
    
    return new Response(JSON.stringify({
      posts: postsWithScores,
      page,
      limit,
      total: posts.length,
      hasMore,
      isPersonalized: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error getting post recommendations:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
