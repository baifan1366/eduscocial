import '../../../app/globals.css';
import BusinessSidebarWrapper from '@/components/layout/BusinessSidebarWrapper';

export default function BusinessLayout({ children }) {
  // 使用客户端包装组件，它会根据路径自动处理认证状态
  return <BusinessSidebarWrapper>{children}</BusinessSidebarWrapper>;
}