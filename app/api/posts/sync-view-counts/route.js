import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { syncPostViewCountToCache } from '@/lib/redis/redisUtils';

/**
 * POST handler to sync view counts from database to Redis cache
 * This is useful for fixing inconsistencies between database and cache
 */
export async function POST(request) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get all posts with their current view counts
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, view_count')
      .not('view_count', 'is', null);

    if (error) {
      console.error('[POST /api/posts/sync-view-counts] Database error:', error);
      return NextResponse.json({
        error: 'Failed to fetch posts from database',
        details: error.message
      }, { status: 500 });
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        message: 'No posts found to sync',
        synced: 0
      });
    }

    console.log(`[POST /api/posts/sync-view-counts] Syncing view counts for ${posts.length} posts`);

    // Sync each post's view count to Redis
    const syncResults = await Promise.allSettled(
      posts.map(async (post) => {
        const success = await syncPostViewCountToCache(post.id, post.view_count || 0);
        return {
          postId: post.id,
          viewCount: post.view_count || 0,
          success
        };
      })
    );

    // Count successful syncs
    const successful = syncResults.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;

    const failed = syncResults.length - successful;

    console.log(`[POST /api/posts/sync-view-counts] Sync completed: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      message: 'View count sync completed',
      totalPosts: posts.length,
      successful,
      failed,
      results: syncResults.map(result => ({
        status: result.status,
        ...(result.status === 'fulfilled' ? result.value : { error: result.reason?.message })
      }))
    });

  } catch (error) {
    console.error('[POST /api/posts/sync-view-counts] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * GET handler to check sync status
 */
export async function GET(request) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get a sample of posts to check sync status
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, view_count')
      .not('view_count', 'is', null)
      .limit(10);

    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch posts',
        details: error.message
      }, { status: 500 });
    }

    // Check cache status for sample posts
    const cacheStatus = await Promise.allSettled(
      posts.map(async (post) => {
        const { getCachedPostViewCount } = await import('@/lib/redis/redisUtils');
        const cachedCount = await getCachedPostViewCount(post.id);
        return {
          postId: post.id,
          dbCount: post.view_count || 0,
          cacheCount: cachedCount,
          synced: cachedCount === (post.view_count || 0)
        };
      })
    );

    const syncedCount = cacheStatus.filter(result => 
      result.status === 'fulfilled' && result.value.synced
    ).length;

    return NextResponse.json({
      message: 'Sync status check completed',
      sampleSize: posts.length,
      synced: syncedCount,
      syncPercentage: Math.round((syncedCount / posts.length) * 100),
      details: cacheStatus.map(result => ({
        status: result.status,
        ...(result.status === 'fulfilled' ? result.value : { error: result.reason?.message })
      }))
    });

  } catch (error) {
    console.error('[GET /api/posts/sync-view-counts] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
