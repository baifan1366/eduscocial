import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/serverAuth';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/comments/[id]/reactions
 * 获取评论的所有reactions
 */
export async function GET(_, { params }) {
  try {
    const { id: commentId } = await params;

    // 获取评论的reaction统计
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('reaction_counts')
      .eq('id', commentId)
      .single();

    if (commentError) {
      console.error('Error fetching comment reactions:', commentError);
      return NextResponse.json(
        { error: 'Failed to fetch comment reactions' },
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
        .eq('comment_id', commentId)
        .eq('user_id', session.user.id);

      if (!reactionsError) {
        userReactions = reactions.map(r => r.emoji);
      }
    }

    return NextResponse.json({
      reactionCounts: comment?.reaction_counts || {},
      userReactions
    });

  } catch (error) {
    console.error('[GET /api/comments/[id]/reactions] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comments/[id]/reactions
 * 添加或移除评论的reaction
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

    const { id: commentId } = await params;
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
          comment_id: commentId,
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
        .eq('comment_id', commentId)
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
    const { data: updatedComment, error: fetchError } = await supabase
      .from('comments')
      .select('reaction_counts')
      .eq('id', commentId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated reactions:', fetchError);
    }

    return NextResponse.json({
      success: true,
      action,
      reactionCounts: updatedComment?.reaction_counts || {}
    });

  } catch (error) {
    console.error('[POST /api/comments/[id]/reactions] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
