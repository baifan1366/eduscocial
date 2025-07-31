import { getServerSession } from '@/lib/auth/serverAuth';
import { redirect } from 'next/navigation';
import MyDraftsClient from '@/components/my/MyDraftsClient';

export const metadata = {
  title: 'My Drafts - EduSocial',
  description: 'View and continue editing your draft posts',
};

export default async function MyDraftsPage({ params }) {
  const session = await getServerSession();
  const locale = params.locale;

  // Protect this route - redirect to login if not authenticated
  if (!session) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/my/drafts`);
  }

  return <MyDraftsClient />;
} 