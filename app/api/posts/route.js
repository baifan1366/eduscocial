import { supabase } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';
import { bufferUserAction } from '@/lib/redis/redisUtils';
import { qstashClient } from '@/lib/qstash';
import { generateEmbedding } from '@/lib/embedding';
import { checkContentViolations, updateUserEmbedding } from '@/lib/moderation';

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
    console.log('[POST /api/posts] Starting post creation process');
    // 1. JWT Authentication: Get user from session
    const session = await getServerSession();
    
    if (!session || !session.user || !session.user.id) {
      console.log('[POST /api/posts] Authentication failed - no valid session');
      return new Response(JSON.stringify({ 
        error: 'Unauthorized: Valid authentication required'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`[POST /api/posts] Authenticated user: ${session.user.id}`);
    
    // 2. Parse and validate request body
    let postData;
    try {
      postData = await request.json();
      console.log('[POST /api/posts] Request body parsed successfully');
    } catch (error) {
      console.error('[POST /api/posts] Failed to parse request body:', error);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON payload'
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate required fields
    const requiredFields = ['title', 'content'];
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
    console.log('[POST /api/posts] Checking for content violations');
    const violationsCheck = await checkContentViolations({
      title: postData.title,
      content: postData.content
    });
    
    if (violationsCheck.hasViolations) {
      console.log('[POST /api/posts] Content violations detected:', violationsCheck.violations);
      return new Response(JSON.stringify({ 
        error: 'Content contains prohibited material',
        violations: violationsCheck.violations
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('[POST /api/posts] Content passed moderation check');
    
    // 4. Prepare post data for insertion
    const newPost = {
      title: postData.title,
      content: postData.content,
      author_id: session.user.id,
      created_by: session.user.id,
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
    console.log('[POST /api/posts] Inserting post into database');
    const { data: post, error: insertError } = await supabase
      .from('posts')
      .insert(newPost)
      .select()
      .single();
    
    if (insertError) {
      console.error('[POST /api/posts] Error creating post:', insertError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create post',
        details: insertError.message
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const postId = post.id;
    console.log(`[POST /api/posts] Post created successfully with ID: ${postId}`);
    
    // 6. Schedule embedding generation as a background task instead of doing it synchronously
    console.log(`[POST /api/posts] Step 6: Scheduling embedding generation for post ${postId} as background task`);
    let embeddingScheduled = false;
    try {
      if (process.env.NODE_ENV === 'production' && qstashClient) {
        console.log('[POST /api/posts] Scheduling embedding generation via qstash');
        const embedQstashResponse = await qstashClient.publishJSON({
          url: `${process.env.NEXT_PUBLIC_API_URL}/api/posts/process-embedding`,
          body: {
            id: postId,
            content: post.content
          },
          delay: 1
        });
        embeddingScheduled = !!embedQstashResponse;
        console.log(`[POST /api/posts] Embedding generation scheduled: ${embeddingScheduled ? 'success' : 'failed'}`);
      } else {
        console.log('[POST /api/posts] Dev mode: Simulating embedding schedule');
        // In dev mode, still try to schedule it via setTimeout to simulate background processing
        setTimeout(async () => {
          try {
            console.log(`[POST /api/posts] Dev mode: Generating embedding for post ${postId}`);
            const contentEmbedding = await generateEmbedding(post.content, { 
              isBackground: true,
              timeout: 120000 // 2 minutes timeout
            });
            if (contentEmbedding) {
              const { error: embeddingError } = await supabase
                .from('post_embeddings')
                .insert({
                  post_id: postId,
                  embedding: contentEmbedding,
                  model_version: 'v1'
                });
              console.log(`[POST /api/posts] Dev mode: Embedding ${embeddingError ? 'failed' : 'saved'}`);
            }
          } catch (err) {
            console.error(`[POST /api/posts] Dev mode: Embedding generation failed:`, err);
          }
        }, 100);
        embeddingScheduled = true;
      }
    } catch (scheduleError) {
      console.error('[POST /api/posts] Error scheduling embedding task:', scheduleError);
      // Don't block post creation if scheduling fails
    }
    
    // 7. Log user action for analytics and monitoring
    console.log(`[POST /api/posts] Step 7: Logging user action for post ${postId}`);
    let loggingSuccess = false;
    try {
      // Use the correct function format
      await bufferUserAction(
        session.user.id,
        'post_created',
        'posts',
        postId,
        null, // oldData
        null, // newData
        {
          post_type: post.post_type,
          title_length: post.title.length,
          content_length: post.content.length,
          has_board: !!post.board_id,
          is_anonymous: post.is_anonymous
        }
      );
      
      loggingSuccess = true;
      console.log(`[POST /api/posts] User action logged successfully`);
    } catch (logError) {
      console.error('[POST /api/posts] Error logging user action:', logError);
      // Don't block post creation if logging fails
    }
    
    // 8. Schedule content moderation task with qstash
    console.log(`[POST /api/posts] Step 8: Scheduling moderation task for post ${postId}`);
    let moderationScheduled = false;
    try {
      if (process.env.NODE_ENV === 'production' && qstashClient) {
        console.log('[POST /api/posts] Production mode: Scheduling with qstash');
        const qstashResponse = await qstashClient.publishJSON({
          url: `${process.env.NEXT_PUBLIC_API_URL}/api/audit/text/moderate`,
          body: {
            id: postId,
            content: post.content,
            title: post.title,
            type: 'post'
          },
          delay: 1 // slight delay to ensure post is properly saved
        });
        moderationScheduled = !!qstashResponse;
        console.log(`[POST /api/posts] Moderation task scheduled: ${moderationScheduled ? 'success' : 'failed'}`);
      } else {
        console.log('[POST /api/posts] Dev mode: Not scheduling moderation task');
        moderationScheduled = true; // Consider it "scheduled" in dev mode
      }
    } catch (qstashError) {
      console.error('[POST /api/posts] Error scheduling moderation task:', qstashError);
      // Don't block post creation if task scheduling fails
    }
    
    // 8.1 Schedule user embedding update based on new post content
    console.log(`[POST /api/posts] Step 8.1: Scheduling user embedding update for user ${session.user.id}`);
    let userEmbeddingScheduled = false;
    try {
      if (process.env.NODE_ENV === 'production' && qstashClient) {
        console.log('[POST /api/posts] Production mode: Scheduling user embedding update');
        const embedQstashResponse = await qstashClient.publishJSON({
          url: `${process.env.NEXT_PUBLIC_API_URL}/api/users/update-embedding`,
          body: {
            user_id: session.user.id,
            post_id: postId,
            content: post.content,
            title: post.title
          },
          delay: 5 // Slightly longer delay to ensure post processing completes first
        });
        userEmbeddingScheduled = !!embedQstashResponse;
        console.log(`[POST /api/posts] User embedding update scheduled: ${userEmbeddingScheduled ? 'success' : 'failed'}`);
      } else {
        console.log('[POST /api/posts] Dev mode: Simulating user embedding update');
        // In dev mode, directly update user embedding
        setTimeout(async () => {
          try {
            console.log(`[POST /api/posts] Dev mode: Updating user embedding for user ${session.user.id}`);
            await updateUserEmbedding(session.user.id, post.content, post.title);
            console.log(`[POST /api/posts] Dev mode: User embedding updated`);
          } catch (err) {
            console.error(`[POST /api/posts] Dev mode: User embedding update failed:`, err);
          }
        }, 500);
        userEmbeddingScheduled = true;
      }
    } catch (embeddingError) {
      console.error('[POST /api/posts] Error scheduling user embedding update:', embeddingError);
      // Don't block post creation if scheduling fails
    }
    
    // 9. Return success response with post ID and processing status
    console.log(`[POST /api/posts] Step 9: Returning response with processing status`, {
      embedding_scheduled: embeddingScheduled,
      action_logged: loggingSuccess,
      moderation_scheduled: moderationScheduled,
      user_embedding_scheduled: userEmbeddingScheduled
    });
    
    return new Response(JSON.stringify({
      message: 'Post created successfully and pending moderation',
      id: postId,
      processing: {
        embedding_scheduled: embeddingScheduled,
        action_logged: loggingSuccess,
        moderation_scheduled: moderationScheduled,
        user_embedding_scheduled: userEmbeddingScheduled
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[POST /api/posts] Unhandled error in post creation:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * GET handler for retrieving posts
 * Supports pagination, filtering, and search
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;
    
    // Parse filter parameters
    const page = parseInt(params.get('page') || '1');
    const limit = Math.min(parseInt(params.get('limit') || '20'), 50); // Cap at 50
    const offset = (page - 1) * limit;
    const board = params.get('board');
    const author = params.get('author');
    const status = params.get('status') || 'published'; // Default to published posts
    const orderBy = params.get('orderBy') || 'created_at';
    const direction = params.get('direction') || 'desc';
    const search = params.get('search');
    const includeDeleted = params.get('includeDeleted') === 'true';
    
    // 1. Authentication check for restricted queries
    let session = null;
    
    // Check if requesting any restricted data
    const needsAuth = status !== 'published' || includeDeleted;
    
    if (needsAuth) {
      session = await getServerSession();
      
      // If authentication needed but not provided, return 401
      if (!session?.user) {
        return new Response(JSON.stringify({ 
          error: 'Unauthorized access' 
        }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // If requesting admin-only data, check role
      const isAdmin = session.user.role === 'admin';
      if ((status === 'pending' || status === 'rejected') && !isAdmin) {
        return new Response(JSON.stringify({ 
          error: 'Insufficient permissions' 
        }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // 2. Build database query
    let query = supabase
      .from('posts')
      .select(`
        *,
        users:author_id (username, name, avatar_url),
        boards:board_id (name, slug),
        votes:votes (user_id, vote_type),
        comments:comments (id)
      `, { 
        count: 'exact' 
      });
    
    // Apply filters
    if (board) {
      query = query.eq('board_id', board);
    }
    
    if (author) {
      query = query.eq('author_id', author);
    }
    
    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }
    
    // Apply deleted filter
    if (!includeDeleted) {
      query = query.eq('is_deleted', false);
    }
    
    // Apply search if provided
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    
    // Apply order and pagination
    query = query
      .order(orderBy, { ascending: direction === 'asc' })
      .range(offset, offset + limit - 1);
    
    // 3. Execute query
    const { data: posts, error, count } = await query;
    
    if (error) {
      console.error('Error fetching posts:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch posts',
        details: error.message
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 4. Process posts
    const processedPosts = posts.map(post => {
      // Count likes and comments
      const likesCount = post.votes ? post.votes.filter(v => v.vote_type === 'like').length : 0;
      const commentsCount = post.comments?.length || 0;
      
      // Format post author
      const author = post.users ? {
        id: post.author_id,
        username: post.users.username,
        name: post.users.name || post.users.username,
        avatar_url: post.users.avatar_url
      } : null;
      
      // Format board
      const board = post.boards ? {
        id: post.board_id,
        name: post.boards.name,
        slug: post.boards.slug
      } : null;
      
      // Remove raw data
      delete post.users;
      delete post.boards;
      delete post.votes;
      delete post.comments;
      
      return {
        ...post,
        author,
        board,
        likesCount,
        commentsCount
      };
    });
    
    // 5. Return response with pagination metadata
    return new Response(JSON.stringify({
      posts: processedPosts,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Posts query error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
