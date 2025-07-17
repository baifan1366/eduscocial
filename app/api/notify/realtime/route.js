import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';

// 获取实时通知配置
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 返回实时通知所需的配置信息
    // 如果使用WebSockets或SSE，这里可以返回连接所需的令牌或配置
    return NextResponse.json({
      success: true,
      config: {
        userId: session.user.id,
        channelName: `notifications:${session.user.id}`,
        // 可以添加其他配置如令牌等
      }
    });
  } catch (error) {
    console.error('error:', error);
    return NextResponse.json({ error: 'Get realtime notify config failed' }, { status: 500 });
  }
} 