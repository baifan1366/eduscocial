import { NextResponse } from 'next/server';
import { processPendingCommentVoteOperations } from '@/lib/redis/redisUtils';

/**
 * POST /api/actions/process-comment-votes
 * Process pending comment vote operations from Redis
 */
export async function POST() {
  try {
    console.log('[POST /api/actions/process-comment-votes] Processing comment vote operations');
    
    const processed = await processPendingCommentVoteOperations();
    
    return NextResponse.json({
      success: true,
      processed,
      message: `Processed ${processed} comment vote operations`
    });
    
  } catch (error) {
    console.error('[POST /api/actions/process-comment-votes] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process comment vote operations',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/actions/process-comment-votes
 * Manual trigger for processing comment vote operations (for testing)
 */
export async function GET() {
  try {
    console.log('[GET /api/actions/process-comment-votes] Manual comment vote operations processing');
    
    const processed = await processPendingCommentVoteOperations();
    
    return NextResponse.json({
      success: true,
      processed,
      message: `Manually processed ${processed} comment vote operations`
    });
    
  } catch (error) {
    console.error('[GET /api/actions/process-comment-votes] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process comment vote operations',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
