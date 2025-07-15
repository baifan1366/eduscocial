'use client';

import AdminAuthProvider from '../../../components/admin/login/AdminAuthProvider';

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <AdminAuthProvider>
        {children}
      </AdminAuthProvider>
    </div>
  );
} 