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
      
      const { data: hotComments, error: commentsError } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          like_count,
          created_at,
          post_id,
          author:users!comments_author_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .in('post_id', uncachedPostIds)
        .eq('is_deleted', false)
        .order('like_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('Error fetching hot comments from database:', commentsError);
        return NextResponse.json({
          error: 'Failed to fetch hot comments',
          details: commentsError.message
        }, { status: 500 });
      }

      // Group comments by post_id and take top 3 for each post
      const commentsByPost = {};
      hotComments?.forEach(comment => {
        if (!commentsByPost[comment.post_id]) {
          commentsByPost[comment.post_id] = [];
        }
        if (commentsByPost[comment.post_id].length < 3) {
          commentsByPost[comment.post_id].push(comment);
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
