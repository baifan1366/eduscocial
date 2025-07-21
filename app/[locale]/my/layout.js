import { getServerSession } from '@/lib/auth/serverAuth';
import { redirect } from 'next/navigation';
import MyLayoutClient from '@/components/my/MyLayoutClient';
import MySidebar from '@/components/my/MySidebar';
import MyWrapper from '@/components/my/MyWrapper';

export default async function MyLayout({ children, params }) {
  const session = await getServerSession();
  const locale = params.locale;

  // Protect this route - redirect to login if not authenticated
  if (!session) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/my`);
  }

  return (
    <MyLayoutClient>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Sidebar with user navigation */}
          <div className="md:col-span-1">
            <MySidebar />
          </div>

          {/* Main content area */}
          <div className="md:col-span-2">
            <MyWrapper>
              {children}
            </MyWrapper>
          </div>
        </div>
      </div>
    </MyLayoutClient>
  );
} 