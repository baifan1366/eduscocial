import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data: topics, error } = await supabase
      .from('topics')
      .select('id, name, description')
      .order('name');
    
    if (error) {
      console.error('Error fetching topics:', error);
      return NextResponse.json(
        { error: '获取主题分类失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ topics });
    
  } catch (error) {
    console.error('Error in topics API:', error);
    return NextResponse.json(
      { error: '获取主题分类失败' },
      { status: 500 }
    );
  }
} 