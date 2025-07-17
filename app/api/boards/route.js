import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * 获取所有面板列表的 API 路由
 */
export async function GET(request) {
  try {
    const supabase = createServerSupabaseClient();
    const searchParams = new URL(request.url).searchParams;
    
    // 提取查询参数
    const orderBy = searchParams.get('orderBy') || 'name';
    const orderDirection = searchParams.get('orderDirection') || 'asc';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // 构建查询
    let query = supabase
      .from('boards')
      .select('id, name, slug, description, post_count, last_activity')
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .limit(limit)
      .range(offset, offset + limit - 1);
    
    // 添加可选的过滤条件
    if (searchParams.has('active')) {
      query = query.eq('is_active', searchParams.get('active') === 'true');
    }
    
    if (searchParams.has('featured')) {
      query = query.eq('is_featured', searchParams.get('featured') === 'true');
    }
    
    if (searchParams.has('category')) {
      query = query.eq('category', searchParams.get('category'));
    }
    
    // 执行查询
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Get boards list error:', error);
      return NextResponse.json({ error: 'Get boards list failed' }, { status: 500 });
    }
    
    // 返回结果
    return NextResponse.json({
      boards: data || [],
      total: count || 0,
      limit,
      offset
    });
    
  } catch (error) {
    console.error('error:', error);
    return NextResponse.json({ error: 'Get boards list failed' }, { status: 500 });
  }
}
