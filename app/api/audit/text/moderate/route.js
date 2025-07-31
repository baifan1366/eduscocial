import { createClient } from '@supabase/supabase-js';
import { verifyQStashSignature } from '@/lib/qstash';
import { logModerationAction } from '@/lib/moderation';

// Initialize Supabase client
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ?
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null;

/**
 * POST handler for text content moderation
 * This endpoint receives content moderation requests from QStash
 * and processes them asynchronously
 */
export async function POST(request) {
  try {
    // Verify QStash signature for security
    const isValidRequest = await verifyQStashSignature(request);
    
    if (!isValidRequest && process.env.NODE_ENV === 'production') {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized: Invalid signature' 
      }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse request body
    let data;
    try {
      data = await request.json();
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON payload' 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { content_id, content_type, user_id, text, metadata = {} } = data;
    
    if (!content_id || !content_type || !text) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: content_id, content_type, or text' 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Insert initial moderation record
    const moderationRecord = {
      content_type: content_type,
      content_id: content_id,
      moderation_type: 'text',
      status: 'pending',
      model_name: 'text-moderation-v1',
    };
    
    const { data: insertedRecord, error: insertError } = await supabase
      .from('content_moderation')
      .insert(moderationRecord)
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting moderation record:', insertError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create moderation record' 
      }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Record moderation action for auditing
    await logModerationAction(
      content_id,
      content_type,
      'text',
      'pending',
      { user_id, metadata }
    );
    
    // Perform content analysis - this could use:
    // 1. Basic word filtering (simple but limited)
    // 2. Machine learning model via API (e.g., OpenAI Moderation API)
    // 3. External service integration
    
    // For this example, we'll simulate an AI moderation check with mock results
    const moderationResults = await simulateModeration(text);
    
    // Update the moderation record with results
    const updateData = {
      status: moderationResults.flagged ? 'flagged' : 'approved',
      flagged_categories: moderationResults.flagged ? moderationResults.categories : [],
      confidence_scores: moderationResults.scores,
      moderated_at: new Date().toISOString()
    };
    
    await supabase
      .from('content_moderation')
      .update(updateData)
      .eq('id', insertedRecord.id);
    
    // Update the post status based on moderation results
    await updateContentStatus(
      content_id, 
      content_type, 
      moderationResults.flagged ? 'flagged' : 'approved'
    );
    
    // Log the final moderation decision
    await logModerationAction(
      content_id,
      content_type,
      'text',
      updateData.status,
      {
        user_id,
        categories: updateData.flagged_categories,
        scores: updateData.confidence_scores
      }
    );
    
    return new Response(JSON.stringify({
      success: true,
      content_id,
      moderation_id: insertedRecord.id,
      status: updateData.status,
      flagged: moderationResults.flagged
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in text moderation:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      message: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Simulates AI-based content moderation
 * In production, replace with a real moderation API like OpenAI's Moderation API
 * @param {string} text - Text content to moderate
 * @returns {Promise<Object>} - Moderation results
 */
async function simulateModeration(text) {
  // Simple simulation - in production, call a real moderation API
  const lowerText = text.toLowerCase();
  const prohibitedTerms = ['spam', 'scam', 'illegal', 'offensive', 'abuse'];
  
  let flagged = false;
  const categories = [];
  const scores = {};
  
  // Simulate category detection
  if (lowerText.includes('spam') || lowerText.includes('scam')) {
    categories.push('spam');
    scores['spam'] = 0.92;
    flagged = true;
  }
  
  if (lowerText.includes('offensive') || lowerText.includes('abuse')) {
    categories.push('harassment');
    scores['harassment'] = 0.85;
    flagged = true;
  }
  
  if (lowerText.includes('illegal')) {
    categories.push('illegal');
    scores['illegal'] = 0.78;
    flagged = true;
  }
  
  // In a real implementation, you would use a proper ML model
  // or external API to get accurate moderation results
  
  // Add a short delay to simulate processing time
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    flagged,
    categories,
    scores
  };
}

/**
 * Update content status based on moderation results
 * @param {string} contentId - Content ID
 * @param {string} contentType - Content type (post, comment)
 * @param {string} status - New status (approved, flagged, rejected)
 * @returns {Promise<void>}
 */
async function updateContentStatus(contentId, contentType, status) {
  try {
    // Map moderation status to content status
    let contentStatus;
    switch (status) {
      case 'approved':
        contentStatus = 'published';
        break;
      case 'flagged':
        contentStatus = 'flagged';
        break;
      case 'rejected':
        contentStatus = 'rejected';
        break;
      default:
        contentStatus = 'pending';
    }
    
    // Update the content in the appropriate table
    if (contentType === 'post') {
      await supabase
        .from('posts')
        .update({ status: contentStatus })
        .eq('id', contentId);
        
      // If approved, also insert into moderation_audit_log
      if (status === 'approved') {
        await supabase
          .from('moderation_audit_log')
          .insert({
            content_type: 'post',
            content_id: contentId,
            moderation_type: 'text',
            result_status: 'safe'
          });
      }
    } else if (contentType === 'comment') {
      // Handle comment moderation (similar to post)
      await supabase
        .from('comments')
        .update({ status: contentStatus })
        .eq('id', contentId);
    }
  } catch (error) {
    console.error(`Error updating ${contentType} status:`, error);
    throw error;
  }
} 