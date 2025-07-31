import { NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/qstash';
import { processPendingLikeOperations } from '@/lib/redis/redisUtils';

/**
 * POST handler for processing pending like operations
 * This endpoint is called by QStash on a schedule to batch process like operations
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

    console.log('[POST /api/actions/process-likes] Starting like operations processing');

    // Process pending like operations
    const processed = await processPendingLikeOperations(100);

    console.log(`[POST /api/actions/process-likes] Processed ${processed} like operations`);

    return NextResponse.json({
      success: true,
      processed,
      message: `Successfully processed ${processed} like operations`
    });

  } catch (error) {
    console.error('[POST /api/actions/process-likes] Error:', error);
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

    console.log('[GET /api/actions/process-likes] Manual like operations processing');

    const processed = await processPendingLikeOperations(100);

    return NextResponse.json({
      success: true,
      processed,
      message: `Manually processed ${processed} like operations`
    });

  } catch (error) {
    console.error('[GET /api/actions/process-likes] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
