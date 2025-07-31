import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/serverAuth';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/posts/[id]/reactions
 * 获取帖子的所有reactions
 */
export async function GET(_, { params }) {
  try {
    const { id: postId } = await params;

    // 获取帖子的reaction统计
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('reaction_counts')
      .eq('id', postId)
      .single();

    if (postError) {
      console.error('Error fetching post reactions:', postError);
      return NextResponse.json(
        { error: 'Failed to fetch post reactions' },
        { status: 500 }
      );
    }

    // 获取当前用户的reactions（如果已登录）
    const session = await getServerSession();
    let userReactions = [];

    if (session?.user?.id) {
      const { data: reactions, error: reactionsError } = await supabase
        .from('reactions')
        .select('emoji')
        .eq('post_id', postId)
        .eq('user_id', session.user.id);

      if (!reactionsError) {
        userReactions = reactions.map(r => r.emoji);
      }
    }

    return NextResponse.json({
      reactionCounts: post?.reaction_counts || {},
      userReactions
    });

  } catch (error) {
    console.error('[GET /api/posts/[id]/reactions] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/posts/[id]/reactions
 * 添加或移除帖子的reaction
 */
export async function POST(request, { params }) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: postId } = await params;
    const body = await request.json();
    const { emoji, action } = body; // action: 'add' or 'remove'

    // 验证emoji
    if (!emoji || typeof emoji !== 'string') {
      return NextResponse.json(
        { error: 'Valid emoji is required' },
        { status: 400 }
      );
    }

    // 验证action
    if (!action || !['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "add" or "remove"' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    if (action === 'add') {
      // 添加reaction
      const { error: insertError } = await supabase
        .from('reactions')
        .insert({
          user_id: userId,
          post_id: postId,
          emoji: emoji,
          created_by: userId
        });

      if (insertError) {
        // 如果是重复插入，返回成功（用户已经有这个reaction了）
        if (insertError.code === '23505') {
          return NextResponse.json({ success: true, action: 'already_exists' });
        }
        
        console.error('Error adding reaction:', insertError);
        return NextResponse.json(
          { error: 'Failed to add reaction' },
          { status: 500 }
        );
      }

    } else if (action === 'remove') {
      // 移除reaction
      const { error: deleteError } = await supabase
        .from('reactions')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId)
        .eq('emoji', emoji);

      if (deleteError) {
        console.error('Error removing reaction:', deleteError);
        return NextResponse.json(
          { error: 'Failed to remove reaction' },
          { status: 500 }
        );
      }
    }

    // 获取更新后的reaction统计
    const { data: updatedPost, error: fetchError } = await supabase
      .from('posts')
      .select('reaction_counts')
      .eq('id', postId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated reactions:', fetchError);
    }

    return NextResponse.json({
      success: true,
      action,
      reactionCounts: updatedPost?.reaction_counts || {}
    });

  } catch (error) {
    console.error('[POST /api/posts/[id]/reactions] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
