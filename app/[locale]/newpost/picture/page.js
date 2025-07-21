import { getServerSession } from '@/lib/auth/serverAuth';
import { redirect } from 'next/navigation';
import NewPicturePostClient from '@/components/post/NewPicturePostClient';

export const metadata = {
  title: 'Create Picture Post - EduSocial',
  description: 'Share your images and photos with the community',
};

export default async function NewPicturePostPage({ params }) {
  const session = await getServerSession();
  const locale = params.locale;

  // Protect this route - redirect to login if not authenticated
  if (!session) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/newpost/picture`);
  }

  return <NewPicturePostClient />;
}