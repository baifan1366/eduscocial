import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getTrendingTags, cacheTrendingTags } from '@/lib/redis/redisUtils';

export async function GET(request) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  try {
    // 尝试从Redis缓存获取
    const cachedTags = await getTrendingTags();
    
    if (cachedTags && cachedTags.length >= limit) {
      return NextResponse.json({
        tags: cachedTags.slice(0, limit),
        cached: true
      });
    }
    
    // 如果没有缓存或数量不足，则从数据库获取
    const supabase = createServerSupabaseClient();
    
    const { data: tags, error } = await supabase
      .from('hashtags')
      .select('id, name, usage_count')
      .order('usage_count', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching trending tags:', error);
      return NextResponse.json(
        { error: '获取热门标签失败' },
        { status: 500 }
      );
    }
    
    // 缓存结果供将来使用
    await cacheTrendingTags(tags);
    
    return NextResponse.json({ 
      tags,
      cached: false
    });
    
  } catch (error) {
    console.error('Error in trending tags API:', error);
    return NextResponse.json(
      { error: '获取热门标签失败' },
      { status: 500 }
    );
  }
} 