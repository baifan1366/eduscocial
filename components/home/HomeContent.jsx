'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import useGetHomePosts from '@/hooks/useGetHomePosts';
import useAuth from '@/hooks/useAuth';
import PostsList from './PostsList';
import Sidebar from './Sidebar';

export default function HomeContent() {
  const t = useTranslations('HomePage');
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: posts, isLoading: isPostsLoading, error } = useGetHomePosts();
  const isAuthenticated = !!user;
  
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
        <Sidebar isAuthenticated={isAuthenticated} />
        
        {/* 主要内容 */}
        <div className="md:col-span-2">
          <PostsList 
            posts={posts} 
            isLoading={isPostsLoading} 
            error={error}
          />
        </div>
      </div>
    </div>
  );
} 