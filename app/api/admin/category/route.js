import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

export async function GET(request) {
    try {
      const searchParams = new URL(request.url).searchParams;
      
      // 提取查询参数
      const orderBy = searchParams.get('orderBy') || 'id';
      const orderDirection = searchParams.get('orderDirection') || 'asc';
      const limit = parseInt(searchParams.get('limit') || '100', 10); 
      const offset = parseInt(searchParams.get('offset') || '0', 10);
      
      // 构建查询
      let query = supabase
        .from('board_categories')
        .select('id, name, description, color, icon, parent_id, is_active, created_at, created_by, updated_at')
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .limit(limit)
        .range(offset, offset + limit - 1);
      
      // 添加可选的过滤条件
      if(searchParams.has('is_active')){
        query = query.eq('is_active', searchParams.get('is_active'));
      }
  
      if(searchParams.has('parent_id')){
        query = query.eq('parent_id', searchParams.get('parent_id'));
      }
  
      if(searchParams.has('created_by')){
        query = query.eq('created_by', searchParams.get('created_by'));
      }
  
      if(searchParams.has('updated_at')){
        query = query.eq('updated_at', searchParams.get('updated_at'));
      }
      
      // 执行查询
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Get categories list error:', error);
        return NextResponse.json({ error: 'Get categories list failed' }, { status: 500 });
      }
      
      // 返回结果
      return NextResponse.json({
        categories: data || [],
        total: count || 0,
        limit,
        offset
      });
      
    } catch (error) {
      console.error('error:', error);
      return NextResponse.json({ error: 'Get categories list failed' }, { status: 500 });
    }
  }

export async function POST(request) {
    const { data } = await request.json();
    const { user } = await getServerSession();
    
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { categories, error } = await supabase
        .from("board_categories")
        .insert({
            name: data.name,
            description: data.description,
            color: data.color,
            icon: data.categoryIcon,
            parent_id: data.parent_id, // 正确处理parent_id
            is_active: false,
            created_by: user.id,
            created_at: new Date(),
            updated_at: new Date(),
        })
        .select('id, name, description, color, icon, parent_id, is_active, created_by, created_at, updated_at')
        .single();
        
        if (error) throw error;
        
        return NextResponse.json({ success: true, category: categories });
    } catch (error) {
        console.error('创建板块失败:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}