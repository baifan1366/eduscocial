'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { trackUserAction } from '@/lib/userEmbedding';
import useAuth from '@/hooks/useAuth';
import { useTranslations } from 'next-intl';
import { usePostLike } from '@/hooks/usePostLike';
import Reactions from '@/components/reactions/Reactions';

export default function PostCard({ post, onView }) {
  const { user } = useAuth();
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const t = useTranslations('NewPost');
  const postLikeMutation = usePostLike();

  // 格式化日期，如"2小时前"，"3天前"等
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = seconds / 31536000; // 年
    if (interval > 1) return Math.floor(interval) + " 年前";
    
    interval = seconds / 2592000; // 月
    if (interval > 1) return Math.floor(interval) + " 月前";
    
    interval = seconds / 86400; // 日
    if (interval > 1) return Math.floor(interval) + " 天前";
    
    interval = seconds / 3600; // 小时
    if (interval > 1) return Math.floor(interval) + " 小时前";
    
    interval = seconds / 60; // 分钟
    if (interval > 1) return Math.floor(interval) + " 分钟前";
    
    return Math.floor(seconds) + " 秒前";
  };
  
  // Track post view when visible in viewport
  const handlePostView = () => {
    // Only track view once per component instance
    if (hasTrackedView) return;
    
    setHasTrackedView(true);
    
    // Call parent onView handler if provided
    if (onView && typeof onView === 'function') {
      onView(post.id);
    }
    
    // Track view action for embedding updates if user is logged in
    if (user?.id) {
      trackUserAction(user.id, 'view_post', post.id, {
        source: 'post_card',
        title: post.title?.substring(0, 50)
      });
    }
  };
  
  // Handle post like
  const handleLike = async (e) => {
    e.preventDefault(); // Prevent navigation

    if (!user?.id) {
      // Redirect to login if not authenticated
      return;
    }

    try {
      await postLikeMutation.mutateAsync({
        postId: post.id,
        isLiked: false // Always like from post card (no unlike functionality here)
      });

      // Track like action for embedding updates
      trackUserAction(user.id, 'like_post', post.id, {
        source: 'post_card',
        title: post.title?.substring(0, 50)
      });
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow bg-white border-0 shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 flex items-center">
        <div className="h-6 w-6 rounded-full overflow-hidden bg-slate-200 mr-2">
          <img
            src={post.is_anonymous ? '/images/default-avatar.png' : (post.users?.avatar_url || '/images/default-avatar.png')}
            alt={post.is_anonymous ? t('anonymousPost') : (post.users?.username || 'User')}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">
            {post.is_anonymous ? t('anonymousPost') : (post.users?.username || post.users?.name || t('anonymousPost'))}
          </p>
        </div>
        <div className="flex items-center text-xs text-slate-500">
          <span className="mr-2">{post.boards?.name || 'General'}</span>
          <span>•</span>
          <span className="ml-2">{formatTimeAgo(post.created_at)}</span>
        </div>
      </div>

      <div className="p-4" onClick={handlePostView}>
        <Link href={`/post/${post.id}`} className="block">
          <h3 className="font-bold text-lg mb-2 text-slate-900 hover:text-orange-500 transition-colors line-clamp-2">
            {post.title}
          </h3>
        </Link>
        
        <p className="text-slate-700 line-clamp-3 mb-3 text-sm">
          {post.content?.slice(0, 200)}
          {post.content?.length > 200 ? '...' : ''}
        </p>
      </div>
      
      <div className="flex justify-between items-center text-xs text-slate-500 px-4 py-3 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{post.view_count || 0}</span>
          </div>

          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span>{post.comment_count || 0}</span>
          </div>
        </div>

        {/* Reactions */}
        <Reactions
          type="post"
          targetId={post.id}
          initialReactionCounts={post.reaction_counts || {}}
          initialUserReactions={[]}
          className="scale-90"
        />
      </div>
    </Card>
  );
} 