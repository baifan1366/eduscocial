import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';

// 标记单个通知为已读
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    // 确保通知属于当前用户
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();
    
    if (fetchError || !notification) {
      console.error('Get notification error:', fetchError);
      return NextResponse.json({ error: 'Notification not found or unauthorized' }, { status: 404 });
    }
    
    // 标记通知为已读
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select();

    if (error) {
      console.error('Mark notification as read error:', error);
      return NextResponse.json({ error: 'Mark notification as read failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, notification: data[0] });
  } catch (error) {
    console.error('error:', error);
    return NextResponse.json({ error: 'Mark notification as read failed' }, { status: 500 });
  }
}

// 获取单个通知
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    // 获取通知
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      console.error('Get notification error:', error);
      return NextResponse.json({ error: 'Get notification failed' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Notification not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ notification: data });
  } catch (error) {
    console.error('error:', error);
    return NextResponse.json({ error: 'Get notification failed' }, { status: 500 });
  }
}

// 删除通知
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    // 确保通知属于当前用户
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();
    
    if (fetchError || !notification) {
      console.error('Get notification error:', fetchError);
      return NextResponse.json({ error: 'Notification not found or unauthorized' }, { status: 404 });
    }
    
    // 删除通知
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Delete notification error:', error);
      return NextResponse.json({ error: 'Delete notification failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('error:', error);
    return NextResponse.json({ error: 'Delete notification failed' }, { status: 500 });
  }
} 