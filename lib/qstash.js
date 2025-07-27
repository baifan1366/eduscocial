import { Client } from '@upstash/qstash';
import { verifySignatureEdge } from '@upstash/qstash/dist/nextjs';

// Initialize QStash client with better error handling
let qstashClientInstance = null;

try {
  if (process.env.QSTASH_TOKEN) {
    qstashClientInstance = new Client({
      token: process.env.QSTASH_TOKEN
    });
    console.log('QStash client initialized successfully');
  } else {
    console.warn('QSTASH_TOKEN environment variable not set - QStash functionality disabled');
  }
} catch (error) {
  console.error('Error initializing QStash client:', error);
}

// Export the client instance (may be null if initialization failed)
export const qstashClient = qstashClientInstance;

/**
 * Verify that a request came from QStash
 * @param {Request} request - The incoming request object
 * @returns {Promise<boolean>} - Whether the request signature is valid
 */
export async function verifyQStashSignature(request) {
  try {
    // Skip verification in development mode or if QStash is not configured
    if (process.env.NODE_ENV !== 'production' || !qstashClient) {
      return true;
    }
    
    if (!process.env.QSTASH_CURRENT_SIGNING_KEY || !process.env.QSTASH_NEXT_SIGNING_KEY) {
      console.error('QStash signing keys are not configured correctly');
      return false;
    }
    
    // Clone the request to avoid consuming the body
    const clonedRequest = request.clone();
    
    // Get the signature from header
    const signature = clonedRequest.headers.get('upstash-signature');
    
    if (!signature) {
      console.error('Missing QStash signature header');
      return false;
    }
    
    // Get the body as a string
    const body = await clonedRequest.text();
    
    // Verify the signature
    try {
      const isValid = await verifySignatureEdge({
        signature,
        body,
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
      });
      
      return isValid;
    } catch (verificationError) {
      console.error('QStash signature verification failed:', verificationError);
      return false;
    }
  } catch (error) {
    console.error('Error verifying QStash signature:', error);
    return false;
  }
}

/**
 * Schedule a job to be executed at a specific time
 * @param {string} url - The endpoint to call
 * @param {object} payload - The payload to send
 * @param {object} options - Additional options (delay, cron, etc)
 * @returns {Promise<object>} - The scheduled job response
 */
export async function scheduleJob(url, payload, options = {}) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    
    const response = await qstashClient.publishJSON({
      url: fullUrl,
      body: payload,
      ...options
    });
    
    return { 
      success: true, 
      messageId: response.messageId 
    };
  } catch (error) {
    console.error('Error scheduling QStash job:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Schedule a CRON job to be executed on a schedule
 * @param {string} url - The endpoint to call
 * @param {string} cron - The CRON schedule expression
 * @param {object} payload - The payload to send
 * @returns {Promise<object>} - The scheduled job response
 */
export async function scheduleCronJob(url, cron, payload = {}) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    
    const response = await qstashClient.publishJSON({
      url: fullUrl,
      body: payload,
      cron
    });
    
    return { 
      success: true, 
      scheduleId: response.scheduleId 
    };
  } catch (error) {
    console.error('Error scheduling QStash CRON job:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Schedule user embedding generation on a regular basis
 * @param {string} cronSchedule - CRON schedule expression (for every 2 hours)
 * @returns {Promise<object>} - The scheduled job response
 */
export async function scheduleUserEmbeddingGeneration(cronSchedule = '0 */2 * * *') {
  return scheduleCronJob(
    '/api/actions/batch-process',
    cronSchedule,
    { action: 'process_user_embeddings' }
  );
} 