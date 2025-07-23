import { createClient } from '@supabase/supabase-js';
import { calculateSimilarity } from './embedding';

// Initialize Supabase client
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ?
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null;

// Redis client for caching and operations
import redis from './redis/redis';

/**
 * Calculate user interest embedding based on their interaction history
 * @param {string} userId - User ID to generate embedding for
 * @param {Object} options - Options for embedding generation
 * @param {number} options.lookbackDays - Number of days to look back for user actions (default: 30)
 * @param {boolean} options.storeInDb - Whether to store the result in database (default: true)
 * @param {boolean} options.storeInRedis - Whether to store the result in Redis (default: true)
 * @returns {Promise<Object>} - Result containing the generated embedding and metadata
 */
export async function generateUserInterestEmbedding(userId, options = {}) {
  const {
    lookbackDays = 30,
    storeInDb = true,
    storeInRedis = true
  } = options;
  
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Calculate the date to look back to
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);
    const lookbackDateStr = lookbackDate.toISOString();

    // 1. Get user's interactions from action_log
    const { data: actions, error: actionsError } = await supabase
      .from('action_log')
      .select('*')
      .eq('user_id', userId)
      .gte('occurred_at', lookbackDateStr)
      .in('action', ['view_post', 'like_post', 'bookmark_post', 'comment_post', 'share_post'])
      .in('target_table', ['posts']);
    
    if (actionsError) {
      throw new Error(`Error fetching user actions: ${actionsError.message}`);
    }
    
    if (!actions || actions.length === 0) {
      console.log(`No recent actions found for user ${userId}`);
      return { success: false, reason: 'no_actions' };
    }

    // 2. Extract post IDs from actions
    const postActions = {};
    const postIds = new Set();
    
    // Track interactions by post and count them by type
    actions.forEach(action => {
      if (action.target_id && action.target_table === 'posts') {
        const postId = action.target_id;
        postIds.add(postId);
        
        if (!postActions[postId]) {
          postActions[postId] = { 
            views: 0, 
            likes: 0, 
            comments: 0, 
            bookmarks: 0, 
            shares: 0 
          };
        }
        
        // Increment the appropriate counter
        switch (action.action) {
          case 'view_post':
            postActions[postId].views += 1;
            break;
          case 'like_post':
            postActions[postId].likes += 1;
            break;
          case 'comment_post':
            postActions[postId].comments += 1;
            break;
          case 'bookmark_post':
            postActions[postId].bookmarks += 1;
            break;
          case 'share_post':
            postActions[postId].shares += 1;
            break;
        }
      }
    });

    // 3. Get post embeddings for these posts
    const { data: postEmbeddings, error: embeddingError } = await supabase
      .from('post_embeddings')
      .select('post_id, embedding')
      .in('post_id', Array.from(postIds));
    
    if (embeddingError) {
      throw new Error(`Error fetching post embeddings: ${embeddingError.message}`);
    }
    
    if (!postEmbeddings || postEmbeddings.length === 0) {
      console.log(`No embeddings found for posts interacted with by user ${userId}`);
      return { success: false, reason: 'no_embeddings' };
    }

    // 4. Calculate weighted average of post embeddings
    // Define weights for different interaction types
    const INTERACTION_WEIGHTS = {
      views: 1,
      likes: 5,
      comments: 8,
      bookmarks: 7,
      shares: 10
    };

    // Initialize the embedding vector with zeros
    let embeddingDimension = postEmbeddings[0]?.embedding?.length || 384;
    let userEmbedding = new Array(embeddingDimension).fill(0);
    let totalWeight = 0;

    // Calculate weighted sum of embeddings
    postEmbeddings.forEach(post => {
      if (!post.embedding) return;
      
      const postId = post.post_id;
      const actions = postActions[postId];
      if (!actions) return;
      
      // Calculate total weight for this post based on interactions
      const postWeight = 
        (actions.views * INTERACTION_WEIGHTS.views) +
        (actions.likes * INTERACTION_WEIGHTS.likes) +
        (actions.comments * INTERACTION_WEIGHTS.comments) +
        (actions.bookmarks * INTERACTION_WEIGHTS.bookmarks) +
        (actions.shares * INTERACTION_WEIGHTS.shares);
      
      // Add weighted embedding to user embedding
      for (let i = 0; i < embeddingDimension; i++) {
        userEmbedding[i] += post.embedding[i] * postWeight;
      }
      
      totalWeight += postWeight;
    });

    // Normalize the embedding if we have interactions
    if (totalWeight > 0) {
      userEmbedding = userEmbedding.map(val => val / totalWeight);
    } else {
      return { success: false, reason: 'no_weighted_actions' };
    }

    // 5. Store the user embedding in the database
    const userEmbeddingData = {
      user_id: userId,
      embedding: userEmbedding,
      model_version: 'user-interest-v1', // Version tracking for model changes
      generated_at: new Date().toISOString(),
      created_by: userId
    };

    const results = { success: true };

    if (storeInDb) {
      // Upsert the user embedding
      const { error: upsertError } = await supabase
        .from('user_embeddings')
        .upsert(userEmbeddingData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        });
      
      if (upsertError) {
        console.error(`Error storing user embedding in database: ${upsertError.message}`);
        results.dbStoreError = upsertError.message;
        results.success = false;
      } else {
        results.dbStored = true;
      }
    }

    // 6. Store the user embedding in Redis for faster access
    if (storeInRedis) {
      try {
        const redisKey = `user:${userId}:embedding`;
        await redis.set(redisKey, JSON.stringify(userEmbedding));
        
        // Set expiration (7 days)
        await redis.expire(redisKey, 60 * 60 * 24 * 7);
        
        results.redisStored = true;
      } catch (redisError) {
        console.error(`Error storing user embedding in Redis: ${redisError.message}`);
        results.redisStoreError = redisError.message;
      }
    }

    results.embedding = userEmbedding;
    results.interactionCounts = postActions;
    results.timestamp = new Date().toISOString();
    
    return results;
    
  } catch (error) {
    console.error(`Error generating user interest embedding: ${error.message}`);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Process multiple users' embeddings in batch
 * @param {string[]} userIds - Array of user IDs to process
 * @param {Object} options - Options for batch processing
 * @returns {Promise<Object>} - Batch processing results
 */
export async function processBatchUserEmbeddings(userIds, options = {}) {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
    processed: []
  };

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return { ...results, error: 'No user IDs provided' };
  }

  // Process each user sequentially to avoid overloading the database
  for (const userId of userIds) {
    try {
      const userResult = await generateUserInterestEmbedding(userId, options);
      
      if (userResult.success) {
        results.success++;
        results.processed.push(userId);
      } else {
        results.failed++;
        results.errors.push({ 
          userId, 
          reason: userResult.reason || userResult.error || 'unknown_error' 
        });
      }
    } catch (error) {
      results.failed++;
      results.errors.push({ 
        userId, 
        error: error.message 
      });
    }
  }

  return results;
}

/**
 * Find all users who need their embeddings updated
 * @param {number} days - Look for users active in the last X days
 * @param {number} limit - Maximum number of users to return
 * @returns {Promise<string[]>} - Array of user IDs
 */
export async function findUsersForEmbeddingUpdate(days = 7, limit = 100) {
  try {
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - days);
    
    // Find users with recent activity
    const { data: activeUsers, error: activeError } = await supabase
      .from('action_log')
      .select('user_id, occurred_at')
      .gte('occurred_at', lookbackDate.toISOString())
      .not('user_id', 'is', null)
      .order('occurred_at', { ascending: false })
      .limit(limit * 3); // Get more than we need to account for duplicates
    
    if (activeError) {
      throw new Error(`Error finding active users: ${activeError.message}`);
    }
    
    // Extract unique user IDs
    const uniqueUserIds = [...new Set(activeUsers.map(u => u.user_id))];
    
    // Limit to the requested number
    return uniqueUserIds.slice(0, limit);
    
  } catch (error) {
    console.error(`Error finding users for embedding update: ${error.message}`);
    return [];
  }
}

/**
 * Get a user's interest embedding from Redis (fast) or database
 * @param {string} userId - User ID to get embedding for
 * @param {boolean} forceRefresh - If true, bypass cache and generate a new embedding
 * @returns {Promise<Array<number>|null>} - User embedding array or null if not found
 */
export async function getUserEmbedding(userId, forceRefresh = false) {
  if (!userId) return null;
  
  try {
    // If force refresh, generate a new embedding
    if (forceRefresh) {
      const result = await generateUserInterestEmbedding(userId);
      return result.success ? result.embedding : null;
    }
    
    // First try to get from Redis cache
    const redisKey = `user:${userId}:embedding`;
    const cachedEmbedding = await redis.get(redisKey);
    
    if (cachedEmbedding) {
      // Parse the cached embedding and return
      return JSON.parse(cachedEmbedding);
    }
    
    // If not in Redis, try to get from database
    if (supabase) {
      const { data, error } = await supabase
        .from('user_embeddings')
        .select('embedding')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error || !data) {
        // If not found or error, try to generate on the fly
        const result = await generateUserInterestEmbedding(userId);
        return result.success ? result.embedding : null;
      }
      
      // Store in Redis cache for next time
      if (data.embedding) {
        await redis.set(redisKey, JSON.stringify(data.embedding));
        await redis.expire(redisKey, 60 * 60 * 24 * 7); // 7 days
        return data.embedding;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting user embedding: ${error.message}`);
    return null;
  }
}

/**
 * Find similar users based on embedding similarity
 * @param {string} userId - User ID to find similar users for
 * @param {Object} options - Options for similarity search
 * @param {number} options.limit - Maximum number of similar users to return (default: 10)
 * @param {number} options.threshold - Similarity threshold (0-1, default: 0.5)
 * @returns {Promise<Array<{user_id: string, similarity: number}>>} - Array of similar users with similarity scores
 */
export async function findSimilarUsers(userId, options = {}) {
  const { limit = 10, threshold = 0.5 } = options;
  
  try {
    // Get the user's embedding
    const userEmbedding = await getUserEmbedding(userId);
    
    if (!userEmbedding) {
      return [];
    }
    
    // Query all user embeddings (in a production system, this would use a vector database for efficiency)
    const { data: userEmbeddings, error } = await supabase
      .from('user_embeddings')
      .select('user_id, embedding')
      .neq('user_id', userId); // Exclude the current user
    
    if (error || !userEmbeddings) {
      console.error('Error fetching user embeddings:', error);
      return [];
    }
    
    // Calculate similarity with each user
    const similarUsers = userEmbeddings
      .map(otherUser => {
        if (!otherUser.embedding) return null;
        
        const similarity = calculateSimilarity(userEmbedding, otherUser.embedding);
        return {
          user_id: otherUser.user_id,
          similarity
        };
      })
      .filter(item => item && item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return similarUsers;
  } catch (error) {
    console.error(`Error finding similar users: ${error.message}`);
    return [];
  }
}

/**
 * Get personalized post recommendations for a user based on their embedding
 * @param {string} userId - User ID to get recommendations for
 * @param {Object} options - Options for recommendations
 * @param {number} options.limit - Maximum number of recommendations (default: 20)
 * @param {number} options.threshold - Similarity threshold (0-1, default: 0.3)
 * @param {string[]} options.excludePostIds - Post IDs to exclude (e.g., already seen)
 * @returns {Promise<Array<{post_id: string, similarity: number}>>} - Array of recommended posts with similarity scores
 */
export async function getPersonalizedRecommendations(userId, options = {}) {
  const { 
    limit = 20, 
    threshold = 0.3, 
    excludePostIds = [] 
  } = options;
  
  try {
    // Get the user's embedding
    const userEmbedding = await getUserEmbedding(userId);
    
    if (!userEmbedding) {
      return [];
    }
    
    // Convert exclude array to Set for faster lookups
    const excludeSet = new Set(excludePostIds);
    
    // Get embeddings for recent posts
    // In a production system, this would use a vector database for efficient similarity search
    const { data: postEmbeddings, error } = await supabase
      .from('post_embeddings')
      .select('post_id, embedding, posts:post_id(created_at)')
      .order('posts.created_at', { ascending: false })
      .limit(500); // Get a larger batch to filter from
    
    if (error || !postEmbeddings) {
      console.error('Error fetching post embeddings:', error);
      return [];
    }
    
    // Calculate similarity with each post
    const recommendations = postEmbeddings
      .filter(post => post.embedding && !excludeSet.has(post.post_id))
      .map(post => {
        const similarity = calculateSimilarity(userEmbedding, post.embedding);
        return {
          post_id: post.post_id,
          similarity
        };
      })
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return recommendations;
  } catch (error) {
    console.error(`Error getting personalized recommendations: ${error.message}`);
    return [];
  }
} 