import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { supabase } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

/**
 * 获取所有面板列表的 API 路由
 */
export async function GET(request) {
  try {
    const supabase = createServerSupabaseClient();
    const searchParams = new URL(request.url).searchParams;
    
    // 提取查询参数
    const orderBy = searchParams.get('orderBy') || 'id';
    const orderDirection = searchParams.get('orderDirection') || 'asc';
    const limit = parseInt(searchParams.get('limit') || '100', 10); 
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // 构建查询
    let query = supabase
      .from('boards')
      .select('id, name, slug, description, color, icon, visibility, status, anonymous, is_active, sort_order, created_at, created_by, created_by_type, updated_at, language')
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .limit(limit)
      .range(offset, offset + limit - 1);
    
    // 添加可选的过滤条件
    if(searchParams.has('status')){
      query = query.eq('status', searchParams.get('status'));
    }

    if(searchParams.has('language')){
      query = query.eq('language', searchParams.get('language'));
    }

    if(searchParams.has('visibility')){
      query = query.eq('visibility', searchParams.get('visibility'));
    }

    if(searchParams.has('anonymous')){
      query = query.eq('anonymous', searchParams.get('anonymous'));
    }

    if(searchParams.has('is_active')){
      query = query.eq('is_active', searchParams.get('is_active'));
    }

    if(searchParams.has('sort_order')){
      query = query.eq('sort_order', searchParams.get('sort_order'));
    } 

    if(searchParams.has('created_by')){
      query = query.eq('created_by', searchParams.get('created_by'));
    }

    if(searchParams.has('created_by_type')){
      query = query.eq('created_by_type', searchParams.get('created_by_type'));
    }

    if(searchParams.has('updated_at')){
      query = query.eq('updated_at', searchParams.get('updated_at'));
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

export async function POST(request) {
    const { data } = await request.json();
    
    // 获取用户会话
    const session = await getServerSession();
    
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user } = session;

    try {
        const { boards, error } = await supabase
        .from("boards")
        .insert({
            name: data.boardName,
            slug: data.slug,
            description: data.description,
            color: data.color,
            icon: data.categoryIcon,
            visibility: data.visibility,
            anonymous: data.anonymousPost,
            is_active: false,
            created_by: user.id,
            created_by_type: 'user',
            created_at: new Date(),
            updated_at: new Date(),
        })
        .select('id, name, slug, description, color, icon, visibility, anonymous, created_by, created_by_type, created_at, updated_at')
        .single();
        
        if (error) throw error;
        
        return NextResponse.json({ success: true, board: boards });
    } catch (error) {
        console.error('创建板块失败:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}