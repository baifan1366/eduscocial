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