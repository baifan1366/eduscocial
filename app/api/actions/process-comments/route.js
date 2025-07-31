import { NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/qstash';
import { processPendingCommentOperations } from '@/lib/redis/redisUtils';

/**
 * POST handler for processing pending comment operations
 * This endpoint is called by QStash on a schedule to batch process comment operations
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

    console.log('[POST /api/actions/process-comments] Starting comment operations processing');

    // Process pending comment operations
    const processed = await processPendingCommentOperations(100);

    console.log(`[POST /api/actions/process-comments] Processed ${processed} comment operations`);

    return NextResponse.json({
      success: true,
      processed,
      message: `Successfully processed ${processed} comment operations`
    });

  } catch (error) {
    console.error('[POST /api/actions/process-comments] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * GET handler for manual processing (development/testing)
 */
export async function GET() {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        error: 'Manual processing not allowed in production' 
      }, { status: 403 });
    }

    console.log('[GET /api/actions/process-comments] Manual comment operations processing');

    const processed = await processPendingCommentOperations(100);

    return NextResponse.json({
      success: true,
      processed,
      message: `Manually processed ${processed} comment operations`
    });

  } catch (error) {
    console.error('[GET /api/actions/process-comments] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
