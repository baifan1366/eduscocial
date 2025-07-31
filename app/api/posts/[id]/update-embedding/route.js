import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';
import { generateEmbedding } from '@/lib/embedding';

/**
 * POST /api/posts/[id]/update-embedding
 * 更新帖子的embedding，包含帖子内容和所有评论内容
 */
export async function POST(request, { params }) {
  try {
    const session = await getServerSession();
    
    // 这个API可以由系统内部调用，不一定需要用户认证
    // 但如果有session，我们可以记录是谁触发的更新
    
    const { id: postId } = await params;
    const supabase = createServerSupabaseClient();
    
    console.log(`[POST /api/posts/${postId}/update-embedding] Starting embedding update`);
    
    // 1. 获取帖子信息
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, title, content, is_deleted')
      .eq('id', postId)
      .single();
    
    if (postError || !post) {
      console.error(`[POST /api/posts/${postId}/update-embedding] Post not found:`, postError);
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    if (post.is_deleted) {
      console.log(`[POST /api/posts/${postId}/update-embedding] Post is deleted, skipping embedding update`);
      return NextResponse.json(
        { success: true, message: 'Post is deleted, embedding update skipped' }
      );
    }
    
    // 2. 获取所有非删除的评论
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('content')
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });
    
    if (commentsError) {
      console.error(`[POST /api/posts/${postId}/update-embedding] Error fetching comments:`, commentsError);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }
    
    // 3. 合并帖子内容和评论内容
    let combinedContent = `${post.title || ''} ${post.content || ''}`;
    
    if (comments && comments.length > 0) {
      const commentsText = comments.map(comment => comment.content).join(' ');
      combinedContent += ` ${commentsText}`;
    }
    
    // 清理和截断内容（避免过长的文本）
    combinedContent = combinedContent.trim();
    if (combinedContent.length > 8000) {
      // 截断到8000字符，保留帖子标题和内容的完整性
      const postContent = `${post.title || ''} ${post.content || ''}`.trim();
      const remainingLength = 8000 - postContent.length;
      
      if (remainingLength > 0 && comments && comments.length > 0) {
        const commentsText = comments.map(comment => comment.content).join(' ');
        combinedContent = postContent + ' ' + commentsText.substring(0, remainingLength);
      } else {
        combinedContent = postContent.substring(0, 8000);
      }
    }
    
    if (!combinedContent) {
      console.log(`[POST /api/posts/${postId}/update-embedding] No content to generate embedding`);
      return NextResponse.json(
        { success: true, message: 'No content to generate embedding' }
      );
    }
    
    console.log(`[POST /api/posts/${postId}/update-embedding] Generating embedding for ${combinedContent.length} characters`);
    
    // 4. 生成新的embedding
    const embedding = await generateEmbedding(combinedContent);
    
    if (!embedding) {
      console.error(`[POST /api/posts/${postId}/update-embedding] Failed to generate embedding`);
      return NextResponse.json(
        { error: 'Failed to generate embedding' },
        { status: 500 }
      );
    }
    
    // 5. 更新或插入embedding
    const { error: embeddingError } = await supabase
      .from('post_embeddings')
      .upsert({
        post_id: postId,
        embedding: embedding,
        model_version: 'intfloat/e5-small-v2', // 更新模型版本
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'post_id',
        ignoreDuplicates: false 
      });
    
    if (embeddingError) {
      console.error(`[POST /api/posts/${postId}/update-embedding] Error updating embedding:`, embeddingError);
      return NextResponse.json(
        { error: 'Failed to update embedding' },
        { status: 500 }
      );
    }
    
    console.log(`[POST /api/posts/${postId}/update-embedding] Successfully updated embedding`);
    
    // 6. 记录更新日志（可选）
    if (session?.user?.id) {
      try {
        await supabase
          .from('action_log')
          .insert({
            user_id: session.user.id,
            action: 'update_post_embedding',
            target_table: 'post_embeddings',
            target_id: postId,
            metadata: {
              content_length: combinedContent.length,
              comments_count: comments?.length || 0,
              triggered_by: 'manual'
            },
            occurred_at: new Date().toISOString()
          });
      } catch (logError) {
        console.error(`[POST /api/posts/${postId}/update-embedding] Failed to log action:`, logError);
        // 不阻塞主要功能
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Post embedding updated successfully',
      metadata: {
        content_length: combinedContent.length,
        comments_count: comments?.length || 0,
        embedding_dimensions: embedding.length
      }
    });
    
  } catch (error) {
    console.error(`[POST /api/posts/[id]/update-embedding] Unexpected error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/posts/[id]/update-embedding
 * 获取帖子embedding更新状态
 */
export async function GET(request, { params }) {
  try {
    const { id: postId } = await params;
    const supabase = createServerSupabaseClient();
    
    // 获取帖子和embedding信息
    const { data: postWithEmbedding, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        created_at,
        updated_at,
        comment_count,
        post_embeddings (
          id,
          model_version,
          created_at,
          updated_at
        )
      `)
      .eq('id', postId)
      .single();
    
    if (error || !postWithEmbedding) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    const hasEmbedding = postWithEmbedding.post_embeddings && postWithEmbedding.post_embeddings.length > 0;
    const embeddingInfo = hasEmbedding ? postWithEmbedding.post_embeddings[0] : null;
    
    // 检查是否需要更新embedding
    const needsUpdate = !hasEmbedding || 
      (embeddingInfo && new Date(postWithEmbedding.updated_at) > new Date(embeddingInfo.updated_at));
    
    return NextResponse.json({
      post_id: postId,
      has_embedding: hasEmbedding,
      needs_update: needsUpdate,
      comment_count: postWithEmbedding.comment_count || 0,
      embedding_info: embeddingInfo ? {
        model_version: embeddingInfo.model_version,
        created_at: embeddingInfo.created_at,
        updated_at: embeddingInfo.updated_at
      } : null,
      post_updated_at: postWithEmbedding.updated_at
    });
    
  } catch (error) {
    console.error(`[GET /api/posts/[id]/update-embedding] Unexpected error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
