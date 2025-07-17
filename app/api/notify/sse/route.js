import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';

// 设置响应对象的辅助函数
function setupSSEResponse() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 保存controller以便于后续使用
      this.controller = controller;
      
      // 发送初始连接消息
      const data = encoder.encode('event: connected\ndata: {"status":"connected"}\n\n');
      controller.enqueue(data);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}

// 为SSE流添加消息的函数
async function sendSSEMessage(response, event, data) {
  if (!response.body.controller) return;
  
  const encoder = new TextEncoder();
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  response.body.controller.enqueue(encoder.encode(message));
}

// 处理实时通知的SSE连接
export async function GET(request) {
  try {
    // 验证用户身份
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const response = setupSSEResponse();
    
    // 连接Supabase实时通知
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          // 发送新通知事件
          await sendSSEMessage(response, 'new_notification', payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          // 发送通知更新事件
          await sendSSEMessage(response, 'notification_updated', payload.new);
        }
      )
      .subscribe();
    
    // 监听客户端断开连接
    request.signal.addEventListener('abort', () => {
      // 清理Supabase通道
      supabase.removeChannel(channel);
    });

    return response;
  } catch (error) {
    console.error('error:', error);
    return new Response('Server error', { status: 500 });
  }
} 