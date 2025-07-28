import { getServerSession } from '@/lib/auth/serverAuth';
import { redirect } from 'next/navigation';
import NewPostClient from '@/components/post/NewPostClient';

export const metadata = {
  title: 'Create New Post - EduSocial',
  description: 'Create and share your thoughts, images, videos, or polls with the community',
};

export default async function NewPostPage({ params }) {
  const session = await getServerSession();
  const { locale } = await params;

  // Protect this route - redirect to login if not authenticated
  if (!session) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/newpost`);
  }

  return <NewPostClient />;
}