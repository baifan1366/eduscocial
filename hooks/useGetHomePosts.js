'use client';

import { useQuery } from '@tanstack/react-query';
import { recommendApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';
import { useEffect } from 'react';
import { trackUserAction } from '@/lib/userEmbedding';
import useAuth from '@/hooks/useAuth';

/**
 * Hook to fetch posts for home page and track impressions
 * @param {Object} options - React Query options
 * @returns {Object} Query results
 */
const useGetHomePosts = (options = {}) => {
  const { user } = useAuth();
  const params = { limit: 20, ...options.params };
  
  const query = useQuery({
    queryKey: queryKeys.recommendations.home(params),
    queryFn: () => recommendApi.getHomeRecommendations(params),
    ...options
  });
  
  // Track post impressions for user embedding updates when posts are loaded
  useEffect(() => {
    if (user?.id && query.data?.posts && Array.isArray(query.data.posts)) {
      const postImpressions = query.data.posts.map(post => post.id);
      
      // Only track up to first 10 posts (most visible ones)
      const topPosts = postImpressions.slice(0, 10);
      
      // Track each post impression
      topPosts.forEach(postId => {
        trackUserAction(user.id, 'view_post', postId, { 
          source: 'homepage',
          batch_impression: true
        });
      });
    }
  }, [query.data?.posts, user?.id]);
  
  return query;
};

export default useGetHomePosts; 