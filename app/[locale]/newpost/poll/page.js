import { getServerSession } from '@/lib/auth/serverAuth';
import { redirect } from 'next/navigation';
import NewPollPostClient from '@/components/post/NewPollPostClient';

export const metadata = {
  title: 'Create Poll - EduSocial',
  description: 'Create polls and surveys to engage with the community',
};

export default async function NewPollPostPage({ params }) {
  const session = await getServerSession();
  const locale = params.locale;

  // Protect this route - redirect to login if not authenticated
  if (!session) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/newpost/poll`);
  }

  return <NewPollPostClient />;
}