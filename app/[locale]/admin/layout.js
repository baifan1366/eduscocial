import MenuBar from "@/components/admin/dashboard/MenuBar";
import AdminNavbar from "@/components/layout/AdminNavbar";

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <AdminNavbar />
      <MenuBar />
      {children}
    </div>
  );
} 