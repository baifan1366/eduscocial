import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCachedPostHotComments, cachePostHotComments } from '@/lib/redis/redisUtils';
import { isValidSlug } from '@/lib/utils/slugUtils';

// UUID validation function
const isValidUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * 根据ID或slug查询帖子
 * @param {string} idOrSlug - 帖子ID或slug
 * @returns {Promise<Object>} 查询结果
 */
async function getPostByIdOrSlug(idOrSlug) {
  const isUUID = isValidUUID(idOrSlug);
  const isSlug = isValidSlug(idOrSlug);

  if (!isUUID && !isSlug) {
    return {
      data: null,
      error: { message: 'Invalid post ID or slug format' }
    };
  }

  let query = supabase
    .from('posts')
    .select('id, title')
    .eq('is_deleted', false);

  if (isUUID) {
    query = query.eq('id', idOrSlug);
  } else {
    query = query.eq('slug', idOrSlug);
  }

  return await query.single();
}

/**
 * GET handler for retrieving hot comments for a post
 * Supports both UUID and slug-based lookups
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Post ID or slug is required' 
      }, { status: 400 });
    }

    console.log(`[GET /api/posts/${id}/hot-comments] Fetching hot comments`);

    // First, resolve the post to get the actual UUID
    const { data: post, error: postError } = await getPostByIdOrSlug(id);
    
    if (postError || !post) {
      return NextResponse.json({ 
        error: 'Post not found' 
      }, { status: 404 });
    }

    const actualPostId = post.id;

    // Try to get cached hot comments first
    try {
      const cachedComments = await getCachedPostHotComments(actualPostId);
      if (cachedComments && cachedComments.length > 0) {
        console.log(`[GET /api/posts/${id}/hot-comments] Returning cached hot comments`);
        return NextResponse.json({
          success: true,
          comments: cachedComments,
          cached: true,
          postId: actualPostId
        });
      }
    } catch (cacheError) {
      console.error('Error fetching cached hot comments:', cacheError);
    }

    // If no cached data, fetch from database
    console.log(`[GET /api/posts/${id}/hot-comments] Fetching hot comments from database`);
    
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
      .eq('post_id', actualPostId)
      .eq('is_deleted', false)
      .order('like_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(3);

    if (commentsError) {
      console.error('Error fetching hot comments from database:', commentsError);
      return NextResponse.json({
        error: 'Failed to fetch hot comments',
        details: commentsError.message
      }, { status: 500 });
    }

    // Cache the results for future requests
    if (hotComments && hotComments.length > 0) {
      try {
        await cachePostHotComments(actualPostId, hotComments, 1800); // 30 minutes TTL
      } catch (cacheError) {
        console.error('Error caching hot comments:', cacheError);
      }
    }

    return NextResponse.json({
      success: true,
      comments: hotComments || [],
      cached: false,
      postId: actualPostId
    });

  } catch (error) {
    console.error(`[GET /api/posts/${id}/hot-comments] Error:`, error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST handler for manually refreshing hot comments cache
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Post ID or slug is required' 
      }, { status: 400 });
    }

    console.log(`[POST /api/posts/${id}/hot-comments] Refreshing hot comments cache`);

    // Resolve the post to get the actual UUID
    const { data: post, error: postError } = await getPostByIdOrSlug(id);
    
    if (postError || !post) {
      return NextResponse.json({ 
        error: 'Post not found' 
      }, { status: 404 });
    }

    const actualPostId = post.id;

    // Fetch fresh hot comments from database
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
      .eq('post_id', actualPostId)
      .eq('is_deleted', false)
      .order('like_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(3);

    if (commentsError) {
      console.error('Error fetching hot comments from database:', commentsError);
      return NextResponse.json({
        error: 'Failed to fetch hot comments',
        details: commentsError.message
      }, { status: 500 });
    }

    // Update cache with fresh data
    try {
      await cachePostHotComments(actualPostId, hotComments || [], 1800); // 30 minutes TTL
    } catch (cacheError) {
      console.error('Error updating hot comments cache:', cacheError);
      return NextResponse.json({
        error: 'Failed to update cache',
        details: cacheError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      comments: hotComments || [],
      refreshed: true,
      postId: actualPostId
    });

  } catch (error) {
    console.error(`[POST /api/posts/${id}/hot-comments] Error:`, error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
