import { getServerSession } from '@/lib/auth/serverAuth';
import { getTranslations } from 'next-intl/server';
import TestLikeClient from '@/components/test/TestLikeClient';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Test' });

  return {
    title: 'Test Like Functionality - EduSocial',
    description: 'Test the like functionality with Redis caching and QStash processing',
  };
}

export default async function TestLikePage({ params }) {
  const session = await getServerSession();
  const { locale } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Test Like Functionality</h1>
      <TestLikeClient 
        locale={locale}
        isAuthenticated={!!session}
        user={session?.user}
      />
    </div>
  );
}
