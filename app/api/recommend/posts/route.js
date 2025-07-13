import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import redis from '@/lib/redis/redis';
import { getSession } from '@/lib/auth';
import { calculateCombinedScore } from '@/lib/recommend/scoring';

const CACHE_TTL = 60 * 30; // 30 minutes
const MAX_RECOMMENDATIONS = 20;

/**
 * GET handler for post recommendations
 * Returns personalized post recommendations for the authenticated user
 * 
 * Query parameters:
 * - limit: Number of recommendations to return (default: 20)
 * - refresh: Force refresh recommendations cache (default: false)
 */
export async function GET(request) {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || MAX_RECOMMENDATIONS);
    const refresh = url.searchParams.get('refresh') === 'true';
    
    // Check if recommendations are cached in Redis
    const cacheKey = `user:${userId}:feed`;
    
    if (!refresh) {
      const cachedRecommendations = await redis.get(cacheKey);
      if (cachedRecommendations) {
        return NextResponse.json({ 
          posts: cachedRecommendations.slice(0, limit),
          cached: true
        });
      }
    }

    // Get personalized recommendations
    const posts = await getRecommendedPosts(userId, limit);
    
    // Cache recommendations
    await redis.set(cacheKey, posts, { ex: CACHE_TTL });
    
    return NextResponse.json({ posts, cached: false });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

/**
 * Retrieves recommended posts for a user based on their interests and post embeddings
 * 
 * @param {string} userId - The user's ID
 * @param {number} limit - Maximum number of posts to return
 * @returns {Promise<Array>} - Array of recommended posts
 */
async function getRecommendedPosts(userId, limit) {
  const supabase = createServerSupabaseClient();
  
  // 1. Get user interests with weights
  const { data: userInterests, error: interestsError } = await supabase
    .from('user_interests')
    .select(`
      id,
      weight,
      tag_id,
      topic_id,
      hashtags(name),
      topics(name)
    `)
    .eq('user_id', userId);
  
  if (interestsError) {
    console.error('Error fetching user interests:', interestsError);
    throw new Error('Failed to fetch user interests');
  }
  
  if (!userInterests || userInterests.length === 0) {
    // Fall back to popular posts if no interests are found
    return getDefaultRecommendations(limit);
  }
  
  // Extract tags and topics
  const tagIds = userInterests
    .filter(interest => interest.tag_id)
    .map(interest => interest.tag_id);
  
  const topicIds = userInterests
    .filter(interest => interest.topic_id)
    .map(interest => interest.topic_id);
  
  // 2. Get the user embedding (average of liked/favorited posts)
  const userEmbedding = await getUserEmbedding(userId);
  
  // 3. Get candidate posts with relevant tags/topics
  const { data: candidatePosts, error: postsError } = await supabase
    .rpc('get_recommended_posts', {
      p_user_id: userId,
      p_tag_ids: tagIds,
      p_topic_ids: topicIds,
      p_limit: limit * 3 // Get more candidates than needed for better filtering
    });
  
  if (postsError) {
    console.error('Error fetching candidate posts:', postsError);
    throw new Error('Failed to fetch candidate posts');
  }
  
  if (!candidatePosts || candidatePosts.length === 0) {
    return getDefaultRecommendations(limit);
  }
  
  // 4. Calculate scores and sort posts
  const scoredPosts = await calculatePostScores(
    candidatePosts, 
    userInterests,
    userEmbedding
  );
  
  // Return top N posts
  return scoredPosts.slice(0, limit);
}

/**
 * Calculates the scores for posts based on interest matching and vector similarity
 * 
 * @param {Array} posts - Candidate posts
 * @param {Array} userInterests - User interests with weights
 * @param {Array} userEmbedding - User's embedding vector
 * @returns {Array} - Scored and sorted posts
 */
async function calculatePostScores(posts, userInterests, userEmbedding) {
  const supabase = createServerSupabaseClient();
  
  // Create maps for faster lookup
  const tagWeights = {};
  const topicWeights = {};
  
  userInterests.forEach(interest => {
    if (interest.tag_id) {
      tagWeights[interest.tag_id] = interest.weight;
    }
    if (interest.topic_id) {
      topicWeights[interest.topic_id] = interest.weight;
    }
  });
  
  // Get post embeddings
  const postIds = posts.map(post => post.id);
  const { data: embeddings, error: embeddingError } = await supabase
    .from('post_embeddings')
    .select('post_id, embedding')
    .in('post_id', postIds);
  
  if (embeddingError) {
    console.error('Error fetching post embeddings:', embeddingError);
    // Continue without embeddings
  }
  
  const embeddingMap = {};
  if (embeddings) {
    embeddings.forEach(item => {
      embeddingMap[item.post_id] = item.embedding;
    });
  }
  
  // Get post tags
  const { data: postTags, error: tagsError } = await supabase
    .from('post_hashtags')
    .select('post_id, hashtag_id')
    .in('post_id', postIds);
  
  if (tagsError) {
    console.error('Error fetching post tags:', tagsError);
    // Continue without tags
  }
  
  const postTagsMap = {};
  if (postTags) {
    postTags.forEach(item => {
      if (!postTagsMap[item.post_id]) {
        postTagsMap[item.post_id] = [];
      }
      postTagsMap[item.post_id].push(item.hashtag_id);
    });
  }
  
  // Calculate scores for each post
  const scoredPosts = posts.map(post => {
    const postEmbedding = embeddingMap[post.id];
    const postTags = postTagsMap[post.id] || [];
    
    // Calculate interest weight score (tag-based)
    let interestWeightScore = 0;
    let matchCount = 0;
    
    postTags.forEach(tagId => {
      if (tagWeights[tagId]) {
        interestWeightScore += tagWeights[tagId];
        matchCount++;
      }
    });
    
    // Normalize interest weight score
    if (matchCount > 0) {
      interestWeightScore = interestWeightScore / matchCount;
    }
    
    // Calculate embedding similarity score
    let embeddingSimilarityScore = 0;
    if (userEmbedding && postEmbedding) {
      embeddingSimilarityScore = calculateCosineSimilarity(userEmbedding, postEmbedding);
    }
    
    // Calculate combined score with weights
    const combinedScore = calculateCombinedScore(
      interestWeightScore,
      embeddingSimilarityScore
    );
    
    return {
      ...post,
      score: combinedScore,
      interestScore: interestWeightScore,
      similarityScore: embeddingSimilarityScore
    };
  });
  
  // Sort by score (highest first)
  return scoredPosts.sort((a, b) => b.score - a.score);
}

/**
 * Gets default recommendations when user interests are not available
 * 
 * @param {number} limit - Maximum number of posts to return
 * @returns {Promise<Array>} - Array of recommended posts
 */
async function getDefaultRecommendations(limit) {
  const supabase = createServerSupabaseClient();
  
  // Get popular posts from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { data: popularPosts, error } = await supabase
    .from('posts')
    .select(`
      id, 
      title, 
      content,
      author_id,
      board_id,
      created_at,
      view_count,
      like_count,
      comment_count
    `)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('like_count', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching popular posts:', error);
    throw new Error('Failed to fetch popular posts');
  }
  
  return popularPosts || [];
}

/**
 * Calculates a user's embedding vector based on their liked and favorited posts
 * 
 * @param {string} userId - The user's ID
 * @returns {Promise<Array|null>} - User's embedding vector or null if not available
 */
async function getUserEmbedding(userId) {
  const supabase = createServerSupabaseClient();
  
  // Check if we have a cached user embedding
  const userEmbeddingKey = `user:${userId}:embedding`;
  const cachedEmbedding = await redis.get(userEmbeddingKey);
  
  if (cachedEmbedding) {
    return cachedEmbedding;
  }
  
  // Get posts that the user has liked or favorited
  const { data: likedPosts, error: likesError } = await supabase
    .from('votes')
    .select('post_id')
    .eq('user_id', userId)
    .eq('vote_type', 'like')
    .is('comment_id', null);
    
  if (likesError) {
    console.error('Error fetching liked posts:', likesError);
    return null;
  }
  
  const { data: favoritePosts, error: favsError } = await supabase
    .from('favorites')
    .select('post_id')
    .eq('user_id', userId);
    
  if (favsError) {
    console.error('Error fetching favorite posts:', favsError);
    return null;
  }
  
  // Combine unique post IDs
  const postIds = new Set();
  
  likedPosts?.forEach(item => postIds.add(item.post_id));
  favoritePosts?.forEach(item => postIds.add(item.post_id));
  
  if (postIds.size === 0) {
    return null;
  }
  
  // Get embeddings for these posts
  const { data: embeddings, error: embeddingError } = await supabase
    .from('post_embeddings')
    .select('embedding')
    .in('post_id', Array.from(postIds))
    .not('embedding', 'is', null);
  
  if (embeddingError || !embeddings || embeddings.length === 0) {
    console.error('Error fetching post embeddings:', embeddingError);
    return null;
  }
  
  // Calculate average embedding
  const averageEmbedding = calculateAverageEmbedding(
    embeddings.map(item => item.embedding)
  );
  
  // Cache user embedding
  await redis.set(userEmbeddingKey, averageEmbedding, { ex: 60 * 60 * 24 }); // 24 hour cache
  
  return averageEmbedding;
}

/**
 * Calculates the average embedding from a list of embeddings
 * 
 * @param {Array<Array<number>>} embeddings - List of embedding vectors
 * @returns {Array<number>} - Average embedding vector
 */
function calculateAverageEmbedding(embeddings) {
  if (!embeddings || embeddings.length === 0) {
    return null;
  }
  
  const dimension = embeddings[0].length;
  const result = new Array(dimension).fill(0);
  
  embeddings.forEach(embedding => {
    for (let i = 0; i < dimension; i++) {
      result[i] += embedding[i];
    }
  });
  
  for (let i = 0; i < dimension; i++) {
    result[i] /= embeddings.length;
  }
  
  return result;
}

/**
 * Calculates cosine similarity between two vectors
 * 
 * @param {Array<number>} vec1 - First vector
 * @param {Array<number>} vec2 - Second vector
 * @returns {number} - Cosine similarity (0-1)
 */
function calculateCosineSimilarity(vec1, vec2) {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }
  
  return dotProduct / (mag1 * mag2);
}
