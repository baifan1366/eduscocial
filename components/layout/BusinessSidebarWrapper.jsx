'use client';

import { usePathname } from 'next/navigation';
import BusinessSidebar from './BusinessSidebar';
import { checkBusinessAuthentication } from '@/lib/utils/authUtils';

export default function BusinessSidebarWrapper({ children }) {
  // 在客户端获取当前路径
  const pathname = usePathname();
  
  // 使用通用函数检查认证状态
  const isBusinessAuthenticated = checkBusinessAuthentication(pathname);

  if (isBusinessAuthenticated) {
    return (
      <BusinessSidebar>
        {children}
      </BusinessSidebar>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {children}
    </div>
  );
} 