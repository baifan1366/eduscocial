import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';

// 获取用户通知
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // 验证用户只能访问自己的通知
    if (session.user.id !== id) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const unreadOnly = url.searchParams.get('unread') === 'true';
    const type = url.searchParams.get('type');

    // 计算分页偏移量
    const offset = (page - 1) * limit;

    // 构建查询
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 应用过滤条件
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (type) {
      query = query.eq('type', type);
    }

    // 执行查询
    const { data: notifications, count, error } = await query;

    if (error) {
      console.error('error:', error);
      return NextResponse.json({ error: 'Get notifications failed' }, { status: 500 });
    }

    // 获取未读通知数量
    const { count: unreadCount, error: unreadError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', id)
      .eq('is_read', false);

    if (unreadError) {
      console.error('error:', unreadError);
      return NextResponse.json({ error: 'Get unread notifications count failed' }, { status: 500 });
    }

    return NextResponse.json({
      notifications,
      totalCount: count,
      unreadCount,
      page,
      limit
    });
  } catch (error) {
    console.error('error:', error);
    return NextResponse.json({ error: 'Get notifications failed' }, { status: 500 });
  }
}

// 标记通知为已读
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    // 验证用户只能修改自己的通知
    if (session.user.id !== id) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    const body = await request.json();
    const { notification_ids, mark_all_read } = body;

    let result;

    if (mark_all_read) {
      // 标记所有通知为已读
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', id)
        .select();

      if (error) {
        console.error('error:', error);
        return NextResponse.json({ error: 'Mark all notifications as read failed' }, { status: 500 });
      }

      result = data;
    } else if (notification_ids && notification_ids.length > 0) {
      // 标记指定通知为已读
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', id)
        .in('id', notification_ids)
        .select();

      if (error) {
        console.error('error:', error);
        return NextResponse.json({ error: 'Mark notifications as read failed' }, { status: 500 });
      }

      result = data;
    } else {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    return NextResponse.json({ success: true, updated: result });
  } catch (error) {
    console.error('error:', error);
    return NextResponse.json({ error: 'Mark notifications as read failed' }, { status: 500 });
  }
}

// 为用户创建通知
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    
    // 仅管理员或系统可以为其他用户创建通知
    if (session.user.id !== id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }
    
    // 添加用户ID到通知数据
    const notificationData = {
      ...body,
      user_id: id,
      is_read: false,
      created_at: new Date().toISOString()
    };

    // 创建通知
    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select();

    if (error) {
      console.error('error:', error);
      return NextResponse.json({ error: 'Create notification failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, notification: data[0] });
  } catch (error) {
    console.error('error:', error);
    return NextResponse.json({ error: 'Create notification failed' }, { status: 500 });
  }
}