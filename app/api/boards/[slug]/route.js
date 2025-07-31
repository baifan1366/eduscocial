import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';
import { isValidSlug } from '@/lib/utils/slugUtils';

/**
 * GET handler for retrieving a single board by ID or slug
 * Supports both UUID (for backward compatibility) and slug-based lookups
 */
export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json({ 
        error: 'Board ID or slug is required' 
      }, { status: 400 });
    }

    console.log('[GET /api/boards/[slug]] Fetching board:', slug);

    // Determine if the parameter is a UUID or a slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    const isSlug = isValidSlug(slug);

    if (!isUUID && !isSlug) {
      return NextResponse.json({ 
        error: 'Invalid board ID or slug format' 
      }, { status: 400 });
    }

    // Build query based on whether we're looking up by ID or slug
    let query = supabase
      .from('boards')
      .select(`
        *,
        posts:posts (
          id,
          title,
          content,
          slug,
          is_anonymous,
          post_type,
          is_pinned,
          view_count,
          like_count,
          comment_count,
          created_at,
          updated_at,
          users:author_id (username, avatar_url)
        )
      `);

    if (isUUID) {
      query = query.eq('id', slug);
    } else {
      query = query.eq('slug', slug);
    }

    // Execute query
    const { data, error } = await query.single();

    if (error) {
      console.error('[GET /api/boards/[slug]] Database error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          error: 'Board not found'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        error: 'Failed to fetch board'
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        error: 'Board not found'
      }, { status: 404 });
    }

    // Check if board is active and approved
    if (!data.is_active || data.status !== 'approved') {
      return NextResponse.json({
        error: 'Board not available'
      }, { status: 404 });
    }

    // Process posts data
    const posts = (data.posts || []).map(post => ({
      ...post,
      author: post.users,
      likesCount: post.like_count || 0,
      commentsCount: post.comment_count || 0
    }));

    // Remove raw data
    delete data.posts;

    // Sort posts by pinned status and creation date
    posts.sort((a, b) => {
      // Pinned posts first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      
      // Then by creation date (newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });

    const processedBoard = {
      ...data,
      posts,
      postsCount: posts.length
    };

    console.log('[GET /api/boards/[slug]] Successfully fetched board:', data.id);
    
    return NextResponse.json(processedBoard);

  } catch (error) {
    console.error('[GET /api/boards/[slug]] Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * PATCH handler for updating board view count or other non-sensitive data
 */
export async function PATCH(request, { params }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    
    if (!slug) {
      return NextResponse.json({ 
        error: 'Board ID or slug is required' 
      }, { status: 400 });
    }

    // Only allow view count updates for now
    if (body.action === 'increment_view') {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      const isSlug = isValidSlug(slug);

      if (!isUUID && !isSlug) {
        return NextResponse.json({ 
          error: 'Invalid board ID or slug format' 
        }, { status: 400 });
      }

      // First get the current board to increment view count
      let selectQuery = supabase
        .from('boards')
        .select('id, view_count');

      if (isUUID) {
        selectQuery = selectQuery.eq('id', slug);
      } else {
        selectQuery = selectQuery.eq('slug', slug);
      }

      const { data: boardData, error: selectError } = await selectQuery.single();

      if (selectError || !boardData) {
        return NextResponse.json({
          error: 'Board not found'
        }, { status: 404 });
      }

      // Update view count (handle case where column might not exist)
      try {
        const { error: updateError } = await supabase
          .from('boards')
          .update({
            view_count: (boardData.view_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', boardData.id);

        if (updateError) {
          console.error('[PATCH /api/boards/[slug]] Failed to update view count:', updateError);
          // Don't fail the request if view_count column doesn't exist
          if (!updateError.message?.includes('view_count')) {
            return NextResponse.json({
              error: 'Failed to update view count'
            }, { status: 500 });
          }
        }
      } catch (error) {
        console.log('[PATCH /api/boards/[slug]] View count column may not exist yet:', error);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('[PATCH /api/boards/[slug]] Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
