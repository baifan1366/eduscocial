import { supabase } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';
import { bufferUserAction } from '@/lib/redis/redisUtils';
import qstashClient from '@/lib/qstash';
import { generateEmbedding } from '@/lib/embedding';
import { checkContentViolations } from '@/lib/moderation';

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
    // 1. JWT Authentication: Get user from session
    const session = await getServerSession();
    
    if (!session || !session.user || !session.user.id) {
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
    
    // 6. Generate embedding for post content to improve search and recommendations
    try {
      const contentEmbedding = await generateEmbedding(post.content);
      
      if (contentEmbedding) {
        await supabase
          .from('post_embeddings')
          .insert({
            post_id: postId,
            embedding: contentEmbedding,
            model_version: 'v1'
          });
      }
    } catch (embeddingError) {
      console.error('Error generating post embedding:', embeddingError);
      // Don't block post creation if embedding fails
    }
    
    // 7. Log user action for analytics and monitoring
    try {
      await bufferUserAction({
        user_id: session.user.id,
        action_type: 'post_created',
        entity_type: 'post',
        entity_id: postId,
        metadata: {
          post_type: post.post_type,
          title_length: post.title.length,
          content_length: post.content.length,
          has_board: !!post.board_id,
          is_anonymous: post.is_anonymous
        }
      });
    } catch (logError) {
      console.error('Error logging user action:', logError);
      // Don't block post creation if logging fails
    }
    
    // 8. Schedule content moderation task with qstash
    try {
      if (process.env.NODE_ENV === 'production' && qstashClient) {
        await qstashClient.publishJSON({
          url: `${process.env.NEXT_PUBLIC_API_URL}/api/audit/text/moderate`,
          body: {
            id: postId,
            content: post.content,
            title: post.title,
            type: 'post'
          },
          delay: 1 // slight delay to ensure post is properly saved
        });
      } else {
        console.log('Dev mode: Not scheduling moderation task');
      }
    } catch (qstashError) {
      console.error('Error scheduling moderation task:', qstashError);
      // Don't block post creation if task scheduling fails
    }
    
    // 9. Return success response with post ID
    return new Response(JSON.stringify({
      message: 'Post created successfully and pending moderation',
      id: postId
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Post creation error:', error);
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
