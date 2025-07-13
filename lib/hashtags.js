import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * Process hashtags for a post - upsert hashtags and link them to the post
 * 
 * @param {string} postId - UUID of the post
 * @param {string[]} hashtags - Array of hashtag names (without the # symbol)
 * @param {string} userId - UUID of the user creating the post (for audit)
 * @returns {Promise<Array>} - Array of processed hashtag objects
 */
export async function processPostHashtags(postId, hashtags, userId) {
  if (!postId || !hashtags || !Array.isArray(hashtags) || hashtags.length === 0) {
    return [];
  }
  
  const supabase = createServerSupabaseClient();
  
  try {
    // Normalize hashtags - remove duplicates, trim whitespace, etc.
    const normalizedTags = normalizeHashtags(hashtags);
    
    if (normalizedTags.length === 0) {
      return [];
    }
    
    // Step 1: Upsert hashtags
    const { data: createdHashtags, error: upsertError } = await upsertHashtags(normalizedTags, userId);
    
    if (upsertError) {
      console.error('Error upserting hashtags:', upsertError);
      throw upsertError;
    }
    
    // Step 2: Link hashtags to post
    await linkHashtagsToPost(postId, createdHashtags, userId);
    
    return createdHashtags;
    
  } catch (error) {
    console.error('Error processing hashtags:', error);
    throw error;
  }
}

/**
 * Normalize an array of hashtags
 * - Remove duplicates
 * - Trim whitespace
 * - Remove empty strings
 * - Remove # prefix if present
 * - Limit length
 * 
 * @param {string[]} hashtags - Array of raw hashtag strings
 * @returns {string[]} - Array of normalized hashtag strings
 */
function normalizeHashtags(hashtags) {
  if (!hashtags || !Array.isArray(hashtags)) {
    return [];
  }
  
  const MAX_HASHTAG_LENGTH = 50;
  
  return [...new Set(
    hashtags
      .map(tag => {
        // Remove any leading # and trim whitespace
        return tag.replace(/^#/, '').trim().toLowerCase();
      })
      // Filter out empty strings
      .filter(tag => tag && tag.length > 0)
      // Truncate overly long tags
      .map(tag => tag.substring(0, MAX_HASHTAG_LENGTH))
  )];
}

/**
 * Extract hashtags from post content
 * Useful for auto-detecting hashtags from post content
 * 
 * @param {string} content - Post content to extract hashtags from
 * @returns {string[]} - Array of extracted hashtag strings (without # prefix)
 */
export function extractHashtagsFromContent(content) {
  if (!content || typeof content !== 'string') {
    return [];
  }
  
  // Match hashtags: #word boundary or #multi_word or #hyphenated-word
  // But exclude URLs, email addresses, etc.
  const hashtagRegex = /#([a-zA-Z0-9_-]+)(?=\s|$|[!.,;:?])/g;
  const matches = content.match(hashtagRegex);
  
  if (!matches) {
    return [];
  }
  
  // Remove # prefix and return unique values
  return [...new Set(
    matches.map(tag => tag.substring(1))
  )];
}

/**
 * Upsert hashtags to the hashtags table
 * 
 * @param {string[]} hashtagNames - Array of hashtag names
 * @param {string} userId - UUID of the user (for audit)
 * @returns {Promise<Object>} - Object containing data and error properties
 */
async function upsertHashtags(hashtagNames, userId) {
  if (!hashtagNames || hashtagNames.length === 0) {
    return { data: [] };
  }
  
  const supabase = createServerSupabaseClient();
  
  // First, check if hashtags already exist
  const { data: existingHashtags, error: queryError } = await supabase
    .from('hashtags')
    .select('id, name')
    .in('name', hashtagNames);
  
  if (queryError) {
    console.error('Error querying existing hashtags:', queryError);
    return { error: queryError };
  }
  
  // Create a map of existing hashtags by name
  const existingTagMap = {};
  if (existingHashtags) {
    existingHashtags.forEach(tag => {
      existingTagMap[tag.name] = tag;
    });
  }
  
  // Prepare list of tags that need to be created
  const tagsToCreate = [];
  hashtagNames.forEach(name => {
    if (!existingTagMap[name]) {
      tagsToCreate.push({
        name,
        created_by: userId,
        usage_count: 1 // Initial usage count
      });
    }
  });
  
  // Create new hashtags if needed
  let newlyCreatedTags = [];
  if (tagsToCreate.length > 0) {
    const { data: createdTags, error: createError } = await supabase
      .from('hashtags')
      .insert(tagsToCreate)
      .select('id, name');
    
    if (createError) {
      console.error('Error creating hashtags:', createError);
      return { error: createError };
    }
    
    newlyCreatedTags = createdTags || [];
  }
  
  // Increment usage_count for existing tags
  if (existingHashtags && existingHashtags.length > 0) {
    const existingTagIds = existingHashtags.map(tag => tag.id);
    
    // Use RPC to increment usage count
    const { error: incrementError } = await supabase
      .rpc('increment_hashtag_usage', {
        tag_ids: existingTagIds
      });
    
    if (incrementError) {
      console.error('Error incrementing hashtag usage count:', incrementError);
    }
  }
  
  // Combine existing and newly created tags
  const allTags = [
    ...(existingHashtags || []),
    ...newlyCreatedTags
  ];
  
  return { data: allTags };
}

/**
 * Link hashtags to a post in the post_hashtags table
 * 
 * @param {string} postId - UUID of the post
 * @param {Array} hashtags - Array of hashtag objects with id and name
 * @param {string} userId - UUID of the user (for audit)
 * @returns {Promise<Object>} - Result of the database operation
 */
async function linkHashtagsToPost(postId, hashtags, userId) {
  if (!postId || !hashtags || hashtags.length === 0) {
    return { data: null };
  }
  
  const supabase = createServerSupabaseClient();
  
  // Prepare links between post and hashtags
  const postHashtagLinks = hashtags.map(tag => ({
    post_id: postId,
    hashtag_id: tag.id,
    created_by: userId
  }));
  
  // Insert links
  return await supabase
    .from('post_hashtags')
    .upsert(postHashtagLinks, {
      onConflict: 'post_id,hashtag_id' // Based on your unique constraint
    });
} 