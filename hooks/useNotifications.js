// 'use client';

// import { useState, useEffect, useCallback } from 'react';
// import useAuth from '@/hooks/useAuth';
// import { notifyApi, usersApi } from '@/lib/api';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// export function useNotifications() {
//   const [unreadCount, setUnreadCount] = useState(0);
//   const { user } = useAuth();
//   const queryClient = useQueryClient();
  
//   // 为React Query定义缓存键
//   const notificationsKey = ['notifications', user?.id];

//   // 获取通知的查询函数
//   const fetchNotificationsFromApi = async ({ page = 1, limit = 20, unreadOnly = false, type = null }) => {
//     if (!user?.id) {
//       return { notifications: [], unreadCount: 0, totalCount: 0, page, limit };
//     }

//     const params = {
//       page,
//       limit,
//       ...(unreadOnly && { unread: 'true' }),
//       ...(type && { type })
//     };

//     return usersApi.getNotifications(user.id, params);
//   };

//   // 使用React Query获取通知
//   const { data, isLoading, error, refetch } = useQuery({
//     queryKey: [...notificationsKey, 'list'],
//     queryFn: () => fetchNotificationsFromApi({}),
//     enabled: !!user?.id,
//     staleTime: 1000 * 60, // 1分钟后数据过期
//   });

//   // 通知数据和计数
//   const notifications = data?.notifications || [];
  
//   useEffect(() => {
//     if (data?.unreadCount !== undefined) {
//       setUnreadCount(data.unreadCount);
//     }
//   }, [data?.unreadCount]);

//   // 标记通知为已读的变更函数
//   const markAsReadMutation = useMutation({
//     mutationFn: async ({ notificationIds = [], markAllRead = false }) => {
//       if (!user?.id) return;
      
//       return usersApi.markNotificationsRead(user.id, {
//         notification_ids: notificationIds,
//         mark_all_read: markAllRead
//       });
//     },
//     onSuccess: (data, variables) => {
//       // 更新本地状态和缓存
//       const { notificationIds, markAllRead } = variables;
      
//       queryClient.setQueryData([...notificationsKey, 'list'], (oldData) => {
//         if (!oldData) return oldData;
        
//         let updatedNotifications;
//         if (markAllRead) {
//           updatedNotifications = oldData.notifications.map(n => ({ ...n, is_read: true }));
//           setUnreadCount(0);
//         } else {
//           updatedNotifications = oldData.notifications.map(n => 
//             notificationIds.includes(n.id) ? { ...n, is_read: true } : n
//           );
//           setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
//         }
        
//         return {
//           ...oldData,
//           notifications: updatedNotifications,
//           unreadCount: markAllRead ? 0 : Math.max(0, oldData.unreadCount - notificationIds.length)
//         };
//       });
//     }
//   });

//   // 创建通知的变更函数
//   const createNotificationMutation = useMutation({
//     mutationFn: async (notificationData) => {
//       if (!user?.id) return;
      
//       return usersApi.createNotification(user.id, notificationData);
//     },
//     onSuccess: () => {
//       // 创建通知成功后刷新数据
//       queryClient.invalidateQueries({ queryKey: notificationsKey });
//     }
//   });

//   // 获取更多通知（加载更多/分页）
//   const fetchMoreNotifications = useCallback(async (page = 1, limit = 20, unreadOnly = false, type = null) => {
//     if (!user?.id) return;
    
//     try {
//       const newData = await fetchNotificationsFromApi({ page, limit, unreadOnly, type });
      
//       // 如果是第一页，完全替换数据
//       if (page === 1) {
//         queryClient.setQueryData([...notificationsKey, 'list'], newData);
//       } else {
//         // 否则，添加到现有数据
//         queryClient.setQueryData([...notificationsKey, 'list'], (oldData) => {
//           if (!oldData) return newData;
//           return {
//             ...newData,
//             notifications: [...oldData.notifications, ...newData.notifications],
//           };
//         });
//       }
      
//       return newData;
//     } catch (error) {
//       console.error('error:', error);
//       throw error;
//     }
//   }, [user?.id, queryClient, notificationsKey]);

//   // 设置实时SSE订阅
//   useEffect(() => {
//     if (!user?.id || typeof window === 'undefined') return;

//     // 创建SSE连接
//     const eventSource = notifyApi.createSSEConnection();
    
//     if (!eventSource) return;

//     // 监听连接事件
//     eventSource.addEventListener('connected', (event) => {
//       console.log('SSE notification connection established', event);
//     });

//     // 监听新通知事件
//     eventSource.addEventListener('new_notification', (event) => {
//       try {
//         const newNotification = JSON.parse(event.data);
//         console.log('Received new notification:', newNotification);
        
//         // 更新React Query缓存
//         queryClient.setQueryData([...notificationsKey, 'list'], (oldData) => {
//           if (!oldData) return oldData;
          
//           // 添加新通知到列表开头
//           return {
//             ...oldData,
//             notifications: [newNotification, ...oldData.notifications],
//             unreadCount: (oldData.unreadCount || 0) + 1
//           };
//         });
        
//         // 更新未读计数
//         setUnreadCount(prev => prev + 1);
//       } catch (error) {
//         console.error('error:', error);
//       }
//     });

//     // 监听通知更新事件
//     eventSource.addEventListener('notification_updated', (event) => {
//       try {
//         const updatedNotification = JSON.parse(event.data);
//         console.log('Notification updated:', updatedNotification);
        
//         // 更新React Query缓存中的通知
//         queryClient.setQueryData([...notificationsKey, 'list'], (oldData) => {
//           if (!oldData) return oldData;
          
//           // 更新通知列表
//           const updatedNotifications = oldData.notifications.map(n => 
//             n.id === updatedNotification.id ? updatedNotification : n
//           );
          
//           // 如果阅读状态发生变化，更新未读计数
//           let updatedUnreadCount = oldData.unreadCount;
//           const oldNotification = oldData.notifications.find(n => n.id === updatedNotification.id);
          
//           if (oldNotification && oldNotification.is_read === false && updatedNotification.is_read === true) {
//             updatedUnreadCount = Math.max(0, updatedUnreadCount - 1);
//             setUnreadCount(prev => Math.max(0, prev - 1));
//           }
          
//           return {
//             ...oldData,
//             notifications: updatedNotifications,
//             unreadCount: updatedUnreadCount
//           };
//         });
//       } catch (error) {
//         console.error('error:', error);
//       }
//     });

//     // 监听错误
//     eventSource.addEventListener('error', (error) => {
//       console.error('SSE notification connection error:', error);
//       // 可以在这里添加重连逻辑
//     });

//     // 清理函数
//     return () => {
//       eventSource.close();
//     };
//   }, [user?.id, queryClient, notificationsKey]);

//   // 包装API函数供组件使用
//   const markAsRead = useCallback((notificationIds = [], markAllRead = false) => {
//     return markAsReadMutation.mutate({ notificationIds, markAllRead });
//   }, [markAsReadMutation]);

//   const createNotification = useCallback((notificationData) => {
//     return createNotificationMutation.mutate(notificationData);
//   }, [createNotificationMutation]);

//   return {
//     notifications,
//     unreadCount,
//     loading: isLoading,
//     error,
//     fetchNotifications: fetchMoreNotifications,
//     markAsRead,
//     createNotification,
//     refetch
//   };
// }