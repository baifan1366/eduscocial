import { NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/qstash';
import { moderatePostVideo } from '@/lib/moderation';

/**
 * POST handler for video content moderation
 * This endpoint is called asynchronously via QStash
 * 
 * Request body:
 * {
 *   postId: string,     // ID of the post to moderate
 *   mediaUrl: string,   // URL to video media
 *   userId: string      // User who created the post
 * }
 */
export async function POST(request) {
  try {
    // Verify request is from QStash
    const isAuthentic = await verifyQStashSignature(request.clone());
    
    if (!isAuthentic) {
      console.error('Unauthorized request to video moderation endpoint');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { postId, mediaUrl, userId } = await request.json();
    
    if (!postId || !mediaUrl || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Moderate the video content
    const moderationResult = await moderatePostVideo(postId, mediaUrl, userId);
    
    return NextResponse.json({
      success: true,
      moderation: moderationResult
    });
    
  } catch (error) {
    console.error('Error in video moderation:', error);
    
    return NextResponse.json(
      { error: 'Video moderation failed', details: error.message },
      { status: 500 }
    );
  }
} 