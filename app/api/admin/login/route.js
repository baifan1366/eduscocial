import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import bcrypt from "bcrypt";
import { storeAdminSession } from "../../../../lib/redis/adminLogin";
import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";

// 添加CORS头部辅助函数
function corsHeaders() {
  // 根据环境确定允许的域名
  const origin = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_SITE_URL || 'https://edusocial.com'
    : 'http://localhost:3000';
    
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}

// 处理OPTIONS请求（预检请求）
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400, headers: corsHeaders() }
      );
    }
    
    // 1. 根据邮箱查找用户
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    
    if (userError) {
      console.error('Search user error:', userError);
      return NextResponse.json(
        { error: "Email or password is incorrect" },
        { status: 401, headers: corsHeaders() }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "Email or password is incorrect" },
        { status: 401, headers: corsHeaders() }
      );
    }
        
    // 2. 验证密码
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error('Password verification error:', bcryptError);
      return NextResponse.json(
        { error: "Error verifying password" },
        { status: 500, headers: corsHeaders() }
      );
    }
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Email or password is incorrect" },
        { status: 401, headers: corsHeaders() }
      );
    }
    
    // 3. 验证用户是否为管理员
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (adminError) {
      console.error('Query admin user error:', adminError);
      return NextResponse.json(
        { error: "No admin permission" },
        { status: 403, headers: corsHeaders() }
      );
    }
    
    if (!adminUser) {
      return NextResponse.json(
        { error: "No admin permission" },
        { status: 403, headers: corsHeaders() }
      );
    }
        
    // 4. 更新用户最后登录时间
    const { error: updateError } = await supabase
      .from('users')
      .update({ last_login_at: new Date() })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Update login time error:', updateError);
    }
    
    // 5. 创建管理员会话
    const sessionData = {
      email: user.email,
      name: user.display_name || user.username,
      role: adminUser.role,
      isAdmin: 'true',
      loginTime: Date.now().toString()
    };
    
    await storeAdminSession(user.id, sessionData);
    
    // 6. 创建JWT token并设置cookie
    const token = {
      userId: user.id,
      email: user.email,
      name: user.display_name || user.username,
      role: 'ADMIN', // 确保与middleware中检查的值匹配
      isAdmin: true,
      adminRole: adminUser.role
    };
    
    // 使用NextAuth JWT编码功能创建令牌
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('NEXTAUTH_SECRET environment variable is not set');
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500, headers: corsHeaders() }
      );
    }
    
    try {
      const jwtToken = await encode({
        token,
        secret
      });
      
      // 设置cookie
      const cookieStore = await cookies();
      
      // 设置next-auth.session-token cookie，这是NextAuth默认的cookie名称
      const tokenCookie = {
        name: process.env.NODE_ENV === 'production' 
          ? '__Secure-next-auth.session-token' 
          : 'next-auth.session-token',
        value: jwtToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 // 30天
      };
      await cookieStore.set(tokenCookie);
      
      // 设置自定义cookie存储管理员用户ID
      const userIdCookie = {
        name: 'adminUserId',
        value: user.id,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 // 30天
      };
      await cookieStore.set(userIdCookie);
    } catch (tokenError) {
      console.error('Create or set token error:', tokenError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500, headers: corsHeaders() }
      );
    }
    
    // 7. 返回用户信息（不包含敏感数据）
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.display_name || user.username || email.split('@')[0],
        role: adminUser.role || 'ADMIN',
        isAdmin: true,
        adminUserEmail: user.email,
        adminUserName: user.display_name || user.username || email.split('@')[0],
        adminUserRole: adminUser.role || 'ADMIN',
        isOnline: true
      },
      success: true
    }, { 
      headers: {
        ...corsHeaders(),
        'Cache-Control': 'no-store, max-age=0'
      }
    });
    
  } catch (error) {
    console.error('Admin login error:', error.message, error.stack);
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
