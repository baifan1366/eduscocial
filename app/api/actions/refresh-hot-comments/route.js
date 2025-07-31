import { NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/qstash';
import { supabase } from '@/lib/supabase';
import { cachePostHotComments } from '@/lib/redis/redisUtils';

/**
 * POST handler for refreshing hot comments cache
 * This endpoint is called by QStash on a schedule to refresh hot comments for popular posts
 */
export async function POST(request) {
  try {
    // Verify that the request came from QStash
    const isValidSignature = await verifyQStashSignature(request);
    if (!isValidSignature) {
      return NextResponse.json({ 
        error: 'Unauthorized - Invalid QStash signature' 
      }, { status: 401 });
    }

    console.log('[POST /api/actions/refresh-hot-comments] Starting hot comments refresh');

    // Get popular posts (posts with high engagement in the last 24 hours)
    const { data: popularPosts, error: postsError } = await supabase
      .from('posts')
      .select('id, title')
      .eq('is_deleted', false)
      .eq('status', 'published')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .or('comment_count.gte.5,like_count.gte.10')
      .order('comment_count', { ascending: false })
      .limit(50);

    if (postsError) {
      throw new Error(`Error fetching popular posts: ${postsError.message}`);
    }

    let refreshedCount = 0;

    // Refresh hot comments for each popular post
    for (const post of popularPosts || []) {
      try {
        // Get hot comments for this post (top 3 comments by likes)
        const { data: hotComments, error: commentsError } = await supabase
          .from('comments')
          .select(`
            id,
            content,
            like_count,
            created_at,
            author:users!comments_author_id_fkey (
              id,
              username,
              avatar_url
            )
          `)
          .eq('post_id', post.id)
          .eq('is_deleted', false)
          .order('like_count', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(3);

        if (!commentsError && hotComments) {
          // Cache the hot comments
          await cachePostHotComments(post.id, hotComments, 1800); // 30 minutes TTL
          refreshedCount++;
        }
      } catch (error) {
        console.error(`Error refreshing hot comments for post ${post.id}:`, error);
      }
    }

    console.log(`[POST /api/actions/refresh-hot-comments] Refreshed hot comments for ${refreshedCount} posts`);

    return NextResponse.json({
      success: true,
      refreshedCount,
      totalPosts: popularPosts?.length || 0,
      message: `Successfully refreshed hot comments for ${refreshedCount} posts`
    });

  } catch (error) {
    console.error('[POST /api/actions/refresh-hot-comments] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * GET handler for manual refresh (development/testing)
 */
export async function GET() {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        error: 'Manual refresh not allowed in production' 
      }, { status: 403 });
    }

    console.log('[GET /api/actions/refresh-hot-comments] Manual hot comments refresh');

    // Same logic as POST but for manual testing
    const { data: popularPosts, error: postsError } = await supabase
      .from('posts')
      .select('id, title')
      .eq('is_deleted', false)
      .eq('status', 'published')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .or('comment_count.gte.5,like_count.gte.10')
      .order('comment_count', { ascending: false })
      .limit(10); // Smaller limit for manual testing

    if (postsError) {
      throw new Error(`Error fetching popular posts: ${postsError.message}`);
    }

    let refreshedCount = 0;

    for (const post of popularPosts || []) {
      try {
        const { data: hotComments, error: commentsError } = await supabase
          .from('comments')
          .select(`
            id,
            content,
            like_count,
            created_at,
            author:users!comments_author_id_fkey (
              id,
              username,
              avatar_url
            )
          `)
          .eq('post_id', post.id)
          .eq('is_deleted', false)
          .order('like_count', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(3);

        if (!commentsError && hotComments) {
          await cachePostHotComments(post.id, hotComments, 1800);
          refreshedCount++;
        }
      } catch (error) {
        console.error(`Error refreshing hot comments for post ${post.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      refreshedCount,
      totalPosts: popularPosts?.length || 0,
      message: `Manually refreshed hot comments for ${refreshedCount} posts`
    });

  } catch (error) {
    console.error('[GET /api/actions/refresh-hot-comments] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
