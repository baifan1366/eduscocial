import AdminAuthForm from '../../../../components/admin/login/AdminAuthForm';
import { Suspense } from 'react';

export const metadata = {
  title: 'Login | Admin',
  description: 'Login to EduSocial',
  openGraph: {
    title: 'Login to EduSocial',
    images: ['/slogan-removebg-preview.png'],
  },
};

// Loader component to show while the authentication context initializes
function LoginFormLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full max-w-md p-8 bg-[#132F4C] rounded-lg shadow-lg">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-[#1E3A5F] rounded mb-6"></div>
            <div className="h-4 bg-[#1E3A5F] rounded mb-4 w-3/4 mx-auto"></div>
            <div className="h-10 bg-[#1E3A5F] rounded mb-4"></div>
            <div className="h-10 bg-[#1E3A5F] rounded mb-4"></div>
            <div className="h-12 bg-[#FF7D00] rounded mb-6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main>
      <div className="max-w-md mx-auto py-0 min-w-[80%]">
        <Suspense fallback={<LoginFormLoader />}>
          <AdminAuthForm />
        </Suspense>
      </div>
    </main>
  );
}
