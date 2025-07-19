import BusinessAuthProvider from '../../../components/business/auth/BusinessAuthProvider';
import '../../../app/globals.css';

export const metadata = {
  title: 'Business Portal | EduSocial',
  description: 'Business portal for EduSocial',
};

export default function BusinessLayout({ children, params }) {
  const { locale } = params;

  // Only wrap the children with BusinessAuthProvider if not on the login or register pages
  const isAuthPage = children.props.childProp.segment === 'login' || children.props.childProp.segment === 'register';

  if (isAuthPage) {
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
        <BusinessAuthProvider>
          <div className="min-h-screen bg-[#0A1929] text-white">
            <div className="container mx-auto p-4">
              {children}
            </div>
          </div>
        </BusinessAuthProvider>
      </body>
    </html>
  );
} 