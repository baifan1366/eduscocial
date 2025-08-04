import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';
import { trackUserAction } from '@/lib/utils';
import { bufferLikeOperation, getCachedPostLikeCount } from '@/lib/redis/redisUtils';

/**
 * GET handler for checking if user has liked a post
 */
export async function GET(request, { params }) {
  try {
    const { id: postId } = await params;

    // Get the user from session
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({
        isLiked: false,
        likeCount: 0
      });
    }

    const user = session.user;

    console.log(`[GET /api/posts/${postId}/like] User ID:`, user.id);

    // First check if user has liked this post in the database
    const { data: existingLikes, error: likeError } = await supabase
      .from('votes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .eq('vote_type', 'like');

    console.log(`[GET /api/posts/${postId}/like] DB Query result:`, { existingLikes, likeError });

    if (likeError) {
      console.error('Error checking like status:', likeError);
    }

    let existingLike = existingLikes && existingLikes.length > 0 ? existingLikes[0] : null;

    // If no like found in database, check Redis buffer for pending operations
    if (!existingLike) {
      try {
        const redis = (await import('@/lib/redis/redis')).default;



        const pendingOps = await redis.lrange('pending_like_operations', 0, -1);

        console.log(`[GET /api/posts/${postId}/like] Redis pending operations count:`, pendingOps.length);
        console.log(`[GET /api/posts/${postId}/like] Looking for user_id: ${user.id}, post_id: ${postId}`);

        // Check if there's a pending like operation for this user and post
        for (const opData of pendingOps) {
          try {
            let op;
            // Handle both string and object data (for mock Redis compatibility)
            if (typeof opData === 'string') {
              op = JSON.parse(opData);
            } else if (typeof opData === 'object' && opData !== null) {
              op = opData; // Already an object
            } else {
              console.warn('Unexpected operation data type:', typeof opData, opData);
              continue;
            }

            console.log(`[GET /api/posts/${postId}/like] Checking operation:`, op);
            if (op.user_id === user.id && op.post_id === postId && op.action === 'like') {
              existingLike = { id: 'pending' }; // Mark as liked
              console.log(`[GET /api/posts/${postId}/like] Found pending like operation!`);
              break;
            }
          } catch (parseError) {
            console.error('Error parsing pending operation:', parseError, 'Data:', opData);
          }
        }

        if (!existingLike) {
          console.log(`[GET /api/posts/${postId}/like] No pending like operation found`);
        }
      } catch (redisError) {
        console.error('Error checking Redis for pending operations:', redisError);
      }
    }

    // Get current like count from cache, fallback to database
    let likeCount = await getCachedPostLikeCount(postId);

    if (likeCount === null) {
      // If not in cache, get from database
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('like_count')
        .eq('id', postId)
        .single();

      if (!postError && post) {
        likeCount = post.like_count || 0;
        // Cache the value for future requests
        const { cachePostLikeCount } = await import('@/lib/redis/redisUtils');
        await cachePostLikeCount(postId, likeCount);
      } else {
        likeCount = 0;
      }
    }

    const result = {
      isLiked: !!existingLike,
      likeCount: likeCount
    };

    console.log(`[GET /api/posts/${postId}/like] Returning:`, result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in GET /api/posts/[id]/like:', error);
    return NextResponse.json({
      isLiked: false,
      likeCount: 0
    });
  }
}

export async function POST(request, { params }) {
  try {
    const { id: postId } = await params;
    
    // Get the user from session
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = session.user;
    
    // Buffer the like operation to Redis
    await bufferLikeOperation(user.id, postId, 'like');

    // Get updated like count from cache
    const newLikeCount = await getCachedPostLikeCount(postId);

    // Track user action (non-blocking)
    trackUserAction(user.id, 'like_post', {
      targetTable: 'posts',
      targetId: postId,
      metadata: {
        referrer: request.headers.get('referer') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      }
    });

    // Return success response with updated count
    return NextResponse.json({
      success: true,
      likeCount: newLikeCount || 0,
      action: 'liked'
    });
  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id: postId } = await params;

    // Get the user from session
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;

    // Buffer the unlike operation to Redis instead of direct database operation
    await bufferLikeOperation(user.id, postId, 'unlike');

    // Get updated like count from cache
    const newLikeCount = await getCachedPostLikeCount(postId);

    // Track user action (non-blocking)
    trackUserAction(user.id, 'unlike_post', {
      targetTable: 'posts',
      targetId: postId,
      metadata: {
        referrer: request.headers.get('referer') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      }
    });

    return NextResponse.json({
      success: true,
      likeCount: newLikeCount || 0,
      action: 'unliked'
    });
  } catch (error) {
    console.error('Error unliking post:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
