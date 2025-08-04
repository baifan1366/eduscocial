import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';

/**
 * POST handler for following a board
 */
export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json({ 
        error: 'Board slug is required' 
      }, { status: 400 });
    }

    // Get user session
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const { user } = session;

    // First, get the board by slug
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('id, name, visibility, status, is_active')
      .eq('slug', slug)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ 
        error: 'Board not found' 
      }, { status: 404 });
    }

    // Check if board is active and approved
    if (!board.is_active || board.status !== 'approved') {
      return NextResponse.json({ 
        error: 'Board not available' 
      }, { status: 404 });
    }

    // Check if user is already following this board
    const { data: existingFollow, error: checkError } = await supabase
      .from('board_followers')
      .select('id')
      .eq('user_id', user.id)
      .eq('board_id', board.id);

    if (checkError) {
      console.error('Error checking existing follow:', checkError);
      return NextResponse.json({
        error: 'Failed to check follow status'
      }, { status: 500 });
    }

    if (existingFollow && existingFollow.length > 0) {
      return NextResponse.json({
        error: 'Already following this board'
      }, { status: 409 });
    }

    // Create the follow relationship
    const { data: followData, error: followError } = await supabase
      .from('board_followers')
      .insert({
        user_id: user.id,
        board_id: board.id,
        created_by: user.id
      })
      .select()
      .single();

    if (followError) {
      console.error('Error creating follow:', followError);
      return NextResponse.json({ 
        error: 'Failed to follow board' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully followed ${board.name}`,
      follow: followData
    });

  } catch (error) {
    console.error('Unexpected error in follow board:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * DELETE handler for unfollowing a board
 */
export async function DELETE(request, { params }) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json({ 
        error: 'Board slug is required' 
      }, { status: 400 });
    }

    // Get user session
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const { user } = session;

    // First, get the board by slug
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('id, name')
      .eq('slug', slug)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ 
        error: 'Board not found' 
      }, { status: 404 });
    }

    // Delete the follow relationship
    const { data: unfollowData, error: unfollowError } = await supabase
      .from('board_followers')
      .delete()
      .eq('user_id', user.id)
      .eq('board_id', board.id)
      .select();

    if (unfollowError) {
      console.error('Error unfollowing board:', unfollowError);
      return NextResponse.json({ 
        error: 'Failed to unfollow board' 
      }, { status: 500 });
    }

    if (!unfollowData || unfollowData.length === 0) {
      return NextResponse.json({ 
        error: 'Not following this board' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully unfollowed ${board.name}`
    });

  } catch (error) {
    console.error('Unexpected error in unfollow board:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * GET handler for checking follow status
 */
export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json({ 
        error: 'Board slug is required' 
      }, { status: 400 });
    }

    // Get user session
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ 
        isFollowing: false 
      });
    }

    const supabase = createServerSupabaseClient();
    const { user } = session;

    // First, get the board by slug
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('id')
      .eq('slug', slug)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ 
        error: 'Board not found' 
      }, { status: 404 });
    }

    // Check if user is following this board
    const { data: followData, error: followError } = await supabase
      .from('board_followers')
      .select('id, followed_at')
      .eq('user_id', user.id)
      .eq('board_id', board.id);

    if (followError) {
      console.error('Error checking follow status:', followError);
      return NextResponse.json({
        error: 'Failed to check follow status'
      }, { status: 500 });
    }

    return NextResponse.json({
      isFollowing: followData && followData.length > 0,
      followedAt: followData && followData.length > 0 ? followData[0].followed_at : null
    });

  } catch (error) {
    console.error('Unexpected error in check follow status:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
