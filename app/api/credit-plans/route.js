import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
    try {
      const searchParams = new URL(request.url).searchParams;
      
      // 提取查询参数
      const orderBy = searchParams.get('orderBy') || 'credit_amount';
      const orderDirection = searchParams.get('orderDirection') || 'asc';
      const limit = parseInt(searchParams.get('limit') || '100', 10); 
      const offset = parseInt(searchParams.get('offset') || '0', 10);
      
      // 构建查询
      let query = supabase
        .from('credit_plans')
        .select('id, name, description, credit_amount, original_price, discount_price, billing_cycle, currency, is_discounted, is_active, created_at, updated_at')
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .limit(limit)
        .range(offset, offset + limit - 1);
      
      // 执行查询
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Get credit plans list error:', error);
        return NextResponse.json({ error: 'Get credit plans list failed' }, { status: 500 });
      }
      
      // 返回结果
      return NextResponse.json({
        credit_plans: data || [],
        total: count || 0,
        limit,
        offset
      });
      
    } catch (error) {
      console.error('error:', error);
      return NextResponse.json({ error: 'Get credit plans list failed' }, { status: 500 });
    }
  }