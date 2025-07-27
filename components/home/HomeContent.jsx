'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import useGetHomePosts from '@/hooks/useGetHomePosts';
import useAuth from '@/hooks/useAuth';
import useCheckNewUser from '@/hooks/useCheckNewUser';
import PostsList from './PostsList';
import Sidebar from './Sidebar';
import InterestSelectionDialog from '@/components/onboarding/InterestSelectionDialog';

export default function HomeContent() {
  const t = useTranslations('HomePage');
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data, isLoading: isPostsLoading, error } = useGetHomePosts();
  const isAuthenticated = !!user;
  
  // Extract posts array from the API response
  const posts = data?.posts || [];
  
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 页头部分 */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 text-white">{t('welcome')}</h1>
        <p className="text-gray-400">{t('connectWithCommunity')}</p>
      </div>
      
      {/* 内容部分 */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* 侧边栏 */}
        <Sidebar isAuthenticated={isAuthenticated} userId={user?.id} />
        
        {/* 主要内容 */}
        <div className="md:col-span-2">
          <PostsList 
            posts={posts} 
            isLoading={isPostsLoading} 
            error={error}
          />
        </div>
      </div>
      
      {/* Interest selection dialog for new users */}
      <InterestSelectionDialog 
        isOpen={showInterestDialog}
        onClose={() => setShowInterestDialog(false)}
      />
    </div>
  );
} 