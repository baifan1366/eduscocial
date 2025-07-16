import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getHotPosts, cacheHotPosts } from '@/lib/redis/redisUtils';

export async function GET(request) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  try {
    // 尝试从Redis缓存获取
    const cachedPosts = await getHotPosts();
    
    if (cachedPosts && cachedPosts.length >= limit) {
      return NextResponse.json({
        posts: cachedPosts.slice(0, limit),
        cached: true
      });
    }
    
    // 如果没有缓存或数量不足，则从数据库获取
    const supabase = createServerSupabaseClient();
    
    // 获取热门帖子（基于浏览量、点赞数和时间）
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        created_at,
        author_id,
        users!posts_author_id_fkey(username, display_name, avatar_url),
        board_id,
        boards(name, slug),
        view_count,
        like_count,
        comment_count
      `)
      .eq('is_draft', false)
      .eq('is_deleted', false)
      .order('view_count', { ascending: false })
      .order('like_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching trending posts:', error);
      return NextResponse.json(
        { error: '获取热门帖子失败' },
        { status: 500 }
      );
    }
    
    // 缓存结果供将来使用
    await cacheHotPosts(posts);
    
    return NextResponse.json({ 
      posts,
      cached: false
    });
    
  } catch (error) {
    console.error('Error in trending posts API:', error);
    return NextResponse.json(
      { error: '获取热门帖子失败' },
      { status: 500 }
    );
  }
} 