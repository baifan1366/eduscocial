import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/serverAuth';
import { 
  scheduleCommentProcessing, 
  scheduleLikeProcessing, 
  scheduleHotCommentsRefresh 
} from '@/lib/qstash';

/**
 * POST handler for initializing cache processing jobs
 * This endpoint sets up QStash scheduled jobs for processing cached data
 */
export async function POST(request) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
      return NextResponse.json({ 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    console.log('[POST /api/admin/init-cache-jobs] Initializing cache processing jobs');

    const results = {};
    const errors = [];

    try {
      // Schedule comment processing (every 30 seconds)
      console.log('Scheduling comment processing job...');
      results.commentProcessing = await scheduleCommentProcessing('*/30 * * * * *');
      
      if (!results.commentProcessing.success) {
        errors.push(`Comment processing: ${results.commentProcessing.error}`);
      }
    } catch (error) {
      errors.push(`Comment processing: ${error.message}`);
      results.commentProcessing = { success: false, error: error.message };
    }

    try {
      // Schedule like processing (every 30 seconds)
      console.log('Scheduling like processing job...');
      results.likeProcessing = await scheduleLikeProcessing('*/30 * * * * *');
      
      if (!results.likeProcessing.success) {
        errors.push(`Like processing: ${results.likeProcessing.error}`);
      }
    } catch (error) {
      errors.push(`Like processing: ${error.message}`);
      results.likeProcessing = { success: false, error: error.message };
    }

    try {
      // Schedule hot comments refresh (every 5 minutes)
      console.log('Scheduling hot comments refresh job...');
      results.hotCommentsRefresh = await scheduleHotCommentsRefresh('*/5 * * * *');
      
      if (!results.hotCommentsRefresh.success) {
        errors.push(`Hot comments refresh: ${results.hotCommentsRefresh.error}`);
      }
    } catch (error) {
      errors.push(`Hot comments refresh: ${error.message}`);
      results.hotCommentsRefresh = { success: false, error: error.message };
    }

    // Count successful jobs
    const successfulJobs = Object.values(results).filter(result => result.success).length;
    const totalJobs = Object.keys(results).length;

    console.log(`[POST /api/admin/init-cache-jobs] Completed: ${successfulJobs}/${totalJobs} jobs scheduled successfully`);

    if (errors.length > 0) {
      console.error('[POST /api/admin/init-cache-jobs] Errors:', errors);
    }

    return NextResponse.json({
      success: errors.length === 0,
      results,
      summary: {
        totalJobs,
        successfulJobs,
        failedJobs: totalJobs - successfulJobs,
        errors: errors.length > 0 ? errors : undefined
      },
      message: errors.length === 0 
        ? `Successfully scheduled ${successfulJobs} cache processing jobs`
        : `Scheduled ${successfulJobs}/${totalJobs} jobs with ${errors.length} errors`
    });

  } catch (error) {
    console.error('[POST /api/admin/init-cache-jobs] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * GET handler for checking the status of cache processing jobs
 */
export async function GET(request) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
      return NextResponse.json({ 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    // Return information about the cache processing system
    return NextResponse.json({
      success: true,
      jobs: {
        commentProcessing: {
          endpoint: '/api/actions/process-comments',
          schedule: 'Every 30 seconds',
          description: 'Processes pending comment operations from Redis cache to database'
        },
        likeProcessing: {
          endpoint: '/api/actions/process-likes',
          schedule: 'Every 30 seconds',
          description: 'Processes pending like operations from Redis cache to database'
        },
        hotCommentsRefresh: {
          endpoint: '/api/actions/refresh-hot-comments',
          schedule: 'Every 5 minutes',
          description: 'Refreshes hot comments cache for popular posts'
        }
      },
      endpoints: {
        manualProcessing: {
          comments: 'GET /api/actions/process-comments',
          likes: 'GET /api/actions/process-likes',
          hotComments: 'GET /api/actions/refresh-hot-comments'
        },
        cachedCounts: 'POST /api/posts/cached-counts',
        hotComments: 'GET /api/posts/[id]/hot-comments'
      },
      message: 'Cache processing system information'
    });

  } catch (error) {
    console.error('[GET /api/admin/init-cache-jobs] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
