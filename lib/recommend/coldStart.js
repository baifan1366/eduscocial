import { createBrowserSupabaseClient } from '../supabase';
import { 
  getHotPosts, 
  cacheHotPosts, 
  getUserInterests,
  getPersonalizedRecommendations,
  cachePersonalizedRecommendations,
  isNewUser
} from '@/lib/redis/redisUtils';
import { calculatePostScore } from './scoring';

/**
 * Get trending posts for cold start
 * @param {number} limit - Number of posts to return
 * @returns {Promise<Array>} - Array of post objects
 */
export async function getTrendingPosts(limit = 20) {
  // Try to get from Redis cache first
  const cachedPosts = await getHotPosts();
  
  if (cachedPosts && cachedPosts.length >= limit) {
    return cachedPosts.slice(0, limit);
  }
  
  // If not cached or not enough posts, fetch from database
  const supabase = createBrowserSupabaseClient();
  
  // Get trending posts based on views, likes, and recency
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      content,
      created_at,
      author_id,
      users!posts_author_id_fkey(username, display_name, avatar_url),
      board_id,
      boards(name, slug),
      view_count,
      like_count,
      comment_count
    `)
    .eq('is_draft', false)
    .eq('is_deleted', false)
    .order('view_count', { ascending: false })
    .order('like_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching trending posts:', error);
    return cachedPosts || [];
  }
  
  // Cache the results for future use
  await cacheHotPosts(posts);
  
  return posts;
}

/**
 * Get trending tags
 * @param {number} limit - Number of tags to return
 * @returns {Promise<Array>} - Array of tag objects with counts
 */
export async function getTrendingTags(limit = 20) {
  const supabase = createBrowserSupabaseClient();
  
  const { data: tags, error } = await supabase
    .from('hashtags')
    .select('id, name, usage_count')
    .order('usage_count', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching trending tags:', error);
    return [];
  }
  
  return tags;
}

/**
 * Get topic categories
 * @returns {Promise<Array>} - Array of topic objects
 */
export async function getTopicCategories() {
  const supabase = createBrowserSupabaseClient();
  
  const { data: topics, error } = await supabase
    .from('topics')
    .select('id, name, description')
    .order('name');
  
  if (error) {
    console.error('Error fetching topics:', error);
    return [];
  }
  
  return topics;
}

/**
 * Save user interests to database and Redis
 * @param {string} userId - The user ID
 * @param {Array} selectedTopics - Array of topic IDs
 * @param {Array} selectedTags - Array of tag IDs
 * @returns {Promise<boolean>} - Success status
 */
export async function saveUserInterests(userId, selectedTopics = [], selectedTags = []) {
  const supabase = createBrowserSupabaseClient();
  
  try {
    // Process topics
    for (const topicId of selectedTopics) {
      await supabase.from('user_interests').upsert({
        user_id: userId,
        topic_id: topicId,
        weight: 1.0,
        created_by: userId
      });
    }
    
    // Process tags
    for (const tagId of selectedTags) {
      await supabase.from('user_interests').upsert({
        user_id: userId,
        tag_id: tagId,
        weight: 1.0,
        created_by: userId
      });
    }
    
    // Save to Redis for quick access
    const interests = {
      topics: selectedTopics,
      tags: selectedTags
    };
    
    await getUserInterests(userId, interests);
    
    return true;
  } catch (error) {
    console.error('Error saving user interests:', error);
    return false;
  }
}

/**
 * Get personalized posts for a user based on their interests
 * @param {string} userId - The user ID
 * @param {number} limit - Number of posts to return
 * @returns {Promise<Array>} - Array of post objects
 */
export async function getPersonalizedPosts(userId, limit = 20) {
  // Check if user has cached recommendations
  const cachedRecommendations = await getPersonalizedRecommendations(userId);
  
  if (cachedRecommendations && cachedRecommendations.length >= limit) {
    return cachedRecommendations.slice(0, limit);
  }
  
  // Check if user is new
  const isUserNew = await isNewUser(userId);
  
  if (isUserNew) {
    // For new users, return trending posts
    return getTrendingPosts(limit);
  }
  
  // Get user interests
  const interests = await getUserInterests(userId);
  
  if (!interests || (!interests.topics?.length && !interests.tags?.length)) {
    // If no interests found, return trending posts
    return getTrendingPosts(limit);
  }
  
  const supabase = createBrowserSupabaseClient();
  
  // Get posts related to user interests
  let query = supabase
    .from('posts')
    .select(`
      id,
      title,
      content,
      created_at,
      author_id,
      users!posts_author_id_fkey(username, display_name, avatar_url),
      board_id,
      boards(name, slug),
      view_count,
      like_count,
      comment_count
    `)
    .eq('is_draft', false)
    .eq('is_deleted', false);
  
  // Get posts related to user's topic interests
  if (interests.topics && interests.topics.length > 0) {
    // This would require custom SQL to join with the topics table
    // Simplified version - could be improved with real topic-post relationship
    // We'd need to create a view or function in the database for better implementation
  }
  
  // Get posts related to user's tag interests
  if (interests.tags && interests.tags.length > 0) {
    query = query.or(
      interests.tags.map(tagId => `post_hashtags.hashtag_id.eq.${tagId}`).join(',')
    ).join('post_hashtags', { 'posts.id': 'post_hashtags.post_id' });
  }
  
  // Fetch the data
  const { data: posts, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit * 2); // Fetch more posts than needed for scoring
  
  if (error) {
    console.error('Error fetching personalized posts:', error);
    return getTrendingPosts(limit); // Fallback to trending posts
  }
  
  // Score and rank posts based on user interests
  const scoredPosts = posts.map(post => ({
    ...post,
    score: calculatePostScore(post, interests)
  }));
  
  // Sort by score
  scoredPosts.sort((a, b) => b.score - a.score);
  
  // Take the top posts
  const topPosts = scoredPosts.slice(0, limit);
  
  // Cache the personalized recommendations
  await cachePersonalizedRecommendations(userId, topPosts);
  
  return topPosts;
}

/**
 * Get posts for the home page
 * @param {string|null} userId - The user ID (if authenticated)
 * @param {number} limit - Number of posts to return
 * @returns {Promise<Array>} - Array of post objects
 */
export async function getHomePagePosts(userId, limit = 20) {
  if (!userId) {
    // Not authenticated, return trending posts
    return getTrendingPosts(limit);
  }
  
  // Get personalized posts for authenticated users
  return getPersonalizedPosts(userId, limit);
} 