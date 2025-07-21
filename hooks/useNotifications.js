import { useState, useEffect, useCallback } from 'react';
import useAuth from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Enhanced notifications hook using React Query
 * Follows JWT authentication pattern with Redis token validation
 * Provides real-time updates via SSE
 */
export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // React Query cache keys
  const notificationsKey = ['notifications', user?.id];

  // API function to fetch notifications with JWT authentication
  const fetchNotifications = async ({ page = 1, limit = 20, unreadOnly = false, type = null }) => {
    if (!user?.id || !isAuthenticated) {
      return { notifications: [], unreadCount: 0, totalCount: 0, page, limit };
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(unreadOnly && { unread: 'true' }),
      ...(type && { type })
    });

    const response = await fetch(`/api/users/${user.id}/notification?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for JWT authentication
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      if (response.status === 403) {
        throw new Error('Access denied');
      }
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch notifications');
    }

    return response.json();
  };

  // React Query for fetching notifications
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    isError 
  } = useQuery({
    queryKey: [...notificationsKey, 'list'],
    queryFn: () => fetchNotifications({}),
    enabled: !!user?.id && isAuthenticated,
    staleTime: 1000 * 60, // 1 minute
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Update unread count when data changes
  useEffect(() => {
    if (data?.unreadCount !== undefined) {
      setUnreadCount(data.unreadCount);
    }
  }, [data?.unreadCount]);

  // Mutation to mark notifications as read
  const markAsReadMutation = useMutation({
    mutationFn: async ({ notificationIds = [], markAllRead = false }) => {
      if (!user?.id || !isAuthenticated) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`/api/users/${user.id}/notification`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          notification_ids: notificationIds,
          mark_all_read: markAllRead
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark notifications as read');
      }

      return response.json();
    },
    onSuccess: (result, variables) => {
      const { notificationIds, markAllRead } = variables;
      
      // Optimistically update the cache
      queryClient.setQueryData([...notificationsKey, 'list'], (oldData) => {
        if (!oldData) return oldData;
        
        let updatedNotifications;
        let newUnreadCount;
        
        if (markAllRead) {
          updatedNotifications = oldData.notifications.map(n => ({ ...n, is_read: true }));
          newUnreadCount = 0;
        } else {
          updatedNotifications = oldData.notifications.map(n => 
            notificationIds.includes(n.id) ? { ...n, is_read: true } : n
          );
          newUnreadCount = Math.max(0, oldData.unreadCount - notificationIds.length);
        }
        
        setUnreadCount(newUnreadCount);
        
        return {
          ...oldData,
          notifications: updatedNotifications,
          unreadCount: newUnreadCount
        };
      });
    },
    onError: (error) => {
      console.error('Failed to mark notifications as read:', error);
      // Optionally show user-friendly error message
    }
  });

  // Mutation to create notifications (admin/system use)
  const createNotificationMutation = useMutation({
    mutationFn: async (notificationData) => {
      if (!user?.id || !isAuthenticated) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`/api/users/${user.id}/notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create notification');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: notificationsKey });
    },
    onError: (error) => {
      console.error('Failed to create notification:', error);
    }
  });

  // Function to fetch more notifications (pagination)
  const fetchMoreNotifications = useCallback(async (page = 1, limit = 20, unreadOnly = false, type = null) => {
    if (!user?.id || !isAuthenticated) return;
    
    try {
      const newData = await fetchNotifications({ page, limit, unreadOnly, type });
      
      if (page === 1) {
        // Replace data for first page
        queryClient.setQueryData([...notificationsKey, 'list'], newData);
      } else {
        // Append data for subsequent pages
        queryClient.setQueryData([...notificationsKey, 'list'], (oldData) => {
          if (!oldData) return newData;
          return {
            ...newData,
            notifications: [...oldData.notifications, ...newData.notifications],
          };
        });
      }
      
      return newData;
    } catch (error) {
      console.error('Failed to fetch more notifications:', error);
      throw error;
    }
  }, [user?.id, isAuthenticated, queryClient, notificationsKey]);

  // Real-time SSE connection for live updates
  useEffect(() => {
    if (!user?.id || !isAuthenticated || typeof window === 'undefined') return;

    // Create SSE connection with JWT authentication
    const eventSource = new EventSource(`/api/notify/sse?userId=${user.id}`, {
      withCredentials: true // Include cookies for authentication
    });
    
    // Connection established
    eventSource.addEventListener('open', () => {
      console.log('SSE notification connection established');
    });

    // New notification received
    eventSource.addEventListener('new_notification', (event) => {
      try {
        const newNotification = JSON.parse(event.data);
        console.log('Received new notification:', newNotification);
        
        // Update React Query cache
        queryClient.setQueryData([...notificationsKey, 'list'], (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            notifications: [newNotification, ...oldData.notifications],
            unreadCount: (oldData.unreadCount || 0) + 1
          };
        });
        
        // Update local unread count
        setUnreadCount(prev => prev + 1);
      } catch (error) {
        console.error('Error processing new notification:', error);
      }
    });

    // Notification updated
    eventSource.addEventListener('notification_updated', (event) => {
      try {
        const updatedNotification = JSON.parse(event.data);
        console.log('Notification updated:', updatedNotification);
        
        queryClient.setQueryData([...notificationsKey, 'list'], (oldData) => {
          if (!oldData) return oldData;
          
          const updatedNotifications = oldData.notifications.map(n => 
            n.id === updatedNotification.id ? updatedNotification : n
          );
          
          // Update unread count if read status changed
          let updatedUnreadCount = oldData.unreadCount;
          const oldNotification = oldData.notifications.find(n => n.id === updatedNotification.id);
          
          if (oldNotification && !oldNotification.is_read && updatedNotification.is_read) {
            updatedUnreadCount = Math.max(0, updatedUnreadCount - 1);
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
          
          return {
            ...oldData,
            notifications: updatedNotifications,
            unreadCount: updatedUnreadCount
          };
        });
      } catch (error) {
        console.error('Error processing notification update:', error);
      }
    });

    // Handle connection errors
    eventSource.addEventListener('error', (error) => {
      console.error('SSE connection error:', error);
      // Could implement reconnection logic here
    });

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, [user?.id, isAuthenticated, queryClient, notificationsKey]);

  // Wrapper functions for mutations
  const markAsRead = useCallback((notificationIds = [], markAllRead = false) => {
    return markAsReadMutation.mutate({ notificationIds, markAllRead });
  }, [markAsReadMutation]);

  const createNotification = useCallback((notificationData) => {
    return createNotificationMutation.mutate(notificationData);
  }, [createNotificationMutation]);

  return {
    // Data
    notifications: data?.notifications || [],
    unreadCount,
    totalCount: data?.totalCount || 0,
    
    // Loading states
    loading: isLoading,
    error: isError ? error : null,
    
    // Actions
    fetchNotifications: fetchMoreNotifications,
    markAsRead,
    createNotification,
    refetch,
    
    // Mutation states
    markingAsRead: markAsReadMutation.isPending,
    creatingNotification: createNotificationMutation.isPending,
  };
}