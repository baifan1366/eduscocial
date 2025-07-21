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

    // 创建用户记录并返回创建的数据
    const { data: newUser, error: createUserError } = await supabase
      .from('users')
      .insert({
        email,
        username,
        password_hash: hashedPassword,
        is_active: true,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (createUserError) {
      console.error('创建用户错误:', createUserError);
      return NextResponse.json(
        { error: '创建账户时出错' },
        { status: 500 }
      );
    }

    // 为用户创建一个空的 user_profiles 记录
    const { error: createProfileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: newUser.id,
        interests: '',
        relationship_status: 'prefer_not_to_say',
        favorite_quotes: '',
        favorite_country: '',
        daily_active_time: 'varies',
        study_abroad: 'no',
        leisure_activities: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (createProfileError) {
      console.error('创建用户配置文件错误:', createProfileError);
      // 尝试删除刚刚创建的用户，以防配置文件创建失败
      await supabase
        .from('users')
        .delete()
        .eq('id', newUser.id);
        
      return NextResponse.json(
        { error: '创建用户配置文件时出错' },
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