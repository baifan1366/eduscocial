import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ?
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null;

/**
 * Get post metadata for ranking
 * @param {string[]} postIds - Array of post IDs to fetch data for
 * @returns {Promise<Object>} - Map of post ID to metadata
 */
async function getPostMetadata(postIds) {
  if (!Array.isArray(postIds) || postIds.length === 0) {
    return {};
  }

  try {
    // Fetch post data in batches to avoid query size limits
    const batchSize = 100;
    const postMetadata = {};
    
    for (let i = 0; i < postIds.length; i += batchSize) {
      const batchIds = postIds.slice(i, i + batchSize);
      
      const { data: posts, error } = await supabase
        .from('posts')
        .select('id, like_count, comment_count, view_count, created_at')
        .in('id', batchIds);
        
      if (error) {
        console.error('Error fetching post metadata:', error);
        continue;
      }
      
      // Add to metadata map
      if (posts && posts.length > 0) {
        posts.forEach(post => {
          postMetadata[post.id] = post;
        });
      }
    }
    
    return postMetadata;
  } catch (error) {
    console.error('Error in getPostMetadata:', error);
    return {};
  }
}

/**
 * Calculate recency score based on post creation date
 * @param {string} createdAt - ISO date string of post creation
 * @param {number} decayDays - Number of days for half-life decay (default: 7)
 * @returns {number} - Score between 0-1, with 1 being most recent
 */
function calculateRecencyScore(createdAt, decayDays = 7) {
  const postDate = new Date(createdAt);
  const now = new Date();
  
  // Calculate days since post creation
  const msSinceCreation = now - postDate;
  const daysSinceCreation = msSinceCreation / (1000 * 60 * 60 * 24);
  
  // Apply exponential decay (half-life formula)
  return Math.exp(-Math.log(2) * daysSinceCreation / decayDays);
}

/**
 * Calculate engagement score based on likes, comments and views
 * @param {Object} postData - Post data with engagement metrics
 * @returns {number} - Score between 0-1, representing engagement level
 */
function calculateEngagementScore(postData) {
  const likes = postData.like_count || 0;
  const comments = postData.comment_count || 0;
  const views = postData.view_count || 0;
  
  // Prevent division by zero
  if (views === 0) return 0;
  
  // Weighted formula with diminishing returns
  // - Like weight: 1.0
  // - Comment weight: 3.0 (comments are more valuable engagement)
  // - Log transformation to handle viral posts more fairly
  const engagementRatio = (likes + (comments * 3)) / views;
  
  // Apply log normalization to handle varying scales
  return Math.min(1, Math.log(engagementRatio + 1) / Math.log(10));
}

/**
 * Apply rank boosting for diverse content
 * This prevents too many similar posts from dominating the recommendations
 * @param {Array} rankedPosts - Array of posts already scored
 * @returns {Array} - Re-ranked posts with diversity boosting
 */
function applyDiversityBoosting(rankedPosts) {
  // Simple diversity implementation: penalize posts from same board
  const boardsSeen = new Map();
  
  return rankedPosts.map(post => {
    // Skip posts without board_id (shouldn't happen)
    if (!post.board_id) return post;
    
    // Check if we've seen many posts from this board
    const boardCount = boardsSeen.get(post.board_id) || 0;
    boardsSeen.set(post.board_id, boardCount + 1);
    
    // Apply diversity penalty based on how many we've seen from this board
    const diversityFactor = Math.max(0.5, 1 - (boardCount * 0.1));
    
    return {
      ...post,
      // Adjust the ranking score with the diversity factor
      ranking_score: post.ranking_score * diversityFactor
    };
  });
}

/**
 * Rank posts based on multiple factors:
 * - Similarity from recall phase
 * - Engagement metrics (likes, comments, views)
 * - Recency
 * - Content diversity
 * 
 * @param {Array<{post_id: string, similarity: number}>} posts - Posts from recall phase
 * @param {Object} options - Ranking options
 * @param {number} options.similarityWeight - Weight for similarity score (default: 0.5)
 * @param {number} options.recencyWeight - Weight for recency score (default: 0.3)
 * @param {number} options.engagementWeight - Weight for engagement score (default: 0.2)
 * @param {boolean} options.applyDiversity - Whether to apply diversity boosting (default: true)
 * @returns {Promise<Array>} - Ranked posts with full data and ranking scores
 */
export async function rankPosts(posts, options = {}) {
  const {
    similarityWeight = 0.5,
    recencyWeight = 0.3,
    engagementWeight = 0.2,
    applyDiversity = true
  } = options;
  
  // Validate weight total is 1.0
  const totalWeight = similarityWeight + recencyWeight + engagementWeight;
  if (Math.abs(totalWeight - 1.0) > 0.001) {
    console.warn(`Warning: Ranking weights sum to ${totalWeight}, not 1.0`);
  }
  
  try {
    // Extract post IDs from the recall results
    const postIds = posts.map(post => post.post_id);
    
    // Create a map of post IDs to similarity scores
    const similarityMap = {};
    posts.forEach(post => {
      similarityMap[post.post_id] = post.similarity;
    });
    
    // Get post metadata for ranking
    const postMetadata = await getPostMetadata(postIds);
    
    // Fetch full post data
    const { data: fullPosts, error } = await supabase
      .from('posts')
      .select('*')
      .in('id', postIds);
      
    if (error) {
      console.error('Error fetching full posts:', error);
      return [];
    }
    
    // Calculate ranking scores
    let rankedPosts = fullPosts.map(post => {
      // Get similarity score from map (default to 0 if not found)
      const similarityScore = similarityMap[post.id] || 0;
      
      // Calculate other scoring factors
      const recencyScore = calculateRecencyScore(post.created_at);
      const engagementScore = calculateEngagementScore(postMetadata[post.id] || {});
      
      // Final weighted score
      const rankingScore = 
        (similarityScore * similarityWeight) +
        (recencyScore * recencyWeight) +
        (engagementScore * engagementWeight);
      
      return {
        ...post,
        ranking_score: rankingScore,
        ranking_factors: {
          similarity: similarityScore,
          recency: recencyScore,
          engagement: engagementScore
        }
      };
    });
    
    // Sort by ranking score (highest first)
    rankedPosts.sort((a, b) => b.ranking_score - a.ranking_score);
    
    // Apply diversity boosting if enabled
    if (applyDiversity) {
      rankedPosts = applyDiversityBoosting(rankedPosts);
      // Re-sort after diversity adjustment
      rankedPosts.sort((a, b) => b.ranking_score - a.ranking_score);
    }
    
    return rankedPosts;
  } catch (error) {
    console.error('Error in rankPosts:', error);
    return [];
  }
}

/**
 * Rank posts with personalization based on user history
 * 
 * @param {string} userId - User ID for personalization
 * @param {Array<{post_id: string, similarity: number}>} posts - Posts from recall phase
 * @param {Object} options - Ranking options (same as rankPosts)
 * @returns {Promise<Array>} - Ranked posts with personalization applied
 */
export async function rankPostsPersonalized(userId, posts, options = {}) {
  try {
    // First, get the basic ranking
    let rankedPosts = await rankPosts(posts, options);
    
    // If no user ID provided, return basic ranking
    if (!userId) return rankedPosts;
    
    // Get user interaction history
    const { data: userActions, error } = await supabase
      .from('action_log')
      .select('action, target_id')
      .eq('user_id', userId)
      .in('action', ['view_post', 'like_post', 'dislike_post', 'bookmark_post'])
      .order('occurred_at', { ascending: false })
      .limit(200);
      
    if (error) {
      console.error('Error fetching user actions:', error);
      return rankedPosts; // Return basic ranking on error
    }
    
    if (!userActions || userActions.length === 0) {
      return rankedPosts; // No history, return basic ranking
    }
    
    // Process user history
    const likedPosts = new Set();
    const dislikedPosts = new Set();
    const viewedPosts = new Set();
    const bookmarkedPosts = new Set();
    
    userActions.forEach(action => {
      if (action.action === 'like_post') likedPosts.add(action.target_id);
      if (action.action === 'dislike_post') dislikedPosts.add(action.target_id);
      if (action.action === 'view_post') viewedPosts.add(action.target_id);
      if (action.action === 'bookmark_post') bookmarkedPosts.add(action.target_id);
    });
    
    // Apply personalized adjustments
    rankedPosts = rankedPosts.map(post => {
      let personalBoost = 0;
      
      // Boost posts with similar topics/boards to posts the user has liked
      if (likedPosts.has(post.id)) {
        personalBoost += 0.05; // Small boost for previously liked posts
      }
      
      // Penalize topics/boards the user has actively disliked
      if (dislikedPosts.has(post.id)) {
        personalBoost -= 0.2; // Significant penalty for disliked posts
      }
      
      // Apply moderate boost for bookmarked content
      if (bookmarkedPosts.has(post.id)) {
        personalBoost += 0.1;
      }
      
      return {
        ...post,
        ranking_score: post.ranking_score * (1 + personalBoost)
      };
    });
    
    // Re-sort after personalization
    rankedPosts.sort((a, b) => b.ranking_score - a.ranking_score);
    
    return rankedPosts;
  } catch (error) {
    console.error('Error in rankPostsPersonalized:', error);
    // Fallback to basic ranking if personalization fails
    return await rankPosts(posts, options);
  }
}

/**
 * Get default ranking parameters based on user or global settings
 * @param {string} userId - User ID to get preferences for
 * @returns {Promise<Object>} - Ranking parameters
 */
export async function getDefaultRankingParameters(userId = null) {
  try {
    let parameters = {
      similarityWeight: 0.5,
      recencyWeight: 0.3,
      engagementWeight: 0.2,
      applyDiversity: true
    };
    
    // If userId provided, try to get user preferences
    if (userId) {
      const { data: userPrefs, error } = await supabase
        .from('user_preferences')
        .select('settings')
        .eq('user_id', userId)
        .single();
        
      if (!error && userPrefs && userPrefs.settings && userPrefs.settings.ranking) {
        // Override defaults with user preferences
        parameters = {
          ...parameters,
          ...userPrefs.settings.ranking
        };
      }
    }
    
    return parameters;
  } catch (error) {
    console.error('Error getting ranking parameters:', error);
    // Return defaults on error
    return {
      similarityWeight: 0.5,
      recencyWeight: 0.3,
      engagementWeight: 0.2,
      applyDiversity: true
    };
  }
} 