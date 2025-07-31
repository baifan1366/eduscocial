import { getTranslations } from 'next-intl/server';
import TestReactionsClient from '@/components/test/TestReactionsClient';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Reactions' });

  return {
    title: 'Test Reactions - EduSocial',
    description: 'Test the reactions functionality',
  };
}

export default async function TestReactionsPage() {
  return <TestReactionsClient />;
}
