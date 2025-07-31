'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import useGetHomePosts from '@/hooks/useGetHomePosts';
import useGetBoards from '@/hooks/user/board/useGetBoards';
import useAuth from '@/hooks/useAuth';
import useCheckNewUser from '@/hooks/useCheckNewUser';
import FacebookStylePostsList from './FacebookStylePostsList';
import BoardsList from './BoardsList';
import Sidebar from './Sidebar';
import UserAvatar from '@/components/ui/UserAvatar';
import InterestSelectionDialog from '@/components/onboarding/InterestSelectionDialog';

export default function HomeContent() {
  const t = useTranslations('HomePage');
  const locale = useLocale();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data, isLoading: isPostsLoading, error } = useGetHomePosts();
  const { data: boardsData, isLoading: isBoardsLoading, error: boardsError } = useGetBoards({
    limit: 12,
    orderBy: 'created_at',
    orderDirection: 'desc',
    filters: { status: 'approved', is_active: true }
  });
  const isAuthenticated = !!user;

  // Extract posts array from the API response
  const posts = data?.posts || [];
  const boards = boardsData?.boards || [];
  
  // Check if user is new for onboarding
  const { data: newUserData } = useCheckNewUser({
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
  });
  
  const [showInterestDialog, setShowInterestDialog] = useState(false);
  
  // Show interest selection dialog for new users
  useEffect(() => {
    if (newUserData?.isNewUser && user?.id) {
      setShowInterestDialog(true);
    }
  }, [newUserData?.isNewUser, user?.id]);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Facebook-style layout */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Sidebar isAuthenticated={isAuthenticated} userId={user?.id} />
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post Card */}
            {user && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center space-x-3">
                  <UserAvatar user={user} size="md" />
                  <div className="flex-1">
                    <Link
                      href="/create-post"
                      className="block w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
                    >
                      What's on your mind, {user.username || user.name}?
                    </Link>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href="/create-post?type=video"
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM5 8a1 1 0 011-1h1a1 1 0 010 2H6a1 1 0 01-1-1zm6 1a1 1 0 100 2h3a1 1 0 100-2H11z" />
                      </svg>
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Live video</span>
                  </Link>
                  <Link
                    href="/create-post?type=picture"
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Photo/video</span>
                  </Link>
                  <Link
                    href="/create-post?type=poll"
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Poll</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Posts Feed */}
            <FacebookStylePostsList
              posts={posts}
              isLoading={isPostsLoading}
              error={error}
            />
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Trending Boards */}
            <BoardsList
              boards={boards}
              isLoading={isBoardsLoading}
              error={boardsError}
              locale={locale}
            />
          </div>
        </div>

        {/* Interest selection dialog for new users */}
        <InterestSelectionDialog
          isOpen={showInterestDialog}
          onClose={() => setShowInterestDialog(false)}
        />
      </div>
    </div>
  );
} 