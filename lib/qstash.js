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
    const body = await request.text();
    
    // Clone the request with the original body for further processing
    request = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body,
    });
    
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