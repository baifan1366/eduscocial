import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';
import { smartEmbeddingUpdate } from '@/lib/embeddingUpdater';

/**
 * GET /api/comments/[id]
 * 获取单个评论详情
 */
export async function GET(request, { params }) {
  try {
    const { id: commentId } = await params;
    const supabase = createServerSupabaseClient();
    
    const { data: comment, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:users!author_id (
          id,
          username,
          avatar_url
        ),
        votes:votes (
          user_id,
          vote_type
        ),
        replies:comments!parent_id (
          id,
          content,
          created_at,
          author:users!author_id (
            id,
            username,
            avatar_url
          )
        )
      `)
      .eq('id', commentId)
      .single();
    
    if (error || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }
    
    // 处理评论数据
    const likesCount = comment.votes?.filter(v => v.vote_type === 'like').length || 0;
    const dislikesCount = comment.votes?.filter(v => v.vote_type === 'dislike').length || 0;
    
    const author = comment.author ? {
      id: comment.author.id,
      username: comment.author.username,
      avatar_url: comment.author.avatar_url
    } : null;
    
    const replies = comment.replies?.map(reply => ({
      ...reply,
      author: reply.author ? {
        id: reply.author.id,
        username: reply.author.username,
        avatar_url: reply.author.avatar_url
      } : null
    })) || [];
    
    // 清理原始数据
    delete comment.author;
    delete comment.votes;
    delete comment.replies;
    
    const processedComment = {
      ...comment,
      author,
      likesCount,
      dislikesCount,
      replies,
      repliesCount: replies.length
    };
    
    return NextResponse.json(processedComment);
    
  } catch (error) {
    console.error('[GET /api/comments/[id]] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/comments/[id]
 * 更新评论内容
 */
export async function PATCH(request, { params }) {
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
    const { content } = body;
    
    // 验证内容
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }
    
    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Comment content too long (max 2000 characters)' },
        { status: 400 }
      );
    }
    
    const supabase = createServerSupabaseClient();
    const userId = session.user.id;
    
    // 检查评论是否存在且用户有权限编辑
    const { data: existingComment, error: fetchError } = await supabase
      .from('comments')
      .select('id, author_id, post_id')
      .eq('id', commentId)
      .single();
    
    if (fetchError || !existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }
    
    // 检查权限：只有作者可以编辑
    if (existingComment.author_id !== userId) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // 更新评论
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select(`
        *,
        author:users!author_id (
          id,
          username,
          avatar_url
        )
      `)
      .single();
    
    if (updateError) {
      console.error('[PATCH /api/comments/[id]] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update comment' },
        { status: 500 }
      );
    }
    
    // 处理返回数据
    const author = updatedComment.author ? {
      id: updatedComment.author.id,
      username: updatedComment.author.username,
      avatar_url: updatedComment.author.avatar_url
    } : null;
    
    delete updatedComment.author;
    
    const processedComment = {
      ...updatedComment,
      author,
      likesCount: 0, // 这里可以根据需要查询实际的点赞数
      dislikesCount: 0,
      replies: [],
      repliesCount: 0
    };
    
    // 智能embedding更新
    try {
      await smartEmbeddingUpdate(existingComment.post_id, {
        action: 'comment_updated'
      });
    } catch (error) {
      console.error('[PATCH /api/comments/[id]] Error scheduling embedding update:', error);
    }

    return NextResponse.json(processedComment);
    
  } catch (error) {
    console.error('[PATCH /api/comments/[id]] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments/[id]
 * 删除评论（软删除）
 */
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { id: commentId } = await params;
    const supabase = createServerSupabaseClient();
    const userId = session.user.id;
    
    // 检查评论是否存在且用户有权限删除
    const { data: existingComment, error: fetchError } = await supabase
      .from('comments')
      .select('id, author_id, post_id')
      .eq('id', commentId)
      .single();
    
    if (fetchError || !existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }
    
    // 检查权限：只有作者可以删除
    if (existingComment.author_id !== userId) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // 软删除评论
    const { error: deleteError } = await supabase
      .from('comments')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId);
    
    if (deleteError) {
      console.error('[DELETE /api/comments/[id]] Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      );
    }
    
    // 智能embedding更新
    try {
      await smartEmbeddingUpdate(existingComment.post_id, {
        action: 'comment_deleted'
      });
    } catch (error) {
      console.error('[DELETE /api/comments/[id]] Error scheduling embedding update:', error);
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('[DELETE /api/comments/[id]] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
