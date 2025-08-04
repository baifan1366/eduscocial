import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCachedPostHotComments, cachePostHotComments } from '@/lib/redis/redisUtils';

/**
 * POST handler for batch fetching hot comments for multiple posts
 * This reduces the number of individual requests and improves performance
 */
export async function POST(request) {
  try {
    const { postIds } = await request.json();
    
    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({ 
        error: 'Post IDs array is required' 
      }, { status: 400 });
    }

    // Limit batch size to prevent abuse
    if (postIds.length > 50) {
      return NextResponse.json({ 
        error: 'Maximum 50 posts per batch request' 
      }, { status: 400 });
    }

    console.log(`[POST /api/posts/batch-hot-comments] Fetching hot comments for ${postIds.length} posts`);

    const results = {};
    const uncachedPostIds = [];

    // First, try to get cached hot comments
    for (const postId of postIds) {
      try {
        const cachedComments = await getCachedPostHotComments(postId);
        if (cachedComments && cachedComments.length > 0) {
          results[postId] = {
            comments: cachedComments,
            cached: true
          };
        } else {
          uncachedPostIds.push(postId);
        }
      } catch (cacheError) {
        console.error(`Error fetching cached hot comments for post ${postId}:`, cacheError);
        uncachedPostIds.push(postId);
      }
    }

    // Fetch uncached posts from database in a single query
    if (uncachedPostIds.length > 0) {
      console.log(`[POST /api/posts/batch-hot-comments] Fetching ${uncachedPostIds.length} posts from database`);

      // Get both hot comments (by likes) and recent comments for better variety
      const [hotCommentsResult, recentCommentsResult] = await Promise.all([
        // Hot comments (sorted by likes)
        supabase
          .from('comments')
          .select(`
            id,
            content,
            like_count,
            created_at,
            post_id,
            is_anonymous,
            author:users!comments_author_id_fkey (
              id,
              username,
              avatar_url
            )
          `)
          .in('post_id', uncachedPostIds)
          .eq('is_deleted', false)
          .gte('like_count', 1) // Only comments with at least 1 like
          .order('like_count', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(100),

        // Recent comments (sorted by time)
        supabase
          .from('comments')
          .select(`
            id,
            content,
            like_count,
            created_at,
            post_id,
            is_anonymous,
            author:users!comments_author_id_fkey (
              id,
              username,
              avatar_url
            )
          `)
          .in('post_id', uncachedPostIds)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(100)
      ]);

      if (hotCommentsResult.error || recentCommentsResult.error) {
        console.error('Error fetching comments from database:', hotCommentsResult.error || recentCommentsResult.error);
        return NextResponse.json({
          error: 'Failed to fetch comments',
          details: (hotCommentsResult.error || recentCommentsResult.error).message
        }, { status: 500 });
      }

      // Combine and deduplicate comments
      const allComments = [...(hotCommentsResult.data || []), ...(recentCommentsResult.data || [])];
      const uniqueComments = allComments.filter((comment, index, self) =>
        index === self.findIndex(c => c.id === comment.id)
      );

      // Group comments by post_id and select best mix for each post
      const commentsByPost = {};
      uncachedPostIds.forEach(postId => {
        const postComments = uniqueComments.filter(c => c.post_id === postId);

        if (postComments.length > 0) {
          // Sort by a combination of likes and recency for better variety
          const sortedComments = postComments.sort((a, b) => {
            const aScore = (a.like_count || 0) * 0.7 + (new Date(a.created_at).getTime() / 1000000) * 0.3;
            const bScore = (b.like_count || 0) * 0.7 + (new Date(b.created_at).getTime() / 1000000) * 0.3;
            return bScore - aScore;
          });

          commentsByPost[postId] = sortedComments.slice(0, 3);
        }
      });

      // Add database results to results and cache them
      for (const postId of uncachedPostIds) {
        const postComments = commentsByPost[postId] || [];
        results[postId] = {
          comments: postComments,
          cached: false
        };

        // Cache the results for future requests
        if (postComments.length > 0) {
          try {
            await cachePostHotComments(postId, postComments, 1800); // 30 minutes TTL
          } catch (cacheError) {
            console.error(`Error caching hot comments for post ${postId}:`, cacheError);
          }
        }
      }
    }

    console.log(`[POST /api/posts/batch-hot-comments] Returning results for ${Object.keys(results).length} posts`);

    return NextResponse.json({
      success: true,
      results,
      totalPosts: postIds.length,
      cachedPosts: postIds.length - uncachedPostIds.length,
      fetchedPosts: uncachedPostIds.length
    });

  } catch (error) {
    console.error('[POST /api/posts/batch-hot-comments] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
