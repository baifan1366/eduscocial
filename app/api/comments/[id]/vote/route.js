import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';

/**
 * POST /api/comments/[id]/vote
 * 对评论进行投票（点赞/踩）
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
    const { vote_type } = body;
    
    // 验证投票类型
    if (!vote_type || !['like', 'dislike'].includes(vote_type)) {
      return NextResponse.json(
        { error: 'Invalid vote type. Must be "like" or "dislike"' },
        { status: 400 }
      );
    }
    
    const supabase = createServerSupabaseClient();
    const userId = session.user.id;
    
    // 验证评论是否存在
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, author_id')
      .eq('id', commentId)
      .eq('is_deleted', false)
      .single();
    
    if (commentError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }
    
    // 检查用户是否已经对此评论投票
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('votes')
      .select('id, vote_type')
      .eq('user_id', userId)
      .eq('comment_id', commentId)
      .maybeSingle();
    
    if (voteCheckError) {
      console.error('[POST /api/comments/[id]/vote] Vote check error:', voteCheckError);
      return NextResponse.json(
        { error: 'Failed to check existing vote' },
        { status: 500 }
      );
    }
    
    let result = { success: true, action: null, vote_type: null };
    
    if (existingVote) {
      if (existingVote.vote_type === vote_type) {
        // 如果是相同的投票类型，则取消投票
        const { error: deleteError } = await supabase
          .from('votes')
          .delete()
          .eq('id', existingVote.id);
        
        if (deleteError) {
          console.error('[POST /api/comments/[id]/vote] Delete vote error:', deleteError);
          return NextResponse.json(
            { error: 'Failed to remove vote' },
            { status: 500 }
          );
        }
        
        result.action = 'removed';
        result.vote_type = null;
      } else {
        // 如果是不同的投票类型，则更新投票
        const { error: updateError } = await supabase
          .from('votes')
          .update({
            vote_type,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingVote.id);
        
        if (updateError) {
          console.error('[POST /api/comments/[id]/vote] Update vote error:', updateError);
          return NextResponse.json(
            { error: 'Failed to update vote' },
            { status: 500 }
          );
        }
        
        result.action = 'updated';
        result.vote_type = vote_type;
      }
    } else {
      // 创建新投票
      const { error: createError } = await supabase
        .from('votes')
        .insert({
          user_id: userId,
          comment_id: commentId,
          vote_type,
          created_by: userId
        });
      
      if (createError) {
        console.error('[POST /api/comments/[id]/vote] Create vote error:', createError);
        return NextResponse.json(
          { error: 'Failed to create vote' },
          { status: 500 }
        );
      }
      
      result.action = 'created';
      result.vote_type = vote_type;
    }
    
    // 获取更新后的投票统计
    const { data: voteStats, error: statsError } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('comment_id', commentId);
    
    if (!statsError && voteStats) {
      result.likesCount = voteStats.filter(v => v.vote_type === 'like').length;
      result.dislikesCount = voteStats.filter(v => v.vote_type === 'dislike').length;
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[POST /api/comments/[id]/vote] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/comments/[id]/vote
 * 获取当前用户对评论的投票状态
 */
export async function GET(request, { params }) {
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
    
    // 获取用户的投票状态
    const { data: userVote, error: voteError } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('user_id', userId)
      .eq('comment_id', commentId)
      .maybeSingle();
    
    if (voteError) {
      console.error('[GET /api/comments/[id]/vote] Vote check error:', voteError);
      return NextResponse.json(
        { error: 'Failed to check vote status' },
        { status: 500 }
      );
    }
    
    // 获取总投票统计
    const { data: allVotes, error: statsError } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('comment_id', commentId);
    
    if (statsError) {
      console.error('[GET /api/comments/[id]/vote] Stats error:', statsError);
      return NextResponse.json(
        { error: 'Failed to get vote statistics' },
        { status: 500 }
      );
    }
    
    const likesCount = allVotes?.filter(v => v.vote_type === 'like').length || 0;
    const dislikesCount = allVotes?.filter(v => v.vote_type === 'dislike').length || 0;
    
    return NextResponse.json({
      userVote: userVote?.vote_type || null,
      likesCount,
      dislikesCount
    });
    
  } catch (error) {
    console.error('[GET /api/comments/[id]/vote] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
