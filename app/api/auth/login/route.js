import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { comparePassword } from '@/lib/auth/password';

export async function POST(request) {
  try {
    // 获取请求体中的登录凭证
    const { email, password } = await request.json();
    
    // 验证必需字段
    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码是必填项' },
        { status: 400 }
      );
    }

    // 直接从users表中查询用户
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    // 如果有错误或没找到用户
    if (userError || !user) {
      console.error('登录错误:', userError || '用户不存在');
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    // 更新用户的最后登录时间
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // 生成会话
    const session = {
      id: user.id,
      created_at: new Date().toISOString()
    };

    // 返回成功响应和用户数据
    return NextResponse.json({
      message: '登录成功',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role || 'user',
        name: user.name || user.username
      },
      session: session
    });
  } catch (error) {
    console.error('登录路由错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}
