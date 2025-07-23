import { createClient } from '@supabase/supabase-js';
import { getUserFromToken } from '@/lib/auth/serverAuth';
import { bufferUserAction } from '@/lib/redis/redisUtils';
import qstashClient from '@/lib/qstash';
import { generateEmbedding } from '@/lib/embedding';
import { checkContentViolations } from '@/lib/moderation';

// Initialize Supabase client
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ?
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null;

// Field validation schema
const requiredFields = ['title', 'content'];
const optionalFields = ['board_id', 'is_anonymous', 'post_type', 'scheduled_publish_at'];

/**
 * POST handler for creating a new post
 * 
 * Authentication: Requires valid JWT token
 * Validation: Validates required fields and checks for content violations
 * Processing: Creates pending post, logs user action, schedules moderation task
 * Response: 201 Created with post ID on success
 */
export async function POST(request) {
  try {
    // 1. JWT Authentication: Get user from token
    const user = await getUserFromToken(request);
    
    if (!user || !user.id) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized: Valid authentication required'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 2. Parse and validate request body
    let postData;
    try {
      postData = await request.json();
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON payload'
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate required fields
    for (const field of requiredFields) {
      if (!postData[field]) {
        return new Response(JSON.stringify({ 
          error: `Missing required field: ${field}`
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // 3. Check for content violations
    const violationsCheck = await checkContentViolations({
      title: postData.title,
      content: postData.content
    });
    
    if (violationsCheck.hasViolations) {
      return new Response(JSON.stringify({ 
        error: 'Content contains prohibited material',
        violations: violationsCheck.violations
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 4. Prepare post data for insertion
    const newPost = {
      title: postData.title,
      content: postData.content,
      author_id: user.id,
      created_by: user.id,
      board_id: postData.board_id || null,
      is_anonymous: postData.is_anonymous || false,
      post_type: postData.post_type || 'general',
      status: 'pending', // All posts start in pending status for moderation
      is_deleted: false,
      is_draft: false,
      scheduled_publish_at: postData.scheduled_publish_at || null,
      language: postData.language || 'zh-TW'
    };
    
    // 5. Insert post into database
    const { data: post, error: insertError } = await supabase
      .from('posts')
      .insert(newPost)
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating post:', insertError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create post',
        details: insertError.message
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const postId = post.id;
    
    // 6. Generate embedding for the post (async)
    try {
      const combinedContent = `${post.title} ${post.content}`;
      const embedding = await generateEmbedding(combinedContent);
      
      if (embedding) {
        // Store the embedding
        await supabase
          .from('post_embeddings')
          .insert({
            post_id: postId,
            embedding: embedding,
            model_version: 'v1'
          });
      }
    } catch (embeddingError) {
      // Don't fail the request if embedding generation fails
      console.error('Error generating post embedding:', embeddingError);
    }
    
    // 7. Log user action in Redis
    await bufferUserAction(
      user.id, 
      'create_post', 
      'posts', 
      postId, 
      null, 
      {
        title: post.title,
        board_id: post.board_id
      }
    );
    
    // 8. Send content for moderation via QStash
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    await qstashClient.publishJSON({
      url: `${baseUrl}/api/audit/text/moderate`,
      body: {
        content_id: postId,
        content_type: 'post',
        user_id: user.id,
        text: `${post.title}\n${post.content}`,
        metadata: {
          board_id: post.board_id,
          post_type: post.post_type
        }
      }
    });
    
    // 9. Return success response
    return new Response(JSON.stringify({
      post_id: postId,
      status: post.status,
      message: 'Post created successfully and submitted for moderation'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in post creation:', error);
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
 * GET handler for retrieving posts
 * This is a placeholder for the GET implementation
 */
export async function GET(request) {
  return new Response(JSON.stringify({ 
    message: 'Use POST to create a new post'
  }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
