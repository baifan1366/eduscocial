import { getServerSession } from '@/lib/auth/serverAuth';
import { getTranslations } from 'next-intl/server';
import BoardsListingClient from '@/components/board/BoardsListingClient';

/**
 * Generate metadata for boards listing page
 */
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'BoardsListing' });

  return {
    title: t('pageTitle') || 'All Boards - EduSocial',
    description: t('pageDescription') || 'Explore all discussion boards and communities',
    openGraph: {
      title: t('pageTitle') || 'All Boards - EduSocial',
      description: t('pageDescription') || 'Explore all discussion boards and communities',
      images: ['/metadata.png'],
    },
  };
}

/**
 * Boards listing page component
 */
export default async function BoardsListingPage({ params }) {
  const session = await getServerSession();
  const { locale } = await params;

  return (
    <BoardsListingClient
      locale={locale}
      isAuthenticated={!!session}
      user={session?.user}
    />
  );
}
