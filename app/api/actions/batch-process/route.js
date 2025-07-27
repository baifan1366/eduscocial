import { verifyQStashSignature } from '@/lib/qstash';
import { processPendingUserActions } from '@/lib/redis/redisUtils';
import { findUsersForEmbeddingUpdate, processBatchUserEmbeddings } from '@/lib/userEmbedding';

const BATCH_SIZE = 50; // Max users to process in one batch

/**
 * POST handler for batch processing
 * This endpoint processes:
 * 1. Pending user actions from Redis
 * 2. User embeddings updates
 * 
 * It is designed to be called by QStash on a schedule.
 */
export async function POST(request) {
  try {
    // Verify the request is coming from QStash
    const isValid = await verifyQStashSignature(request);
    
    if (!isValid && process.env.NODE_ENV === 'production') {
      return new Response(JSON.stringify({ 
        error: 'Invalid signature' 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get the request parameters (if any)
    let requestParams = {};
    try {
      const requestBody = await request.json();
      requestParams = requestBody || {};
    } catch (e) {
      // No body or invalid JSON, proceed with defaults
      requestParams = {};
    }
    
    const { priorityUsers = [], lookbackDays = 7 } = requestParams;
    
    const results = {
      timestamp: new Date().toISOString(),
      actions: null,
      embeddings: null
    };
    
    // 1. Process pending user actions first
    try {
      const actionCount = await processPendingUserActions(BATCH_SIZE);
      results.actions = { processed: actionCount };
    } catch (actionError) {
      console.error('Error processing pending actions:', actionError);
      results.actions = { error: actionError.message };
    }
    
    // 2. Process user embeddings
    try {
      // Process priority users first (if specified)
      if (priorityUsers.length > 0) {
        const priorityResults = await processBatchUserEmbeddings(priorityUsers, {
          lookbackDays: 30, // Look back further for priority users
          forceRefresh: true
        });
        results.priorityEmbeddings = priorityResults;
      }
      
      // Find users who need embedding updates (active in the last N days)
      const userIds = await findUsersForEmbeddingUpdate(lookbackDays, BATCH_SIZE);
      
      // Exclude priority users that have already been processed
      const remainingUsers = userIds.filter(id => !priorityUsers.includes(id));
      
      if (remainingUsers.length > 0) {
        // Process user embeddings in batch
        const embeddingResults = await processBatchUserEmbeddings(remainingUsers);
        results.embeddings = embeddingResults;
      } else {
        results.embeddings = { message: 'No additional users found needing embedding updates' };
      }
    } catch (embeddingError) {
      console.error('Error processing user embeddings:', embeddingError);
      results.embeddings = { error: embeddingError.message };
    }
    
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Batch processing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * GET handler - For debugging and manual triggering
 * In production, this should be disabled or protected
 */
export async function GET(request) {
  // Only allow in development environment
  if (process.env.NODE_ENV !== 'development') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Find a small batch of users for testing
    const userIds = await findUsersForEmbeddingUpdate(30, 5); // Look back further and process fewer
    
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ message: 'No users found for embedding update' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Process just these users
    const results = await processBatchUserEmbeddings(userIds);
    
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