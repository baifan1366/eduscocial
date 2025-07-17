'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  // Fetch notifications using the new API endpoint
  const fetchNotifications = useCallback(async (page = 1, limit = 20, unreadOnly = false, type = null) => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(unreadOnly && { unread: 'true' }),
        ...(type && { type })
      });

      const response = await fetch(`/api/users/${session.user.id}/notification?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      
      if (page === 1) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }
      
      setUnreadCount(data.unreadCount);
      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds = [], markAllRead = false) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/users/${session.user.id}/notification`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_ids: notificationIds,
          mark_all_read: markAllRead
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      // Update local state
      if (markAllRead) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      } else if (notificationIds.length > 0) {
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      }

      return { success: true };
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }, [session?.user?.id]);

  // Create notification (for testing or system notifications)
  const createNotification = useCallback(async (notificationData) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/users/${session.user.id}/notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        throw new Error('Failed to create notification');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }, [session?.user?.id]);

  // Set up real-time subscription using Supabase Realtime
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel(`notifications:${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          
          // Add new notification to the beginning of the list
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('Notification updated:', payload);
          
          // Update notification in the list
          setNotifications(prev => 
            prev.map(n => n.id === payload.new.id ? payload.new : n)
          );
          
          // Update unread count if read status changed
          if (payload.old.read === false && payload.new.read === true) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  // Set up Redis PubSub subscription for real-time updates
  useEffect(() => {
    if (!session?.user?.id) return;

    // This would be implemented with a WebSocket connection or Server-Sent Events
    // For now, we'll rely on Supabase Realtime
    
    return () => {
      // Cleanup Redis subscription
    };
  }, [session?.user?.id]);

  // Initial fetch
  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
    }
  }, [session?.user?.id, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    createNotification,
    refetch: () => fetchNotifications(1, 20, false)
  };
}