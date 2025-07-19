import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { comparePassword } from '@/lib/auth/password';
import { generateJWT } from '@/lib/auth/jwt';
import { setAuthCookie } from '@/lib/auth/cookies';

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

    // 生成JWT令牌
    const tokenPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name || user.username,
      role: user.role || 'user'
    };
    
    const token = await generateJWT(tokenPayload);
    
    // 创建响应
    const response = NextResponse.json({
      message: '登录成功',
      user: {
        id: user.id,
        userId: user.id, // 添加一个明确的userId字段，确保前端可以识别
        email: user.email,
        username: user.username,
        role: user.role || 'user',
        name: user.name || user.username
      },
      session: {
        id: user.id,
        created_at: new Date().toISOString()
      },
      token: token // 添加token字段到响应中，让前端可以获取
    });
    
    // 设置auth_token cookie
    setAuthCookie(response, token);
    
    return response;
  } catch (error) {
    console.error('登录路由错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}
