import { getServerSession } from '@/lib/auth/serverAuth';
import { redirect } from 'next/navigation';
import MigrateClient from '@/components/admin/MigrateClient';

export const metadata = {
  title: 'Database Migration - EduSocial',
  description: 'Run database migrations',
};

export default async function MigratePage({ params }) {
  const session = await getServerSession();
  const { locale } = await params;

  // Protect this route - redirect to login if not authenticated
  if (!session) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/admin/migrate`);
  }

  return <MigrateClient />;
}
