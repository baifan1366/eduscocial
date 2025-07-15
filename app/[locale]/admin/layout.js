import MenuBar from "@/components/admin/dashboard/MenuBar";

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <MenuBar />
      {children}
    </div>
  );
} 