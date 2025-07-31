import { createClient } from '@supabase/supabase-js';
import { getUserEmbedding } from './userEmbedding';

// Initialize Supabase client
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ?
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null;

/**
 * Perform vector similarity search using pgvector to find posts similar to a user's interests
 * @param {string} userId - User ID to get embedding for
 * @param {Object} options - Search options
 * @param {number} options.limit - Maximum number of posts to return (default: 1000)
 * @param {string[]} options.excludePostIds - Post IDs to exclude
 * @param {boolean} options.forceRefresh - Whether to force refresh the user embedding
 * @returns {Promise<Array<{post_id: string, similarity: number}>>} - Array of post IDs with similarity scores
 */
export async function vectorRecallByUserInterests(userId, options = {}) {
  const {
    limit = 1000,
    excludePostIds = [],
    forceRefresh = false
  } = options;

  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Get user embedding
    const userEmbedding = await getUserEmbedding(userId, forceRefresh);
    
    if (!userEmbedding) {
      console.log(`No embedding found for user ${userId}`);
      return [];
    }

    // Define the SQL query for vector similarity search using pgvector
    // This uses the <-> operator for L2 distance (or <=> for cosine distance)
    // We negate the distance to sort by similarity (closest first)
    const { data, error } = await supabase.rpc('match_posts_to_user', {
      user_embedding: userEmbedding,
      match_limit: limit,
      exclude_posts: excludePostIds
    });

    if (error) {
      console.error('Vector search error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error performing vector recall:', error);
    return [];
  }
}

/**
 * Perform vector similarity search directly using a custom embedding
 * @param {Array<number>} embedding - The embedding vector to search with
 * @param {Object} options - Search options
 * @param {number} options.limit - Maximum number of posts to return (default: 100)
 * @param {string[]} options.excludePostIds - Post IDs to exclude
 * @returns {Promise<Array<{post_id: string, similarity: number}>>} - Array of post IDs with similarity scores
 */
export async function vectorRecallByEmbedding(embedding, options = {}) {
  const {
    limit = 100,
    excludePostIds = []
  } = options;

  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    if (!embedding || !Array.isArray(embedding)) {
      throw new Error('Invalid embedding provided for search');
    }

    // Use the same RPC function but with direct embedding input
    const { data, error } = await supabase.rpc('match_posts_to_embedding', {
      query_embedding: embedding,
      match_limit: limit,
      exclude_posts: excludePostIds
    });

    if (error) {
      console.error('Vector search error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error performing vector recall:', error);
    return [];
  }
}

/**
 * Find similar posts to a specific post using vector similarity
 * @param {string} postId - ID of the post to find similar content to
 * @param {Object} options - Search options
 * @param {number} options.limit - Maximum number of similar posts to return (default: 10)
 * @param {string[]} options.excludePostIds - Post IDs to exclude
 * @returns {Promise<Array<{post_id: string, similarity: number}>>} - Array of similar post IDs with similarity scores
 */
export async function findSimilarPosts(postId, options = {}) {
  const {
    limit = 10,
    excludePostIds = []
  } = options;

  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Get the source post embedding
    const { data: postEmbedding, error: embeddingError } = await supabase
      .from('post_embeddings')
      .select('embedding')
      .eq('post_id', postId)
      .single();

    if (embeddingError || !postEmbedding || !postEmbedding.embedding) {
      console.error('Error getting post embedding:', embeddingError);
      return [];
    }

    // Make sure to exclude the source post ID
    const allExcludedIds = [...new Set([...excludePostIds, postId])];

    // Use the embedding to find similar posts
    return await vectorRecallByEmbedding(postEmbedding.embedding, {
      limit,
      excludePostIds: allExcludedIds
    });
  } catch (error) {
    console.error('Error finding similar posts:', error);
    return [];
  }
} 