import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validatePasswordStrength, hashPassword } from '@/lib/auth/password';

export async function POST(request) {
  try {
    // 获取请求体中的注册信息
    const { email, password, username } = await request.json();
    
    // 验证必需字段
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: '邮箱、密码和用户名是必填项' },
        { status: 400 }
      );
    }

    // 验证密码强度
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const { data: existingEmail, error: emailCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (emailCheckError) {
      console.error('检查邮箱错误:', emailCheckError);
      return NextResponse.json(
        { error: '验证邮箱时出错' },
        { status: 500 }
      );
    }

    if (existingEmail) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 409 }
      );
    }

    // 检查用户名是否已存在
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (userCheckError) {
      console.error('检查用户名错误:', userCheckError);
      return NextResponse.json(
        { error: '验证用户名时出错' },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: '该用户名已被使用' },
        { status: 409 }
      );
    }

    // 对密码进行哈希处理
    const hashedPassword = await hashPassword(password);

    // 直接创建用户记录
    const { error: createUserError } = await supabase
      .from('users')
      .insert({
        email,
        username,
        password_hash: hashedPassword,
        created_at: new Date().toISOString()
      });

    if (createUserError) {
      console.error('创建用户错误:', createUserError);
      return NextResponse.json(
        { error: '创建账户时出错' },
        { status: 500 }
      );
    }

    // 返回成功响应和用户数据，但不包含会话
    return NextResponse.json({
      message: '注册成功',
      user: {
        email,
        username
      },
      requiresLogin: true
    });
  } catch (error) {
    console.error('注册路由错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}
