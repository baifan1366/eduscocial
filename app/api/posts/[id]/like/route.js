import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';
import { trackUserAction } from '@/lib/utils';
import { bufferLikeOperation, getCachedPostLikeCount } from '@/lib/redis/redisUtils';

export async function POST(request, { params }) {
  try {
    const postId = await params.id;
    
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
    const postId = params.id;

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
