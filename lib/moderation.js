import { createServerSupabaseClient } from '@/lib/supabase';
import { Client } from '@upstash/qstash';
import redis from '@/lib/redis/redis';
import { generateEmbedding } from '@/lib/embedding';

/**
 * Content moderation utility functions
 * Provides text and media content moderation capabilities
 */

// List of prohibited terms for basic moderation
// Note: In production, you would use a much more comprehensive list or external API
const PROHIBITED_TERMS = [
  'spam', 'scam', 'illegal', 'offensive', 'abuse',
  // Add more prohibited terms as needed
];

/**
 * Check if content contains prohibited terms
 * @param {string} text - Text to check
 * @returns {boolean} True if prohibited content found
 */
export function containsProhibitedContent(text) {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  return PROHIBITED_TERMS.some(term => lowerText.includes(term.toLowerCase()));
}

/**
 * Perform comprehensive content violation check
 * @param {Object} content - Content object with fields to check
 * @param {string} content.title - Content title
 * @param {string} content.content - Main content text
 * @param {Array} [content.media] - Optional media items
 * @returns {Object} Result with violation details
 */
export async function checkContentViolations(content) {
  const violations = [];
  let hasViolations = false;
  
  // Check title for prohibited content
  if (content.title && containsProhibitedContent(content.title)) {
    violations.push({
      field: 'title',
      reason: 'Contains prohibited terms'
    });
    hasViolations = true;
  }
  
  // Check main content for prohibited content
  if (content.content && containsProhibitedContent(content.content)) {
    violations.push({
      field: 'content',
      reason: 'Contains prohibited terms'
    });
    hasViolations = true;
  }
  
  // Check media items if provided (placeholder for future implementation)
  if (content.media && Array.isArray(content.media)) {
    // In a production system, you would implement media checking here
    // For example, using image recognition APIs for inappropriate content
  }
  
  // Return results
  return {
    hasViolations,
    violations,
    passedInitialCheck: !hasViolations
  };
}

/**
 * Log moderation action to the database
 * @param {string} contentId - ID of the content
 * @param {string} contentType - Type of content (post, comment, etc.)
 * @param {string} moderationType - Type of moderation (text, image, etc.)
 * @param {string} status - Moderation status (pending, approved, rejected)
 * @param {Object} details - Additional details about the moderation
 * @returns {Promise<void>}
 */
export async function logModerationAction(contentId, contentType, moderationType, status, details = {}) {
  try {
    // In production, you would insert this into a moderation_audit_log table
    console.log('Moderation action logged:', {
      content_id: contentId,
      content_type: contentType,
      moderation_type: moderationType,
      status,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging moderation action:', error);
  }
}

/**
 * Process moderation result and update content status
 * @param {string} contentId - ID of the content
 * @param {string} contentType - Type of content (post, comment, etc.)
 * @param {Object} moderationResult - Result from moderation service
 * @returns {Promise<Object>} Updated content status
 */
export async function processModerationResult(contentId, contentType, moderationResult) {
  // Implementation would update the status in the database based on the moderation result
  // This is a placeholder for the actual implementation
  
  const status = moderationResult.approved ? 'approved' : 'rejected';
  
  // Log the moderation action
  await logModerationAction(contentId, contentType, 'text', status, {
    reasons: moderationResult.reasons || [],
    score: moderationResult.score || 0
  });
  
  return {
    contentId,
    contentType,
    status,
    updated: true
  };
}

/**
 * Perform text moderation on post content
 * @param {string} postId - Post ID
 * @param {string} content - Text content to moderate
 * @param {string} title - Post title
 * @param {string} userId - User ID who created the post
 * @returns {Promise<Object>} - Moderation result
 */
export async function moderatePostText(postId, content, title, userId) {
  try {
    const supabase = createServerSupabaseClient();
    const combinedText = `${title} ${content}`;
    
    // Insert moderation record with pending status
    const { data: moderationRecord, error: moderationError } = await supabase
      .from('content_moderation')
      .insert({
        content_type: 'post',
        content_id: postId,
        moderation_type: 'text',
        status: 'pending',
      })
      .select()
      .single();
    
    if (moderationError) {
      console.error('Error creating moderation record:', moderationError);
      throw moderationError;
    }
    
    // Call external moderation API (placeholder, implement actual API call)
    const moderationResult = await performTextModeration(combinedText);
    
    // Update moderation record with results
    const { error: updateError } = await supabase
      .from('content_moderation')
      .update({
        status: moderationResult.isFlagged ? 'flagged' : 'approved',
        flagged_categories: moderationResult.categories || null,
        confidence_scores: moderationResult.scores || null,
        rejection_reason: moderationResult.reason || null,
        moderated_at: new Date().toISOString(),
      })
      .eq('id', moderationRecord.id);
    
    if (updateError) {
      console.error('Error updating moderation record:', updateError);
    }
    
    // Log audit entry
    await logModerationAudit(
      'post', 
      postId, 
      'text', 
      moderationResult.model || 'text-moderation',
      moderationResult.isFlagged ? 'flagged' : 'safe',
      moderationResult.categories,
      moderationResult.scores
    );
    
    // If content is flagged, handle post takedown
    if (moderationResult.isFlagged) {
      await takeDownPost(postId, userId, moderationResult.reason || 'Content policy violation');
    } else {
      // If content is safe, adjust post weight for visibility
      await adjustPostWeight(postId, 1.0); // Default weight for approved content
    }
    
    return {
      id: moderationRecord.id,
      isFlagged: moderationResult.isFlagged,
      categories: moderationResult.categories,
      reason: moderationResult.reason
    };
  } catch (error) {
    console.error('Text moderation error:', error);
    throw error;
  }
}

/**
 * Perform video moderation on post media
 * @param {string} postId - Post ID
 * @param {string} mediaUrl - URL to video media
 * @param {string} userId - User ID who created the post
 * @returns {Promise<Object>} - Moderation result
 */
export async function moderatePostVideo(postId, mediaUrl, userId) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Insert moderation record with pending status
    const { data: moderationRecord, error: moderationError } = await supabase
      .from('content_moderation')
      .insert({
        content_type: 'post',
        content_id: postId,
        moderation_type: 'video',
        status: 'pending',
      })
      .select()
      .single();
    
    if (moderationError) {
      console.error('Error creating video moderation record:', moderationError);
      throw moderationError;
    }
    
    // Call external video moderation API (placeholder, implement actual API call)
    const moderationResult = await performVideoModeration(mediaUrl);
    
    // Update moderation record with results
    const { error: updateError } = await supabase
      .from('content_moderation')
      .update({
        status: moderationResult.isFlagged ? 'flagged' : 'approved',
        flagged_categories: moderationResult.categories || null,
        confidence_scores: moderationResult.scores || null,
        rejection_reason: moderationResult.reason || null,
        moderated_at: new Date().toISOString(),
      })
      .eq('id', moderationRecord.id);
    
    if (updateError) {
      console.error('Error updating video moderation record:', updateError);
    }
    
    // Log audit entry
    await logModerationAudit(
      'post', 
      postId, 
      'video', 
      moderationResult.model || 'video-moderation',
      moderationResult.isFlagged ? 'flagged' : 'safe',
      moderationResult.categories,
      moderationResult.scores
    );
    
    // If content is flagged, handle post takedown
    if (moderationResult.isFlagged) {
      await takeDownPost(postId, userId, moderationResult.reason || 'Video content policy violation');
    }
    
    return {
      id: moderationRecord.id,
      isFlagged: moderationResult.isFlagged,
      categories: moderationResult.categories,
      reason: moderationResult.reason
    };
  } catch (error) {
    console.error('Video moderation error:', error);
    throw error;
  }
}

/**
 * Log moderation audit entry
 * @param {string} contentType - Type of content ('post', 'comment', 'media')
 * @param {string} contentId - Content ID
 * @param {string} moderationType - Type of moderation ('text', 'video', 'image', 'audio')
 * @param {string} model - Model name used for moderation
 * @param {string} resultStatus - Result status ('flagged', 'safe', 'manual_review')
 * @param {string[]} flaggedCategories - Categories flagged by moderation
 * @param {Object} confidenceScores - Confidence scores for each category
 * @returns {Promise<void>}
 */
async function logModerationAudit(
  contentType, 
  contentId, 
  moderationType, 
  model, 
  resultStatus, 
  flaggedCategories = null,
  confidenceScores = null
) {
  try {
    const supabase = createServerSupabaseClient();
    
    await supabase
      .from('moderation_audit_log')
      .insert({
        content_type: contentType,
        content_id: contentId,
        moderation_type: moderationType,
        model_name: model,
        result_status: resultStatus,
        flagged_categories: flaggedCategories,
        confidence_scores: confidenceScores
      });
  } catch (error) {
    console.error('Error logging moderation audit:', error);
    // Non-blocking, continue execution
  }
}

/**
 * Take down a post that violates content policy
 * @param {string} postId - Post ID to take down
 * @param {string} userId - User ID who created the post
 * @param {string} reason - Reason for takedown
 * @returns {Promise<void>}
 */
async function takeDownPost(postId, userId, reason) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Mark post as deleted
    await supabase
      .from('posts')
      .update({ is_deleted: true })
      .eq('id', postId);
    
    // Log visibility change
    await supabase
      .from('post_visibility_log')
      .insert({
        post_id: postId,
        action: 'hidden',
        reason: reason,
        weight_change: -1,
        triggered_by: null // System triggered
      });
    
    // Send notification to user
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'system',
        title: 'Post Removed',
        content: `Your post has been removed due to content policy violation: ${reason}`,
        post_id: postId,
        is_read: false,
      });
    
    // Invalidate feed caches
    const cacheKey = `user:${userId}:feed`;
    await redis.del(cacheKey);
  } catch (error) {
    console.error('Error taking down post:', error);
    throw error;
  }
}

/**
 * Adjust post weight for recommendation
 * @param {string} postId - Post ID to adjust
 * @param {number} weight - Weight factor to apply
 * @returns {Promise<void>}
 */
async function adjustPostWeight(postId, weight) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Log weight adjustment
    await supabase
      .from('post_visibility_log')
      .insert({
        post_id: postId,
        action: weight > 0 ? 'boosted' : 'demoted',
        reason: 'Moderation result',
        weight_change: weight,
        triggered_by: null // System triggered
      });
  } catch (error) {
    console.error('Error adjusting post weight:', error);
    // Non-blocking, continue execution
  }
}

/**
 * Update user interests based on post content
 * @param {string} userId - User ID
 * @param {string} postId - Post ID
 * @param {string[]} hashtags - Post hashtags
 * @param {string[]} topics - Post topics
 * @returns {Promise<void>}
 */
export async function updateUserInterests(userId, postId, hashtags = [], topics = []) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get existing interests
    const { data: existingInterests, error: interestError } = await supabase
      .from('user_interests')
      .select('id, tag_id, topic_id, weight')
      .eq('user_id', userId);
    
    if (interestError) {
      console.error('Error fetching user interests:', interestError);
      return;
    }
    
    // Update hashtag weights
    if (hashtags && hashtags.length > 0) {
      for (const tag of hashtags) {
        // Get tag ID
        const { data: tagData } = await supabase
          .from('hashtags')
          .select('id')
          .eq('name', tag.toLowerCase())
          .single();
        
        if (!tagData) continue;
        
        const existingInterest = existingInterests?.find(i => i.tag_id === tagData.id);
        
        if (existingInterest) {
          // Update existing interest
          await supabase
            .from('user_interests')
            .update({ weight: existingInterest.weight + 0.1 })
            .eq('id', existingInterest.id);
        } else {
          // Create new interest
          await supabase
            .from('user_interests')
            .insert({
              user_id: userId,
              tag_id: tagData.id,
              weight: 1.0,
              created_by: userId
            });
        }
      }
    }
    
    // Update topic weights (similar to hashtags)
    if (topics && topics.length > 0) {
      for (const topic of topics) {
        // Get topic ID
        const { data: topicData } = await supabase
          .from('topics')
          .select('id')
          .eq('name', topic.toLowerCase())
          .single();
        
        if (!topicData) continue;
        
        const existingInterest = existingInterests?.find(i => i.topic_id === topicData.id);
        
        if (existingInterest) {
          // Update existing interest
          await supabase
            .from('user_interests')
            .update({ weight: existingInterest.weight + 0.1 })
            .eq('id', existingInterest.id);
        } else {
          // Create new interest
          await supabase
            .from('user_interests')
            .insert({
              user_id: userId,
              topic_id: topicData.id,
              weight: 1.0,
              created_by: userId
            });
        }
      }
    }
    
    // Invalidate interest cache
    await redis.del(`user:${userId}:interests`);
    
  } catch (error) {
    console.error('Error updating user interests:', error);
    // Non-blocking, continue execution
  }
}

/**
 * Update user embedding based on post content
 * @param {string} userId - User ID
 * @param {string} postContent - Post content
 * @param {string} postTitle - Post title
 * @returns {Promise<void>}
 */
export async function updateUserEmbedding(userId, postContent, postTitle) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Generate embedding for post content
    const postEmbedding = await generateEmbedding(`${postTitle} ${postContent}`);
    if (!postEmbedding) return;
    
    // Get existing user embedding
    const { data: existingEmbedding } = await supabase
      .from('user_embeddings')
      .select('embedding')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (existingEmbedding?.embedding) {
      // Blend new embedding with existing (70% existing, 30% new)
      const blendedEmbedding = blendEmbeddings(existingEmbedding.embedding, postEmbedding, 0.7, 0.3);
      
      // Update user embedding
      await supabase
        .from('user_embeddings')
        .update({
          embedding: blendedEmbedding,
          model_version: 'intfloat/e5-small', // Update with your model version
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      // Create new user embedding
      await supabase
        .from('user_embeddings')
        .insert({
          user_id: userId,
          embedding: postEmbedding,
          model_version: 'intfloat/e5-small', // Update with your model version
          created_by: userId
        });
    }
    
    // Invalidate embedding cache
    await redis.del(`user:${userId}:embedding`);
    
  } catch (error) {
    console.error('Error updating user embedding:', error);
    // Non-blocking, continue execution
  }
}

/**
 * Blend two embeddings with specified weights
 * @param {number[]} embedding1 - First embedding
 * @param {number[]} embedding2 - Second embedding
 * @param {number} weight1 - Weight for first embedding (0-1)
 * @param {number} weight2 - Weight for second embedding (0-1)
 * @returns {number[]} - Blended embedding
 */
function blendEmbeddings(embedding1, embedding2, weight1 = 0.5, weight2 = 0.5) {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same dimensions');
  }
  
  const blended = [];
  for (let i = 0; i < embedding1.length; i++) {
    blended[i] = weight1 * embedding1[i] + weight2 * embedding2[i];
  }
  
  // Normalize the blended embedding
  const magnitude = Math.sqrt(blended.reduce((sum, val) => sum + val * val, 0));
  return blended.map(val => val / magnitude);
}

/**
 * Placeholder for external text moderation API call
 * Replace with actual API implementation
 */
async function performTextModeration(text) {
  try {
    const response = await fetch('https://text-moderation-server.onrender.com/text-moderate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ input: text })
    });

    if (!response.ok) {
      throw new Error(`Text moderation API error: ${response.status}`);
    }

    // API returns a string response that we need to parse for moderation status
    const result = await response.text();
    
    // Determine if content is flagged based on the response
    // This is a simple example - you might need to adjust based on actual API response
    const isFlagged = result.toLowerCase().includes('inappropriate') || 
                     result.toLowerCase().includes('offensive') ||
                     result.toLowerCase().includes('violation');
    
    return {
      isFlagged,
      categories: isFlagged ? ['inappropriate_content'] : [],
      scores: { inappropriate: isFlagged ? 0.8 : 0.1 },
      reason: isFlagged ? result : null,
      model: 'text-moderation-service'
    };
  } catch (error) {
    console.error('Text moderation API error:', error);
    // Fail safe - if API errors, don't flag content
    return {
      isFlagged: false,
      categories: [],
      scores: {},
      reason: null,
      model: 'text-moderation-service'
    };
  }
}

/**
 * Placeholder for external video moderation API call
 * Replace with actual API implementation
 */
async function performVideoModeration(videoUrl) {
  try {
    const response = await fetch('https://video-moderation-server.onrender.com/video-moderation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ images: [videoUrl] })
    });

    if (!response.ok) {
      throw new Error(`Video moderation API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      isFlagged: data.flagged,
      categories: data.results.filter(result => result === true).length > 0 ? ['inappropriate_content'] : [],
      scores: { inappropriate: data.flagged ? 0.9 : 0.1 },
      reason: data.flagged ? 'Video content violates community guidelines' : null,
      model: 'video-moderation-service'
    };
  } catch (error) {
    console.error('Video moderation API error:', error);
    // Fail safe - if API errors, don't flag content
    return {
      isFlagged: false,
      categories: [],
      scores: {},
      reason: null,
      model: 'video-moderation-service'
    };
  }
}

/**
 * Queue content moderation jobs
 * @param {string} postId - Post ID
 * @param {string} content - Post content
 * @param {string} title - Post title
 * @param {string} userId - User ID
 * @param {Array<Object>} media - Array of media objects with URLs
 * @returns {Promise<void>}
 */
export async function queueContentModeration(postId, content, title, userId, media = []) {
  try {
    const qstashClient = new Client({
      token: process.env.UPSTASH_QSTASH_TOKEN
    });
    
    // Queue text moderation
    await qstashClient.publishJSON({
      url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/audit/text/route`,
      body: {
        postId,
        content,
        title,
        userId
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Queue video moderation for each video
    const videos = media.filter(m => m.media_type === 'video');
    for (const video of videos) {
      await qstashClient.publishJSON({
        url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/audit/video/route`,
        body: {
          postId,
          mediaUrl: video.file_url,
          userId
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Error queuing content moderation:', error);
    // Non-blocking, continue execution
  }
} 