import { getServerSession } from '@/lib/auth/serverAuth';
import { getTranslations } from 'next-intl/server';
import PostDetailClient from '@/components/post/PostDetailClient';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'PostDetail' });

  return {
    title: t('pageTitle') || 'Post Details - EduSocial',
    description: t('pageDescription') || 'View post details and comments',
  };
}

export default async function PostDetailPage({ params }) {
  const session = await getServerSession();
  const { locale, 'post-slug': postSlug } = await params;

  return (
    <PostDetailClient
      postId={postSlug}
      locale={locale}
      isAuthenticated={!!session}
    />
  );
}
