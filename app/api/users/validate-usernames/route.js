import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';
import { validateUsernamesInDatabase } from '@/lib/mentionParser';

/**
 * POST /api/users/validate-usernames
 * 验证用户名是否存在
 */
export async function POST(request) {
  try {
    const session = await getServerSession();
    
    // 这个API可以不需要认证，但有认证会更安全
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { usernames } = body;
    
    // 验证输入
    if (!Array.isArray(usernames)) {
      return NextResponse.json(
        { error: 'usernames must be an array' },
        { status: 400 }
      );
    }
    
    if (usernames.length === 0) {
      return NextResponse.json({
        success: true,
        users: [],
        count: 0
      });
    }
    
    if (usernames.length > 50) {
      return NextResponse.json(
        { error: 'Too many usernames (max 50)' },
        { status: 400 }
      );
    }
    
    // 验证用户名格式
    const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
    const invalidUsernames = usernames.filter(username => 
      !username || 
      typeof username !== 'string' || 
      username.length > 50 || 
      !validUsernameRegex.test(username)
    );
    
    if (invalidUsernames.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid usernames found',
          invalid_usernames: invalidUsernames
        },
        { status: 400 }
      );
    }
    
    const supabase = createServerSupabaseClient();
    
    // 查询数据库验证用户名
    const validUsers = await validateUsernamesInDatabase(usernames, supabase);
    
    // 构建结果
    const result = {
      success: true,
      users: validUsers.map(user => ({
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url
      })),
      count: validUsers.length,
      requested_count: usernames.length,
      found_usernames: validUsers.map(user => user.username),
      not_found_usernames: usernames.filter(username => 
        !validUsers.some(user => user.username === username)
      )
    };
    
    console.log(`[POST /api/users/validate-usernames] Validated ${usernames.length} usernames, found ${validUsers.length} valid users`);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[POST /api/users/validate-usernames] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/validate-usernames?usernames=user1,user2,user3
 * 通过查询参数验证用户名（用于简单查询）
 */
export async function GET(request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const usernamesParam = searchParams.get('usernames');
    
    if (!usernamesParam) {
      return NextResponse.json(
        { error: 'usernames parameter is required' },
        { status: 400 }
      );
    }
    
    // 解析用户名列表
    const usernames = usernamesParam.split(',').map(name => name.trim()).filter(Boolean);
    
    if (usernames.length === 0) {
      return NextResponse.json({
        success: true,
        users: [],
        count: 0
      });
    }
    
    if (usernames.length > 20) {
      return NextResponse.json(
        { error: 'Too many usernames in GET request (max 20)' },
        { status: 400 }
      );
    }
    
    const supabase = createServerSupabaseClient();
    
    // 查询数据库验证用户名
    const validUsers = await validateUsernamesInDatabase(usernames, supabase);
    
    const result = {
      success: true,
      users: validUsers.map(user => ({
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url
      })),
      count: validUsers.length
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[GET /api/users/validate-usernames] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
