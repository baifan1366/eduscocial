import { NextResponse } from 'next/server';
import { getCachedPostCommentCount, getCachedPostLikeCount, getCachedPostViewCount } from '@/lib/redis/redisUtils';

/**
 * GET handler for fetching cached counts for multiple posts
 * This endpoint allows bulk fetching of cached like and comment counts
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const postIdsParam = searchParams.get('postIds');
    
    if (!postIdsParam) {
      return NextResponse.json({ 
        error: 'postIds parameter is required' 
      }, { status: 400 });
    }

    // Parse post IDs from comma-separated string
    const postIds = postIdsParam.split(',').filter(id => id.trim());
    
    if (postIds.length === 0) {
      return NextResponse.json({ 
        error: 'At least one post ID is required' 
      }, { status: 400 });
    }

    // Limit to prevent abuse
    if (postIds.length > 50) {
      return NextResponse.json({ 
        error: 'Maximum 50 post IDs allowed per request' 
      }, { status: 400 });
    }

    console.log(`[GET /api/posts/cached-counts] Fetching cached counts for ${postIds.length} posts`);

    // Fetch cached counts for all posts
    const cachedCounts = await Promise.all(
      postIds.map(async (postId) => {
        try {
          const [commentCount, likeCount, viewCount] = await Promise.all([
            getCachedPostCommentCount(postId),
            getCachedPostLikeCount(postId),
            getCachedPostViewCount(postId)
          ]);

          return {
            postId,
            commentCount,
            likeCount,
            viewCount,
            hasCachedData: commentCount !== null || likeCount !== null || viewCount !== null
          };
        } catch (error) {
          console.error(`Error fetching cached counts for post ${postId}:`, error);
          return {
            postId,
            commentCount: null,
            likeCount: null,
            viewCount: null,
            hasCachedData: false,
            error: error.message
          };
        }
      })
    );

    // Organize results by post ID for easier lookup
    const results = {};
    cachedCounts.forEach(({ postId, commentCount, likeCount, viewCount, hasCachedData, error }) => {
      results[postId] = {
        commentCount,
        likeCount,
        viewCount,
        hasCachedData,
        ...(error && { error })
      };
    });

    return NextResponse.json({
      success: true,
      results,
      totalPosts: postIds.length,
      cachedPosts: cachedCounts.filter(c => c.hasCachedData).length
    });

  } catch (error) {
    console.error('[GET /api/posts/cached-counts] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST handler for bulk fetching cached counts with post data
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { postIds } = body;
    
    if (!Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({ 
        error: 'postIds array is required' 
      }, { status: 400 });
    }

    // Limit to prevent abuse
    if (postIds.length > 50) {
      return NextResponse.json({ 
        error: 'Maximum 50 post IDs allowed per request' 
      }, { status: 400 });
    }

    console.log(`[POST /api/posts/cached-counts] Fetching cached counts for ${postIds.length} posts`);

    // Fetch cached counts for all posts
    const cachedCounts = await Promise.all(
      postIds.map(async (postId) => {
        try {
          const [commentCount, likeCount, viewCount] = await Promise.all([
            getCachedPostCommentCount(postId),
            getCachedPostLikeCount(postId),
            getCachedPostViewCount(postId)
          ]);

          return {
            postId,
            commentCount,
            likeCount,
            viewCount,
            hasCachedData: commentCount !== null || likeCount !== null || viewCount !== null
          };
        } catch (error) {
          console.error(`Error fetching cached counts for post ${postId}:`, error);
          return {
            postId,
            commentCount: null,
            likeCount: null,
            viewCount: null,
            hasCachedData: false,
            error: error.message
          };
        }
      })
    );

    // Organize results by post ID for easier lookup
    const results = {};
    cachedCounts.forEach(({ postId, commentCount, likeCount, viewCount, hasCachedData, error }) => {
      results[postId] = {
        commentCount,
        likeCount,
        viewCount,
        hasCachedData,
        ...(error && { error })
      };
    });

    return NextResponse.json({
      success: true,
      results,
      totalPosts: postIds.length,
      cachedPosts: cachedCounts.filter(c => c.hasCachedData).length
    });

  } catch (error) {
    console.error('[POST /api/posts/cached-counts] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
