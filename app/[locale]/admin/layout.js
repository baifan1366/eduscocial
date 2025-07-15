'use client';

// 移除 AdminAuthProvider 的导入和使用，因为它已在根布局中使用
// import AdminAuthProvider from '../../../components/admin/login/AdminAuthProvider';

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      {children}
    </div>
  );
} 