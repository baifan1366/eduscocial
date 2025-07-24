import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';
import { trackUserAction } from '@/lib/utils';
import { bufferLikeOperation } from '@/lib/redis/redisUtils';

export async function POST(request, { params }) {
  try {
    const postId = params.id;
    
    // Get the user from session
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = session.user;
    
    // Buffer the like operation to Redis
    await bufferLikeOperation(user.id, postId, true);
    
    // Track user action (non-blocking)
    trackUserAction(user.id, 'like_post', {
      targetTable: 'posts',
      targetId: postId,
      metadata: {
        referrer: request.headers.get('referer') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      }
    });
    
    // Return immediate success response
    return NextResponse.json({ success: true });
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
    
    // Remove like
    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId);
      
    if (error) {
      throw error;
    }
    
    // Track user action (non-blocking)
    trackUserAction(user.id, 'unlike_post', {
      targetTable: 'posts',
      targetId: postId,
      metadata: {
        referrer: request.headers.get('referer') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unliking post:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
