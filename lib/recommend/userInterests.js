import { createServerSupabaseClient } from '@/lib/supabase';
import redis from '@/lib/redis/redis';
import { updateInterestWeight, createInitialInterestWeight } from './scoring';

/**
 * Updates a user's interests based on their interaction with a post
 * Called from API routes that handle post interactions (like, favorite, etc.)
 * 
 * @param {string} userId - The user's ID
 * @param {string} postId - The post ID the user interacted with
 * @param {string} interactionType - Type of interaction ('like', 'dislike', 'favorite', 'view')
 * @returns {Promise<void>}
 */
export async function updateUserInterestsFromPost(userId, postId, interactionType) {
  const supabase = createServerSupabaseClient();
  
  try {
    // 1. Get post tags
    const { data: postTags, error: tagsError } = await supabase
      .from('post_hashtags')
      .select('hashtag_id')
      .eq('post_id', postId);
    
    if (tagsError || !postTags || postTags.length === 0) {
      console.log('No tags found for post or error:', tagsError);
      return;
    }
    
    const tagIds = postTags.map(tag => tag.hashtag_id);
    
    // 2. Get existing user interests
    const { data: existingInterests, error: interestsError } = await supabase
      .from('user_interests')
      .select('id, tag_id, weight')
      .eq('user_id', userId)
      .in('tag_id', tagIds);
    
    if (interestsError) {
      console.error('Error fetching user interests:', interestsError);
      return;
    }
    
    // 3. Create a map of existing interests for easier lookup
    const existingInterestsMap = {};
    existingInterests?.forEach(interest => {
      existingInterestsMap[interest.tag_id] = {
        id: interest.id,
        weight: interest.weight
      };
    });
    
    // 4. Update existing interests and track new ones to create
    const interestsToUpdate = [];
    const interestsToCreate = [];
    
    for (const tagId of tagIds) {
      if (existingInterestsMap[tagId]) {
        // Update existing interest
        const existingInterest = existingInterestsMap[tagId];
        const newWeight = updateInterestWeight(
          existingInterest.weight,
          interactionType
        );
        
        interestsToUpdate.push({
          id: existingInterest.id,
          weight: newWeight
        });
      } else {
        // Create new interest
        interestsToCreate.push({
          user_id: userId,
          tag_id: tagId,
          weight: createInitialInterestWeight(interactionType)
        });
      }
    }
    
    // 5. Perform updates in batch
    if (interestsToUpdate.length > 0) {
      const { error: updateError } = await supabase
        .from('user_interests')
        .upsert(interestsToUpdate);
      
      if (updateError) {
        console.error('Error updating user interests:', updateError);
      }
    }
    
    // 6. Create new interests in batch
    if (interestsToCreate.length > 0) {
      const { error: createError } = await supabase
        .from('user_interests')
        .insert(interestsToCreate);
      
      if (createError) {
        console.error('Error creating user interests:', createError);
      }
    }
    
    // 7. Invalidate user embedding and feed caches to reflect new interests
    await invalidateUserCaches(userId);
    
  } catch (error) {
    console.error('Error updating user interests:', error);
  }
}

/**
 * Applies time decay to all user interests periodically
 * This helps ensure that older interests gradually have less influence
 * Called by a scheduled job (e.g., daily cron)
 * 
 * @param {number} decayFactor - Factor to apply for decay (0-1)
 * @returns {Promise<void>}
 */
export async function applyInterestDecay(decayFactor = 0.98) {
  const supabase = createServerSupabaseClient();
  
  try {
    // Apply decay factor to all user interests
    const { error } = await supabase.rpc('apply_interest_decay', { 
      p_decay_factor: decayFactor 
    });
    
    if (error) {
      console.error('Error applying interest decay:', error);
    }
    
    console.log(`Applied interest decay with factor ${decayFactor}`);
  } catch (error) {
    console.error('Error in decay process:', error);
  }
}

/**
 * Invalidates user-specific caches when their interests change
 * 
 * @param {string} userId - The user's ID
 * @returns {Promise<void>}
 */
async function invalidateUserCaches(userId) {
  try {
    // Delete user embedding and feed caches
    await Promise.all([
      redis.del(`user:${userId}:embedding`),
      redis.del(`user:${userId}:feed`)
    ]);
  } catch (error) {
    console.error('Error invalidating user caches:', error);
  }
} 