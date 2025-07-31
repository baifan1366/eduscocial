import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/serverAuth';
import { bufferCommentVoteOperation, getCachedCommentVoteCounts, getUserCommentVoteStatus } from '@/lib/redis/redisUtils';

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
    if (!vote_type || !['like', 'dislike', 'remove'].includes(vote_type)) {
      return NextResponse.json(
        { error: 'Invalid vote type. Must be "like", "dislike", or "remove"' },
        { status: 400 }
      );
    }
    
    const userId = session.user.id;

    // 使用纯缓存系统处理投票操作，避免RLS策略问题
    console.log('[POST /api/comments/[id]/vote] Processing vote via cache-only system');

    try {
      // 缓存投票操作，包含重复投票检查
      const voteResult = await bufferCommentVoteOperation(userId, commentId, vote_type);

      // 如果是重复投票，返回错误
      if (!voteResult.success && voteResult.action === 'duplicate') {
        return NextResponse.json(
          { error: 'You have already voted this way on this comment' },
          { status: 400 }
        );
      }

      // 获取更新后的投票计数
      const voteCounts = await getCachedCommentVoteCounts(commentId);

      const result = {
        success: true,
        action: voteResult.previousVote ? 'updated' : 'created',
        vote_type: vote_type,
        previousVote: voteResult.previousVote,
        likesCount: voteCounts.likeCount || 0,
        dislikesCount: voteCounts.dislikeCount || 0
      };

      console.log(`[POST /api/comments/[id]/vote] Vote operation cached successfully`);
      return NextResponse.json(result);

    } catch (error) {
      console.error('[POST /api/comments/[id]/vote] Cache error during vote operation:', error);
      return NextResponse.json(
        { error: 'Failed to process vote' },
        { status: 500 }
      );
    }
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
 * 获取当前用户对评论的投票状态（从缓存读取）
 */
export async function GET(_, { params }) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: commentId } = await params;
    const userId = session.user.id;

    // 从缓存获取投票统计和用户投票状态
    const [voteCounts, userVote] = await Promise.all([
      getCachedCommentVoteCounts(commentId),
      getUserCommentVoteStatus(userId, commentId)
    ]);

    return NextResponse.json({
      userVote: userVote,
      likesCount: voteCounts.likeCount || 0,
      dislikesCount: voteCounts.dislikeCount || 0
    });

  } catch (error) {
    console.error('[GET /api/comments/[id]/vote] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
