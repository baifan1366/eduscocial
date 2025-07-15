import { NextResponse } from "next/server";
import { removeAdminSession } from "../../../../lib/redis/adminLogin";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    // 获取cookie存储
    const cookieStore = await cookies();
    const userId = cookieStore.get('adminUserId')?.value;
    
    // 1. 删除Redis中的管理员会话
    if (userId) {
      await removeAdminSession(userId);
    }
    
    // 2. 清除cookie
    await cookieStore.delete('adminUserId');
    
    // 清除NextAuth会话cookie
    const sessionCookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token' 
      : 'next-auth.session-token';
    await cookieStore.delete(sessionCookieName);
    
    // 清除其他相关的cookie
    await cookieStore.delete('next-auth.csrf-token');
    await cookieStore.delete('next-auth.callback-url');
    
    // 3. 返回成功响应
    return NextResponse.json({
      success: true,
      message: "Admin has successfully logged out"
    });
  } catch (error) {
    console.error('Admin logout error:', error.message);
    return NextResponse.json(
      { error: error.message || "Logout failed" },
      { status: 500 }
    );
  }
} 