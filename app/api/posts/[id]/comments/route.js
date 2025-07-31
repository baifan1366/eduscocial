import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';
import { smartEmbeddingUpdate } from '@/lib/embeddingUpdater';
import { createCommentNotification, createReplyNotification } from '@/lib/notifications';
import { processMentions } from '@/lib/mentionParser';
import { isValidSlug } from '@/lib/utils/slugUtils';

// UUID validation function
const isValidUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * 根据ID或slug查询帖子
 * @param {Object} supabase - Supabase客户端
 * @param {string} idOrSlug - 帖子ID或slug
 * @returns {Promise<Object>} 查询结果
 */
async function getPostByIdOrSlug(supabase, idOrSlug) {
  const isUUID = isValidUUID(idOrSlug);
  const isSlug = isValidSlug(idOrSlug);

  if (!isUUID && !isSlug) {
    return {
      data: null,
      error: { message: 'Invalid post ID or slug format' }
    };
  }

  let query = supabase
    .from('posts')
    .select('id, title, author_id, comment_count')
    .eq('is_deleted', false);

  if (isUUID) {
    query = query.eq('id', idOrSlug);
  } else {
    query = query.eq('slug', idOrSlug);
  }

  return await query.single();
}

/**
 * GET /api/posts/[id]/comments
 * 获取特定帖子的评论列表
 */
export async function GET(request, { params }) {
  try {
    const { id: postId } = await params;
    const { searchParams } = new URL(request.url);
    
    // 获取查询参数
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const orderBy = searchParams.get('orderBy') || 'created_at';
    const orderDirection = searchParams.get('orderDirection') || 'asc';
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    
    const supabase = createServerSupabaseClient();

    // 验证帖子是否存在（支持ID或slug）
    const { data: post, error: postError } = await getPostByIdOrSlug(supabase, postId);

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 使用实际的post ID（UUID）进行后续查询
    const actualPostId = post.id;
    
    // 构建评论查询
    let query = supabase
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
      `, { count: 'exact' })
      .eq('post_id', actualPostId)
      .is('parent_id', null); // 只获取顶级评论，回复会通过replies关联获取
    
    // 是否包含已删除的评论
    if (!includeDeleted) {
      query = query.eq('is_deleted', false);
    }
    
    // 排序和分页
    query = query
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(offset, offset + limit - 1);
    
    const { data: comments, error: commentsError, count } = await query;
    
    if (commentsError) {
      console.error('[GET /api/posts/[id]/comments] Database error:', commentsError);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }
    
    // 处理评论数据
    const processedComments = comments?.map(comment => {
      // 计算点赞数
      const likesCount = comment.votes?.filter(v => v.vote_type === 'like').length || 0;
      const dislikesCount = comment.votes?.filter(v => v.vote_type === 'dislike').length || 0;
      
      // 处理作者信息
      const author = comment.author ? {
        id: comment.author.id,
        username: comment.author.username,
        avatar_url: comment.author.avatar_url
      } : null;
      
      // 处理回复
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
      
      return {
        ...comment,
        author,
        likesCount,
        dislikesCount,
        replies,
        repliesCount: replies.length
      };
    }) || [];
    
    return NextResponse.json({
      comments: processedComments,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });
    
  } catch (error) {
    console.error('[GET /api/posts/[id]/comments] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/posts/[id]/comments
 * 创建新评论
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
    const { content, parent_id, is_anonymous = false } = body;
    
    // 验证必需字段
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

    // 验证帖子是否存在（支持ID或slug）
    const { data: post, error: postError } = await getPostByIdOrSlug(supabase, postId);

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 获取完整的帖子信息
    const { data: fullPost, error: fullPostError } = await supabase
      .from('posts')
      .select('id, author_id, title, comment_count')
      .eq('id', post.id)
      .single();

    if (fullPostError || !fullPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 使用实际的post ID和完整信息
    const actualPostId = fullPost.id;
    
    // 如果是回复，验证父评论是否存在
    if (parent_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id, post_id')
        .eq('id', parent_id)
        .eq('post_id', actualPostId)
        .single();
      
      if (parentError || !parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
    }
    
    // 创建评论
    const { data: newComment, error: createError } = await supabase
      .from('comments')
      .insert({
        post_id: actualPostId,
        parent_id: parent_id || null,
        author_id: userId,
        content: content.trim(),
        is_anonymous,
        created_by: userId,
        language: 'zh-TW' // 可以根据用户设置调整
      })
      .select(`
        *,
        author:users!author_id (
          id,
          username,
          avatar_url
        )
      `)
      .single();
    
    if (createError) {
      console.error('[POST /api/posts/[id]/comments] Create error:', createError);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }
    
    // 评论计数会通过数据库触发器自动更新，无需手动处理
    
    // 处理返回数据
    const author = newComment.author ? {
      id: newComment.author.id,
      username: newComment.author.username,
      avatar_url: newComment.author.avatar_url
    } : null;
    
    delete newComment.author;
    
    const processedComment = {
      ...newComment,
      author,
      likesCount: 0,
      dislikesCount: 0,
      replies: [],
      repliesCount: 0
    };
    
    // 发送通知
    try {
      if (parent_id) {
        // 这是回复评论，通知原评论作者
        const { data: parentComment, error: parentError } = await supabase
          .from('comments')
          .select('author_id')
          .eq('id', parent_id)
          .single();

        if (!parentError && parentComment && parentComment.author_id !== userId) {
          await createReplyNotification(
            parentComment.author_id,
            userId,
            actualPostId,
            parent_id,
            newComment.id,
            content.substring(0, 100) + (content.length > 100 ? '...' : '')
          );
          console.log(`[POST /api/posts/[id]/comments] Sent reply notification to ${parentComment.author_id}`);
        }
      } else if (fullPost.author_id !== userId) {
        // 这是新评论，通知帖子作者
        await createCommentNotification(
          fullPost.author_id,
          userId,
          actualPostId,
          newComment.id,
          fullPost.title || 'Untitled Post',
          content.substring(0, 100) + (content.length > 100 ? '...' : '')
        );
        console.log(`[POST /api/posts/[id]/comments] Sent comment notification to post author ${fullPost.author_id}`);
      }
    } catch (notificationError) {
      console.error('[POST /api/posts/[id]/comments] Failed to send notification:', notificationError);
      // 不阻塞评论创建
    }

    // 处理@提及
    try {
      const mentionResult = await processMentions(content, actualPostId, newComment.id, userId);
      if (mentionResult.success && mentionResult.validMentions.length > 0) {
        console.log(`[POST /api/posts/[id]/comments] Processed ${mentionResult.validMentions.length} mentions`);
      }
    } catch (mentionError) {
      console.error('[POST /api/posts/[id]/comments] Failed to process mentions:', mentionError);
      // 不阻塞评论创建
    }

    // 智能embedding更新
    try {
      await smartEmbeddingUpdate(actualPostId, {
        action: 'comment_created',
        commentCount: (fullPost.comment_count || 0) + 1
      });
    } catch (error) {
      console.error('[POST /api/posts/[id]/comments] Error scheduling embedding update:', error);
    }

    return NextResponse.json(processedComment, { status: 201 });
    
  } catch (error) {
    console.error('[POST /api/posts/[id]/comments] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
