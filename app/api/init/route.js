import { schedulePostPublishing, scheduleUserActionProcessing, scheduleUserEmbeddingGeneration, 
  scheduleRecommendationCacheWarming, scheduleRankingModelTraining, 
  scheduleColdStartContentRefresh, initializeRecommendationJobs } from '@/lib/qstash';

/**
 * API route to initialize scheduled jobs using QStash
 * This sets up:
 * 1. Post publishing job (every minute)
 * 2. User action batch processing (every few seconds)
 * 3. User embedding generation (every few hours)
 * 4. Recommendation cache warming (hourly)
 * 5. Ranking model training (daily)
 * 6. Cold start content refresh (every 6 hours)
 */
export async function GET(request) {
  try {
    // Authorization check (could be enhanced with proper auth in production)
    const authHeader = request.headers.get('authorization');
    const isAuthorized = 
      process.env.NODE_ENV !== 'production' || 
      (authHeader && authHeader === `Bearer ${process.env.ADMIN_API_KEY}`);
    
    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const results = {
      timestamp: new Date().toISOString(),
      schedules: {}
    };
    
    // Get initialization type from query params
    const url = new URL(request.url);
    const initType = url.searchParams.get('type');
    
    if (initType === 'recommendation') {
      // Initialize only recommendation system jobs
      try {
        const recResults = await initializeRecommendationJobs();
        results.schedules.recommendation = {
          success: true,
          details: recResults,
          message: 'Recommendation system jobs initialized successfully'
        };
      } catch (recError) {
        results.schedules.recommendation = {
          success: false,
          error: recError.message
        };
      }
    } else {
      // Initialize all scheduled jobs
      
      // Schedule post publishing (every minute)
      try {
        const publishSchedule = await schedulePostPublishing();
        results.schedules.postPublishing = {
          success: true,
          scheduleId: publishSchedule.scheduleId,
          message: 'Post publishing scheduled successfully (every minute)'
        };
      } catch (publishError) {
        results.schedules.postPublishing = {
          success: false,
          error: publishError.message
        };
      }
      
      // Schedule user action batch processing (every 10 seconds)
      try {
        const actionSchedule = await scheduleUserActionProcessing(10);
        results.schedules.userActions = {
          success: true,
          scheduleId: actionSchedule.scheduleId,
          message: 'User action processing scheduled successfully (every 10 seconds)'
        };
      } catch (actionError) {
        results.schedules.userActions = {
          success: false,
          error: actionError.message
        };
      }
      
      // Schedule user embedding generation (every 2 hours)
      try {
        const embeddingSchedule = await scheduleUserEmbeddingGeneration('0 */2 * * *');
        results.schedules.userEmbeddings = {
          success: true,
          scheduleId: embeddingSchedule.scheduleId,
          message: 'User embedding generation scheduled successfully (every 2 hours)'
        };
      } catch (embeddingError) {
        results.schedules.userEmbeddings = {
          success: false,
          error: embeddingError.message
        };
      }
      
      // Schedule recommendation cache warming (hourly)
      try {
        const cacheSchedule = await scheduleRecommendationCacheWarming('0 * * * *');
        results.schedules.cacheWarming = {
          success: true,
          scheduleId: cacheSchedule.scheduleId,
          message: 'Recommendation cache warming scheduled successfully (hourly)'
        };
      } catch (cacheError) {
        results.schedules.cacheWarming = {
          success: false,
          error: cacheError.message
        };
      }
      
      // Schedule ranking model training (daily at 3 AM)
      try {
        const modelSchedule = await scheduleRankingModelTraining('0 3 * * *');
        results.schedules.modelTraining = {
          success: true,
          scheduleId: modelSchedule.scheduleId,
          message: 'Ranking model training scheduled successfully (daily at 3 AM)'
        };
      } catch (modelError) {
        results.schedules.modelTraining = {
          success: false,
          error: modelError.message
        };
      }
      
      // Schedule cold start content refresh (every 6 hours)
      try {
        const coldStartSchedule = await scheduleColdStartContentRefresh('0 */6 * * *');
        results.schedules.coldStart = {
          success: true,
          scheduleId: coldStartSchedule.scheduleId,
          message: 'Cold start content refresh scheduled successfully (every 6 hours)'
        };
      } catch (coldStartError) {
        results.schedules.coldStart = {
          success: false,
          error: coldStartError.message
        };
      }
    }
    
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 