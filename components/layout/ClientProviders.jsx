'use client';

import { useState, useEffect } from 'react';
import AuthProvider from '../auth/AuthProvider';
import AdminAuthProvider from '../admin/login/AdminAuthProvider';

export default function ClientProviders({ children }) {
  const [isClient, setIsClient] = useState(false);
  
  // 确保客户端水合完成后再渲染
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // 页面内容包装器，解决水合不匹配问题
  const content = (
    <AuthProvider>
      <AdminAuthProvider>
        {children}
      </AdminAuthProvider>
    </AuthProvider>
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