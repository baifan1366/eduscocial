import { getServerSession } from '@/lib/auth/serverAuth';
import { redirect } from 'next/navigation';
import NewVideoPostClient from '@/components/post/NewVideoPostClient';

export const metadata = {
  title: 'Create Video Post - EduSocial',
  description: 'Share your videos and multimedia content with the community',
};

export default async function NewVideoPostPage({ params }) {
  const session = await getServerSession();
  const locale = params.locale;

  // Protect this route - redirect to login if not authenticated
  if (!session) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/newpost/video`);
  }

  return <NewVideoPostClient />;
}