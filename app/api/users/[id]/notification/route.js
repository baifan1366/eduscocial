import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { supabase } from '@/lib/supabase';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import redis from '@/lib/redis/redis';

// GET handler to retrieve user notifications
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id: userId } = params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can access these notifications (own notifications only)
    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread') === 'true';
    const type = searchParams.get('type'); // 'like', 'comment', 'follow', etc.
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('notifications')
      .select(`
        id,
        type,
        title,
        content,
        data,
        post_id,
        comment_id,
        triggered_by,
        is_read,
        created_at,
        updated_at,
        triggered_by_user:users!notifications_triggered_by_fkey(
          id,
          display_name,
          username,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Get unread count from Redis cache or database
    let unreadCount = 0;
    try {
      const cachedCount = await redis.get(`user:${userId}:unread_count`);
      if (cachedCount !== null) {
        unreadCount = parseInt(cachedCount);
      } else {
        // Fallback to database count
        const { data: countData, error: countError } = await supabase
          .rpc('get_unread_notifications_count', { target_user_id: userId });
        
        if (!countError && countData !== null) {
          unreadCount = countData;
          // Cache the count for 5 minutes
          await redis.setex(`user:${userId}:unread_count`, 300, unreadCount);
        }
      }
    } catch (redisError) {
      console.error('Redis error:', redisError);
      // Fallback to database count
      const { data: countData } = await supabase
        .rpc('get_unread_notifications_count', { target_user_id: userId });
      unreadCount = countData || 0;
    }

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        hasMore: notifications.length === limit
      }
    });
  } catch (error) {
    console.error('Unexpected error in notifications GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST handler to create a new notification
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id: userId } = params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, message, data = {}, post_id, comment_id, triggered_by } = body;

    // Validate required fields
    if (!type || !title || !message) {
      return NextResponse.json({ 
        error: 'type, title, and message are required' 
      }, { status: 400 });
    }

    // Validate notification type
    const validTypes = ['like', 'comment', 'reply', 'follow', 'mention', 'system'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid notification type' 
      }, { status: 400 });
    }

    // Create notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        content,
        data,
        post_id,
        comment_id,
        triggered_by: triggered_by || session.user.id,
        read: false
      })
      .select(`
        id,
        type,
        title,
        content,
        data,
        post_id,
        comment_id,
        triggered_by,
        is_read,
        created_at,
        updated_at,
        triggered_by_user:users!notifications_triggered_by_fkey(
          id,
          display_name,
          username,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    // Update unread count in Redis
    try {
      const newCount = await redis.incr(`user:${userId}:unread_count`);
      await redis.expire(`user:${userId}:unread_count`, 300); // 5 minutes TTL

      // Publish to Redis PubSub for real-time updates
      await redis.publish(`notifications:${userId}`, JSON.stringify({
        type: 'new_notification',
        notification,
        unreadCount: newCount
      }));
    } catch (redisError) {
      console.error('Redis error updating unread count:', redisError);
    }

    return NextResponse.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Unexpected error in notifications POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH handler to mark notifications as read
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id: userId } = params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can modify these notifications (own notifications only)
    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { notification_ids, mark_all_read = false } = body;

    let query = supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false);

    if (!mark_all_read && notification_ids && notification_ids.length > 0) {
      query = query.in('id', notification_ids);
    }

    const { data, error } = await query.select('id');

    if (error) {
      console.error('Error marking notifications as read:', error);
      return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
    }

    const updatedCount = data?.length || 0;

    // Update unread count in Redis
    try {
      if (mark_all_read) {
        await redis.set(`user:${userId}:unread_count`, 0);
      } else if (updatedCount > 0) {
        const currentCount = await redis.get(`user:${userId}:unread_count`) || 0;
        const newCount = Math.max(0, parseInt(currentCount) - updatedCount);
        await redis.set(`user:${userId}:unread_count`, newCount);
      }
      await redis.expire(`user:${userId}:unread_count`, 300);

      // Publish to Redis PubSub for real-time updates
      const finalCount = await redis.get(`user:${userId}:unread_count`) || 0;
      await redis.publish(`notifications:${userId}`, JSON.stringify({
        type: 'notifications_read',
        unreadCount: parseInt(finalCount),
        updatedIds: notification_ids || []
      }));
    } catch (redisError) {
      console.error('Redis error updating unread count:', redisError);
    }

    return NextResponse.json({ 
      success: true, 
      updatedCount 
    });
  } catch (error) {
    console.error('Unexpected error in notifications PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}