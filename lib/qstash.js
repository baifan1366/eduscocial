import { Client } from '@upstash/qstash';

/**
 * Create a QStash client for scheduling tasks
 * Requires QSTASH_TOKEN and QSTASH_CURRENT_SIGNING_KEY environment variables
 */
const qstashClient = new Client({
  token: process.env.UPSTASH_QSTASH_TOKEN
});

/**
 * Schedule post publishing job to run every minute
 * This should be called during app initialization or in a setup script
 * 
 * @returns {Promise<Object>} - QStash scheduling result
 */
export async function schedulePostPublishing() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Schedule post publishing to run every minute
    const result = await qstashClient.schedules.create({
      destination: `${baseUrl}/api/posts/publish`,
      cron: '* * * * *', // Every minute
    });
    
    console.log('Scheduled post publishing job:', result);
    return result;
  } catch (error) {
    console.error('Error scheduling post publishing job:', error);
    throw error;
  }
}

/**
 * Schedule user action batch processing job to run every few seconds
 * This should be called during app initialization or in a setup script
 * 
 * @param {number} intervalSeconds - Interval in seconds between each run (default: 5)
 * @returns {Promise<Object>} - QStash scheduling result
 */
export async function scheduleUserActionProcessing(intervalSeconds = 5) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // For intervals less than 60 seconds, we use the interval feature instead of cron
    const result = await qstashClient.schedules.create({
      destination: `${baseUrl}/api/actions/batch-process`,
      interval: `${intervalSeconds}s`, // Every N seconds
    });
    
    console.log(`Scheduled user action batch processing job (every ${intervalSeconds}s):`, result);
    return result;
  } catch (error) {
    console.error('Error scheduling user action batch processing job:', error);
    throw error;
  }
}

/**
 * Schedule user embedding generation job
 * This job updates user interest embeddings based on their recent activity
 * 
 * @param {string} schedule - Cron schedule string (default: every 2 hours)
 * @returns {Promise<Object>} - QStash scheduling result
 */
export async function scheduleUserEmbeddingGeneration(schedule = '0 */2 * * *') {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Schedule user embedding generation using cron
    const result = await qstashClient.schedules.create({
      destination: `${baseUrl}/api/actions/batch-process`,
      cron: schedule, // Default: every 2 hours
    });
    
    console.log(`Scheduled user embedding generation job (${schedule}):`, result);
    return result;
  } catch (error) {
    console.error('Error scheduling user embedding generation job:', error);
    throw error;
  }
}

/**
 * Schedule recommendation cache warming job for active users
 * Pre-computes recommendations for active users to improve response times
 * 
 * @param {string} schedule - Cron schedule string (default: hourly)
 * @returns {Promise<Object>} - QStash scheduling result
 */
export async function scheduleRecommendationCacheWarming(schedule = '0 * * * *') {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Schedule cache warming job
    const result = await qstashClient.schedules.create({
      destination: `${baseUrl}/api/recommend/cache/warm`,
      cron: schedule, // Default: hourly
    });
    
    console.log(`Scheduled recommendation cache warming job (${schedule}):`, result);
    return result;
  } catch (error) {
    console.error('Error scheduling recommendation cache warming job:', error);
    throw error;
  }
}

/**
 * Schedule ranking model training job
 * Re-trains the recommendation ranking model based on recent user data
 * 
 * @param {string} schedule - Cron schedule string (default: daily at 3 AM)
 * @returns {Promise<Object>} - QStash scheduling result
 */
export async function scheduleRankingModelTraining(schedule = '0 3 * * *') {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Schedule model training job
    const result = await qstashClient.schedules.create({
      destination: `${baseUrl}/api/recommend/model/train`,
      cron: schedule, // Default: daily at 3 AM
    });
    
    console.log(`Scheduled ranking model training job (${schedule}):`, result);
    return result;
  } catch (error) {
    console.error('Error scheduling ranking model training job:', error);
    throw error;
  }
}

/**
 * Schedule cold-start content refreshing
 * Updates popular content lists for new users and refreshes trending content
 * 
 * @param {string} schedule - Cron schedule string (default: every 6 hours)
 * @returns {Promise<Object>} - QStash scheduling result
 */
export async function scheduleColdStartContentRefresh(schedule = '0 */6 * * *') {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Schedule cold start content refresh
    const result = await qstashClient.schedules.create({
      destination: `${baseUrl}/api/recommend/cold-start/refresh`,
      cron: schedule, // Default: every 6 hours
    });
    
    console.log(`Scheduled cold start content refresh job (${schedule}):`, result);
    return result;
  } catch (error) {
    console.error('Error scheduling cold start content refresh job:', error);
    throw error;
  }
}

/**
 * Initialize all recommendation system scheduled jobs
 * @returns {Promise<Object>} - Results of all scheduling operations
 */
export async function initializeRecommendationJobs() {
  const results = {};
  
  try {
    // Schedule user embedding updates (every 2 hours)
    results.userEmbedding = await scheduleUserEmbeddingGeneration('0 */2 * * *');
    
    // Schedule recommendation cache warming (hourly)
    results.cacheWarming = await scheduleRecommendationCacheWarming('0 * * * *');
    
    // Schedule model training (daily at 3 AM)
    results.modelTraining = await scheduleRankingModelTraining('0 3 * * *');
    
    // Schedule cold start content refresh (every 6 hours)
    results.coldStart = await scheduleColdStartContentRefresh('0 */6 * * *');
    
    console.log('Successfully initialized all recommendation system jobs');
    return results;
  } catch (error) {
    console.error('Error initializing recommendation jobs:', error);
    throw error;
  }
}

/**
 * Verify that a request came from QStash
 * 
 * @param {Request} request - The incoming request object
 * @returns {Promise<boolean>} - True if the request is authentic
 */
export async function verifyQStashSignature(request) {
  try {
    // If not in production, skip verification
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    
    const signature = request.headers.get('upstash-signature');
    const body = await request.clone().text();
    
    // Verify signature using QStash's verification method
    const isValid = await qstashClient.verify({
      signature,
      body,
      currentSigningKey: process.env.UPSTASH_QSTASH_CURRENT_SIGNING_KEY,
      previousSigningKey: process.env.UPSTASH_QSTASH_PREVIOUS_SIGNING_KEY,
    });
    
    return isValid;
  } catch (error) {
    console.error('Error verifying QStash signature:', error);
    return false;
  }
}

export default qstashClient; 