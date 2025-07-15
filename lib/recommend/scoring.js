/**
 * Calculates a combined recommendation score based on interest weight and embedding similarity
 * Using the formula: score = 0.6 * interestScore + 0.4 * similarityScore
 * 
 * @param {number} interestScore - Score based on matching user interests (0-1)
 * @param {number} similarityScore - Score based on embedding similarity (0-1)
 * @returns {number} - Combined recommendation score (0-1)
 */
export function calculateCombinedScore(interestScore, similarityScore) {
  // Weights for each component
  const INTEREST_WEIGHT = 0.6;
  const SIMILARITY_WEIGHT = 0.4;
  
  // Ensure inputs are valid numbers in range 0-1
  const validInterestScore = Number.isFinite(interestScore) ? 
    Math.max(0, Math.min(1, interestScore)) : 0;
  
  const validSimilarityScore = Number.isFinite(similarityScore) ? 
    Math.max(0, Math.min(1, similarityScore)) : 0;
  
  // Calculate combined score
  return (validInterestScore * INTEREST_WEIGHT) + 
         (validSimilarityScore * SIMILARITY_WEIGHT);
}

/**
 * Updates a user's interest weight based on their interaction with a post
 * 
 * @param {number} currentWeight - Current weight value (0-1)
 * @param {string} interactionType - Type of interaction ('like', 'dislike', 'favorite', 'view')
 * @param {number} decayFactor - Factor for time decay (0-1)
 * @returns {number} - Updated interest weight (0-1)
 */
export function updateInterestWeight(currentWeight, interactionType, decayFactor = 0.9) {
  // Define weight adjustments for each interaction type
  const weightAdjustments = {
    'like': 0.05,
    'favorite': 0.1,
    'dislike': -0.05,
    'view': 0.01
  };
  
  // Get adjustment value or default to 0
  const adjustment = weightAdjustments[interactionType] || 0;
  
  // Apply time decay to current weight
  const decayedWeight = currentWeight * decayFactor;
  
  // Apply adjustment
  let updatedWeight = decayedWeight + adjustment;
  
  // Ensure weight stays within 0-1 range
  return Math.max(0, Math.min(1, updatedWeight));
}

/**
 * Calculate recency boost for posts based on their creation date
 * Newer posts get higher scores
 * 
 * @param {Date} postDate - Creation date of the post
 * @param {number} maxAgeDays - Maximum age in days for recency consideration
 * @returns {number} - Recency score (0-1)
 */
export function calculateRecencyScore(postDate, maxAgeDays = 30) {
  const now = new Date();
  const postDateTime = new Date(postDate);
  
  // Calculate age in milliseconds
  const ageMs = now - postDateTime;
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  
  // If post is older than maxAgeDays, return 0
  if (ageMs > maxAgeMs) {
    return 0;
  }
  
  // Inverse linear score (1 for brand new, 0 for maxAgeDays old)
  return 1 - (ageMs / maxAgeMs);
}

/**
 * Create an initial interest weight for a new user interest
 * 
 * @param {string} interactionType - Type of first interaction ('like', 'favorite', etc.)
 * @returns {number} - Initial interest weight (0-1)
 */
export function createInitialInterestWeight(interactionType) {
  const initialWeights = {
    'like': 0.5,
    'favorite': 0.7,
    'follow': 0.6,
    'view': 0.3
  };
  
  return initialWeights[interactionType] || 0.4;
} 

/**
 * Calculate relevance score of a post based on user interests
 * @param {object} post - Post object to score
 * @param {object} userInterests - User's interests object with topics and tags
 * @returns {number} - Relevance score
 */
export function calculatePostScore(post, userInterests) {
  let score = 0;
  
  // Base score from popularity metrics
  score += (post.view_count || 0) * 0.01; // 1 point per 100 views
  score += (post.like_count || 0) * 0.5;  // 0.5 points per like
  score += (post.comment_count || 0) * 0.3; // 0.3 points per comment
  
  // Recency boost - posts in the last 24 hours get a boost
  const now = new Date();
  const postDate = new Date(post.created_at);
  const hoursSincePosted = (now - postDate) / (1000 * 60 * 60);
  
  if (hoursSincePosted < 24) {
    score += 10 * (1 - hoursSincePosted / 24); // Linear decay from 10 bonus points
  }
  
  // If we have user interests to consider
  if (userInterests) {
    // Topic matching (would need a way to link posts to topics)
    if (userInterests.topics && userInterests.topics.length > 0) {
      // This is a simplified version - in a real implementation, 
      // you would have a proper way to link posts to topics
      if (post.topic_id && userInterests.topics.includes(post.topic_id)) {
        score += 15; // Big boost for topic match
      }
    }
    
    // Tag matching 
    if (userInterests.tags && userInterests.tags.length > 0 && post.hashtags) {
      // This assumes post.hashtags is an array of tag IDs
      // In real implementation, you might need to join with post_hashtags table
      const matchingTags = post.hashtags.filter(tagId => 
        userInterests.tags.includes(tagId)
      );
      
      score += matchingTags.length * 5; // 5 points per matching tag
    }
  }
  
  return score;
}

/**
 * Calculate diversity score to ensure variety in recommendations
 * @param {object} post - Post object to score
 * @param {Array} alreadyRecommended - Array of already recommended post IDs
 * @returns {number} - Diversity score penalty
 */
export function calculateDiversityScore(post, alreadyRecommended) {
  let diversityPenalty = 0;
  
  // Penalize posts from the same board if we already have many
  const sameBoardPosts = alreadyRecommended.filter(
    p => p.board_id === post.board_id
  );
  
  diversityPenalty += sameBoardPosts.length * 2; // 2 points penalty per post from same board
  
  // Penalize posts from the same author
  const sameAuthorPosts = alreadyRecommended.filter(
    p => p.author_id === post.author_id
  );
  
  diversityPenalty += sameAuthorPosts.length * 3; // 3 points penalty per post from same author
  
  return diversityPenalty;
}

/**
 * Get final recommendation score, combining relevance and diversity
 * @param {object} post - Post object to score
 * @param {object} userInterests - User's interests object
 * @param {Array} alreadyRecommended - Array of already recommended posts
 * @returns {number} - Final recommendation score
 */
export function getRecommendationScore(post, userInterests, alreadyRecommended = []) {
  const relevanceScore = calculatePostScore(post, userInterests);
  const diversityPenalty = calculateDiversityScore(post, alreadyRecommended);
  
  return relevanceScore - diversityPenalty;
} 