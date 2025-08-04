import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';
import { incrementPostView } from '@/lib/redis/redisUtils';
import { isValidSlug } from '@/lib/utils/slugUtils';

/**
 * GET handler for retrieving a single post by ID or slug
 * Supports both UUID (for backward compatibility) and slug-based lookups
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Post ID or slug is required' 
      }, { status: 400 });
    }

    console.log('[GET /api/posts/[id]] Fetching post:', id);

    // Determine if the parameter is a UUID or a slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const isSlug = isValidSlug(id);

    if (!isUUID && !isSlug) {
      return NextResponse.json({ 
        error: 'Invalid post ID or slug format' 
      }, { status: 400 });
    }

    // Build query based on whether we're looking up by ID or slug
    let query = supabase
      .from('posts')
      .select(`
        *,
        users:author_id (username, avatar_url),
        boards:board_id (name, slug),
        votes:votes (user_id, vote_type),
        comments:comments (id)
      `);

    if (isUUID) {
      query = query.eq('id', id);
    } else {
      // Try to query by slug, but handle case where slug column doesn't exist
      try {
        query = query.eq('slug', id);
      } catch (error) {
        console.log('[GET /api/posts/[id]] Slug column may not exist, falling back to ID lookup');
        // If slug column doesn't exist, return 404 for slug-based requests
        return NextResponse.json({
          error: 'Post not found - slug functionality not yet enabled'
        }, { status: 404 });
      }
    }

    const { data: post, error } = await query
      .eq('is_deleted', false)
      .single();

    if (error) {
      console.error('[GET /api/posts/[id]] Database error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'Post not found' 
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch post',
        details: error.message
      }, { status: 500 });
    }

    if (!post) {
      return NextResponse.json({ 
        error: 'Post not found' 
      }, { status: 404 });
    }

    // Process the post data
    const likesCount = post.votes ? post.votes.filter(v => v.vote_type === 'like').length : 0;
    const commentsCount = post.comments?.length || 0;

    // Format author data
    const author = post.users ? {
      id: post.author_id,
      username: post.users.username,
      name: post.users.username, // Use username as name since name column doesn't exist
      avatar_url: post.users.avatar_url
    } : null;

    // Format board data
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

    // Increment view count in Redis cache (non-blocking)
    // Pass current database count to ensure Redis is initialized correctly
    const currentViewCount = post.view_count || 0;
    incrementPostView(post.id, currentViewCount)
      .then((newViewCount) => {
        console.log('[GET /api/posts/[id]] View count incremented for post:', post.id, 'From:', currentViewCount, 'To:', newViewCount);

        // Sync with database every 10 views to reduce database writes
        if (newViewCount % 10 === 0) {
          supabase
            .from('posts')
            .update({ view_count: newViewCount })
            .eq('id', post.id)
            .then(() => {
              console.log('[GET /api/posts/[id]] View count synced to database:', post.id, newViewCount);
            })
            .catch(err => {
              console.error('[GET /api/posts/[id]] Failed to sync view count to database:', err);
            });
        }
      })
      .catch(err => {
        console.error('[GET /api/posts/[id]] Failed to increment view count in cache:', err);

        // Fallback to direct database update
        supabase
          .from('posts')
          .update({ view_count: currentViewCount + 1 })
          .eq('id', post.id)
          .then(() => {
            console.log('[GET /api/posts/[id]] View count incremented in database (fallback):', post.id);
          })
          .catch(dbErr => {
            console.error('[GET /api/posts/[id]] Failed to increment view count in database (fallback):', dbErr);
          });
      });

    const processedPost = {
      ...post,
      author,
      board,
      likesCount,
      commentsCount
    };

    console.log('[GET /api/posts/[id]] Successfully fetched post:', post.id);
    
    return NextResponse.json(processedPost);

  } catch (error) {
    console.error('[GET /api/posts/[id]] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * PUT handler for updating a post
 */
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { id } = await params;
    const updateData = await request.json();

    // Validate required fields
    if (!updateData.title || !updateData.content) {
      return NextResponse.json({ 
        error: 'Title and content are required' 
      }, { status: 400 });
    }

    // Check if post exists and user has permission to edit
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('id, author_id, slug')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json({ 
        error: 'Post not found' 
      }, { status: 404 });
    }

    if (existingPost.author_id !== session.user.id) {
      return NextResponse.json({ 
        error: 'Forbidden: You can only edit your own posts' 
      }, { status: 403 });
    }

    // Generate new slug if title changed
    let newSlug = existingPost.slug;
    if (updateData.title !== existingPost.title) {
      const checkSlugExists = async (slug) => {
        const { data, error } = await supabase
          .from('posts')
          .select('id')
          .eq('slug', slug)
          .neq('id', id) // Exclude current post
          .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 results gracefully

        // Return true if data exists (slug is taken), false otherwise
        return !!data && !error;
      };

      const { generateUniqueSlug } = await import('@/lib/utils/slugUtils');
      newSlug = await generateUniqueSlug(updateData.title, checkSlugExists);
    }

    // Update the post
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({
        title: updateData.title,
        content: updateData.content,
        slug: newSlug,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[PUT /api/posts/[id]] Update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update post',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json(updatedPost);

  } catch (error) {
    console.error('[PUT /api/posts/[id]] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * DELETE handler for deleting a post
 */
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { id } = await params;

    // Check if post exists and user has permission to delete
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('id, author_id')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json({ 
        error: 'Post not found' 
      }, { status: 404 });
    }

    if (existingPost.author_id !== session.user.id) {
      return NextResponse.json({ 
        error: 'Forbidden: You can only delete your own posts' 
      }, { status: 403 });
    }

    // Soft delete the post
    const { error: deleteError } = await supabase
      .from('posts')
      .update({ 
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (deleteError) {
      console.error('[DELETE /api/posts/[id]] Delete error:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete post',
        details: deleteError.message
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Post deleted successfully' 
    });

  } catch (error) {
    console.error('[DELETE /api/posts/[id]] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
