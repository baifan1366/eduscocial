import AdminAuthProvider from '../../../components/admin/login/AdminAuthProvider';
// import AdminNavbar from '../../../components/layout/AdminNavbar';
import '../../../app/globals.css';

export const metadata = {
  title: 'Admin | EduSocial',
  description: 'Admin dashboard for EduSocial',
};

export default function AdminLayout({ children, params }) {
  const { locale } = params;

  // Only wrap the children with AdminAuthProvider if not on the login page
  const isLoginPage = children.props.childProp.segment === 'login';

  if (isLoginPage) {
    return (
      <html lang={locale} suppressHydrationWarning>
        <body>
          <div className="min-h-screen bg-[#0A1929] text-white">
            {children}
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <AdminAuthProvider>
          <div className="min-h-screen bg-[#0A1929] text-white">
            {/* <AdminNavbar /> */}
            <div className="container mx-auto p-4">
              {children}
            </div>
          </div>
        </AdminAuthProvider>
      </body>
    </html>
  );
} 