'use client';

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import AuthProvider from '@/components/auth/AuthProvider';
import AdminAuthProvider from '@/components/admin/login/AdminAuthProvider';
import { queryErrorHandler, mutationErrorHandler } from '@/lib/reactQueryErrorHandler';
import { Toaster } from '@/components/ui/sonner';

export default function EnhancedClientProviders({ children }) {
  const [isClient, setIsClient] = useState(false);
  
  // Create QueryClient with optimized defaults and error handling
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors except 408, 429
          if (error?.status >= 400 && error?.status < 500 && ![408, 429].includes(error?.status)) {
            return false;
          }
          return failureCount < 3;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        onError: queryErrorHandler, // Add global error handler
      },
      mutations: {
        retry: (failureCount, error) => {
          // Don't retry mutations on 4xx errors
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
        onError: mutationErrorHandler, // Add global error handler
      },
    },
  }));
  
  // 确保客户端水合完成后再渲染
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // 页面内容包装器，解决水合不匹配问题
  const content = (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminAuthProvider>
          {children}
        </AdminAuthProvider>
      </AuthProvider>
      {/* Add toast notifications */}
      <Toaster position="top-right" richColors closeButton />
      {/* Only show DevTools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  );
  
  // 在服务器端渲染基本结构，在客户端完成水合后渲染完整内容
  return (
    <>
      <div suppressHydrationWarning>
        {isClient ? content : null}
      </div>
      {!isClient && (
        <div style={{ visibility: 'hidden' }}>
          {content}
        </div>
      )}
    </>
  );
} 