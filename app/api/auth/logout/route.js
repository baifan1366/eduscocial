import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    // 执行登出操作，清除当前会话
    const { error } = await supabase.auth.signOut();
    
    // 如果有错误，返回错误信息
    if (error) {
      console.error('登出错误:', error);
      return NextResponse.json(
        { error: error.message || '登出失败' },
        { status: 400 }
      );
    }
    
    // 返回成功响应
    return NextResponse.json({ message: '已成功登出' });
  } catch (error) {
    console.error('登出路由错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}
