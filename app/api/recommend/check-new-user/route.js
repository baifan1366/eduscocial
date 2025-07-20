import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/serverAuth';
import { isNewUser } from '@/lib/redis/redisUtils';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '需要登录' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const userIsNew = await isNewUser(userId);
    
    return NextResponse.json({ 
      isNewUser: userIsNew
    });
    
  } catch (error) {
    console.error('Error checking user status:', error);
    return NextResponse.json(
      { error: '检查用户状态失败' },
      { status: 500 }
    );
  }
} 