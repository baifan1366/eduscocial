import { getServerSession } from '@/lib/auth/serverAuth';
import { getTranslations } from 'next-intl/server';
import { supabase } from '@/lib/supabase';
import { isValidSlug } from '@/lib/utils/slugUtils';
import BoardDetailClient from '@/components/board/BoardDetailClient';

/**
 * Generate metadata for board details page
 */
export async function generateMetadata({ params }) {
  try {
    const { locale, 'board-slug': boardSlug } = await params;
    const t = await getTranslations({ locale, namespace: 'BoardDetail' });

    // Try to fetch board data for better metadata
    if (boardSlug) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(boardSlug);
      const isSlug = isValidSlug(boardSlug);

      if (isUUID || isSlug) {
        let query = supabase
          .from('boards')
          .select('name, description, slug')
          .eq('is_active', true)
          .eq('status', 'approved');

        if (isUUID) {
          query = query.eq('id', boardSlug);
        } else {
          query = query.eq('slug', boardSlug);
        }

        const { data: board } = await query.single();

        if (board) {
          return {
            title: `${board.name} - EduSocial`,
            description: board.description || `Explore discussions and posts in ${board.name} board`,
            openGraph: {
              title: `${board.name} - EduSocial`,
              description: board.description || `Explore discussions and posts in ${board.name} board`,
              images: ['/metadata.png'],
              url: `/boards/${board.slug}`,
            },
            alternates: {
              canonical: `/boards/${board.slug}`,
            },
          };
        }
      }
    }

    // Fallback metadata
    return {
      title: t('pageTitle') || 'Board Details - EduSocial',
      description: t('pageDescription') || 'Explore board discussions and posts',
      openGraph: {
        title: t('pageTitle') || 'Board Details - EduSocial',
        description: t('pageDescription') || 'Explore board discussions and posts',
        images: ['/metadata.png'],
      },
    };
  } catch (error) {
    console.error('Error generating board metadata:', error);
    
    // Fallback metadata on error
    return {
      title: 'Board Details - EduSocial',
      description: 'Explore board discussions and posts',
    };
  }
}

/**
 * Board details page component
 */
export default async function BoardDetailPage({ params }) {
  const session = await getServerSession();
  const { locale, 'board-slug': boardSlug } = await params;

  return (
    <BoardDetailClient
      boardSlug={boardSlug}
      locale={locale}
      isAuthenticated={!!session}
      user={session?.user}
    />
  );
}

/**
 * Generate static params for popular boards (optional optimization)
 * This can be implemented later for better performance
 */
export async function generateStaticParams() {
  try {
    // Fetch popular/active boards for static generation
    const { data: boards } = await supabase
      .from('boards')
      .select('slug')
      .eq('is_active', true)
      .eq('status', 'approved')
      .limit(50); // Limit to most popular boards

    if (!boards) return [];

    return boards.map((board) => ({
      'board-slug': board.slug,
    }));
  } catch (error) {
    console.error('Error generating static params for boards:', error);
    return [];
  }
}
