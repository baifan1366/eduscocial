import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/serverAuth';
import { trackUserAction } from '@/lib/userEmbedding';

/**
 * API endpoint to track post interactions for user embedding updates
 * This endpoint handles tracking view, like, bookmark, and other interactions
 */
export async function POST(request) {
  try {
    // Get user session
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Parse request body
    const data = await request.json();
    const { post_id: postId, action, metadata = {} } = data;
    
    if (!postId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: post_id and action' },
        { status: 400 }
      );
    }
    
    // Validate action type
    const validActions = ['view_post', 'like_post', 'bookmark_post', 'comment_post', 'share_post'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action type' },
        { status: 400 }
      );
    }
    
    // Track user action for embedding updates
    await trackUserAction(userId, action, postId, {
      tracked_at: new Date().toISOString(),
      ...metadata
    });
    
    return NextResponse.json({
      success: true,
      message: 'Interaction tracked successfully'
    });
    
  } catch (error) {
    console.error('Error tracking post interaction:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 