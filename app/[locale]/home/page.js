import { getTranslations } from 'next-intl/server';
import HomeContent from '@/components/home/HomeContent';

export async function generateMetadata({ params }) {
  const locale = await params.locale;
  const t = await getTranslations({ locale, namespace: 'HomePage' });

  return {
    title: t('pageTitle') || 'EduSocial - Home',
    description: t('pageDescription') || 'Connect with your educational community',
    openGraph: {
      title: t('pageTitle') || 'EduSocial - Home',
      description: t('pageDescription') || 'Connect with your educational community',
      images: ['/metadata.png'],
    },
  };
}

export default async function HomePage() {
  return <HomeContent />;
}
