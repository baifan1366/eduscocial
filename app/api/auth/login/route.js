import { loginUser } from "../../../../lib/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    
    const { user, session } = await loginUser({ email, password });
    
    // 创建JWT令牌
    const token = await encode({
      secret: process.env.NEXTAUTH_SECRET,
      token: {
        userId: user.id,
        email: user.email,
        name: user.display_name || user.username,
        role: user.role || "USER",
        auth: true // 添加明确的认证标识
      },
      maxAge: 30 * 24 * 60 * 60 // 30天
    });
    
    // 设置会话cookie，确保path正确
    const cookieStore = cookies();
    cookieStore.set({
      name: 'next-auth.session-token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax'
    });
    
    // 返回用户信息
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.display_name || user.username,
        role: user.role || "USER",
        isOnline: true,
        auth: true // 添加明确的认证标识
      },
      success: true
    });
    
  } catch (error) {
    console.error('Login error:', error.message);
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 401 }
    );
  }
}
