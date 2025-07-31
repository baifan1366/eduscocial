import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';

/**
 * POST /api/embeddings/batch-update
 * 批量更新需要更新embedding的帖子
 */
export async function POST(request) {
  try {
    const session = await getServerSession();
    
    // 这个API主要用于系统维护，可以考虑添加管理员权限检查
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { 
      limit = 10, 
      force_update = false,
      post_ids = null 
    } = body;
    
    const supabase = createServerSupabaseClient();
    
    console.log(`[POST /api/embeddings/batch-update] Starting batch update with limit: ${limit}`);
    
    let postsToUpdate = [];
    
    if (post_ids && Array.isArray(post_ids)) {
      // 更新指定的帖子
      const { data: specificPosts, error: specificError } = await supabase
        .from('posts')
        .select('id, title, content, updated_at')
        .in('id', post_ids)
        .eq('is_deleted', false)
        .limit(limit);
      
      if (specificError) {
        console.error('[POST /api/embeddings/batch-update] Error fetching specific posts:', specificError);
        return NextResponse.json(
          { error: 'Failed to fetch specified posts' },
          { status: 500 }
        );
      }
      
      postsToUpdate = specificPosts || [];
    } else {
      // 查找需要更新embedding的帖子
      let query = supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          updated_at,
          post_embeddings (
            id,
            updated_at
          )
        `)
        .eq('is_deleted', false)
        .limit(limit);
      
      if (!force_update) {
        // 只获取没有embedding或embedding过期的帖子
        // 这个查询可能需要根据实际数据库结构调整
        query = query.or('post_embeddings.id.is.null,post_embeddings.updated_at.lt.posts.updated_at');
      }
      
      const { data: posts, error: postsError } = await query;
      
      if (postsError) {
        console.error('[POST /api/embeddings/batch-update] Error fetching posts:', postsError);
        return NextResponse.json(
          { error: 'Failed to fetch posts' },
          { status: 500 }
        );
      }
      
      // 过滤出真正需要更新的帖子
      postsToUpdate = (posts || []).filter(post => {
        if (force_update) return true;
        
        const hasEmbedding = post.post_embeddings && post.post_embeddings.length > 0;
        if (!hasEmbedding) return true;
        
        const embeddingUpdated = new Date(post.post_embeddings[0].updated_at);
        const postUpdated = new Date(post.updated_at);
        
        return postUpdated > embeddingUpdated;
      });
    }
    
    if (postsToUpdate.length === 0) {
      console.log('[POST /api/embeddings/batch-update] No posts need embedding updates');
      return NextResponse.json({
        success: true,
        message: 'No posts need embedding updates',
        processed: 0,
        results: []
      });
    }
    
    console.log(`[POST /api/embeddings/batch-update] Found ${postsToUpdate.length} posts to update`);
    
    // 批量更新embedding
    const results = [];
    const errors = [];
    
    for (const post of postsToUpdate) {
      try {
        console.log(`[POST /api/embeddings/batch-update] Updating embedding for post ${post.id}`);
        
        // 调用单个帖子的embedding更新API
        const updateResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/posts/${post.id}/update-embedding`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // 传递session信息（如果需要）
            ...(session && { 'Authorization': `Bearer ${session.accessToken}` })
          }
        });
        
        if (updateResponse.ok) {
          const updateResult = await updateResponse.json();
          results.push({
            post_id: post.id,
            success: true,
            message: updateResult.message,
            metadata: updateResult.metadata
          });
          console.log(`[POST /api/embeddings/batch-update] Successfully updated embedding for post ${post.id}`);
        } else {
          const errorResult = await updateResponse.json();
          errors.push({
            post_id: post.id,
            success: false,
            error: errorResult.error || 'Unknown error'
          });
          console.error(`[POST /api/embeddings/batch-update] Failed to update embedding for post ${post.id}:`, errorResult.error);
        }
      } catch (error) {
        errors.push({
          post_id: post.id,
          success: false,
          error: error.message
        });
        console.error(`[POST /api/embeddings/batch-update] Exception updating post ${post.id}:`, error);
      }
      
      // 添加小延迟避免过载
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 记录批量更新日志
    try {
      await supabase
        .from('action_log')
        .insert({
          user_id: session.user.id,
          action: 'batch_update_embeddings',
          target_table: 'post_embeddings',
          metadata: {
            total_posts: postsToUpdate.length,
            successful_updates: results.length,
            failed_updates: errors.length,
            force_update
          },
          occurred_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('[POST /api/embeddings/batch-update] Failed to log batch update:', logError);
    }
    
    const response = {
      success: true,
      message: `Batch update completed. ${results.length} successful, ${errors.length} failed.`,
      processed: postsToUpdate.length,
      successful: results.length,
      failed: errors.length,
      results: results,
      errors: errors.length > 0 ? errors : undefined
    };
    
    console.log(`[POST /api/embeddings/batch-update] Batch update completed:`, {
      processed: response.processed,
      successful: response.successful,
      failed: response.failed
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[POST /api/embeddings/batch-update] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/embeddings/batch-update
 * 获取需要更新embedding的帖子统计信息
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('include_details') === 'true';
    
    const supabase = createServerSupabaseClient();
    
    // 获取所有帖子的embedding状态
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        updated_at,
        comment_count,
        post_embeddings (
          id,
          updated_at,
          model_version
        )
      `)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false })
      .limit(includeDetails ? 100 : 1000);
    
    if (error) {
      console.error('[GET /api/embeddings/batch-update] Error fetching posts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      );
    }
    
    // 分析embedding状态
    let totalPosts = 0;
    let postsWithEmbedding = 0;
    let postsNeedingUpdate = 0;
    let postsWithoutEmbedding = 0;
    const needsUpdateDetails = [];
    
    for (const post of posts || []) {
      totalPosts++;
      
      const hasEmbedding = post.post_embeddings && post.post_embeddings.length > 0;
      
      if (hasEmbedding) {
        postsWithEmbedding++;
        
        const embeddingUpdated = new Date(post.post_embeddings[0].updated_at);
        const postUpdated = new Date(post.updated_at);
        
        if (postUpdated > embeddingUpdated) {
          postsNeedingUpdate++;
          if (includeDetails) {
            needsUpdateDetails.push({
              post_id: post.id,
              title: post.title?.substring(0, 100) + (post.title?.length > 100 ? '...' : ''),
              post_updated: post.updated_at,
              embedding_updated: post.post_embeddings[0].updated_at,
              comment_count: post.comment_count || 0,
              model_version: post.post_embeddings[0].model_version
            });
          }
        }
      } else {
        postsWithoutEmbedding++;
        postsNeedingUpdate++;
        if (includeDetails) {
          needsUpdateDetails.push({
            post_id: post.id,
            title: post.title?.substring(0, 100) + (post.title?.length > 100 ? '...' : ''),
            post_updated: post.updated_at,
            embedding_updated: null,
            comment_count: post.comment_count || 0,
            model_version: null
          });
        }
      }
    }
    
    const response = {
      statistics: {
        total_posts: totalPosts,
        posts_with_embedding: postsWithEmbedding,
        posts_without_embedding: postsWithoutEmbedding,
        posts_needing_update: postsNeedingUpdate,
        embedding_coverage: totalPosts > 0 ? Math.round((postsWithEmbedding / totalPosts) * 100) : 0
      }
    };
    
    if (includeDetails) {
      response.posts_needing_update = needsUpdateDetails.slice(0, 50); // 限制返回数量
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[GET /api/embeddings/batch-update] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
