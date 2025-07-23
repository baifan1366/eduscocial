import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api';

/**
 * Hook for fetching and paginating the recommendation feed
 * 
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of posts per page
 * @param {boolean} options.enabled - Whether the query is enabled
 * @param {string} options.board - Optional board ID to filter by
 * @param {Object} options.rankingParams - Optional custom ranking parameters
 * @returns {Object} Query result with posts and pagination controls
 */
export default function useRecommendationFeed(options = {}) {
  const {
    limit = 10,
    enabled = true,
    board = null,
    rankingParams = null
  } = options;
  
  // Keep track of seen post IDs to exclude from future requests
  const [seenPostIds, setSeenPostIds] = useState([]);
  
  // Build query function with parameters
  const queryFn = async ({ pageParam = 1 }) => {
    const params = new URLSearchParams({
      page: pageParam.toString(),
      limit: limit.toString(),
    });
    
    // Add board filter if specified
    if (board) {
      params.append('board', board);
    }
    
    // Add excluded posts
    if (seenPostIds.length > 0) {
      params.append('exclude', seenPostIds.join(','));
    }
    
    // Add custom ranking parameters if provided
    if (rankingParams) {
      if (rankingParams.similarityWeight) {
        params.append('similarity_weight', rankingParams.similarityWeight.toString());
      }
      if (rankingParams.recencyWeight) {
        params.append('recency_weight', rankingParams.recencyWeight.toString());
      }
      if (rankingParams.engagementWeight) {
        params.append('engagement_weight', rankingParams.engagementWeight.toString());
      }
      if (rankingParams.applyDiversity === false) {
        params.append('diversity', 'false');
      }
    }
    
    const response = await fetchWithAuth(`/api/recommend/feed?${params.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch recommendations');
    }
    
    const data = await response.json();
    
    // Update seen posts
    if (data.posts && data.posts.length > 0) {
      const newPostIds = data.posts.map(post => post.id);
      setSeenPostIds(prev => [...new Set([...prev, ...newPostIds])]);
    }
    
    return {
      ...data,
      nextPage: data.hasMore ? pageParam + 1 : undefined
    };
  };
  
  // Use infinite query for pagination
  const query = useInfiniteQuery({
    queryKey: ['recommendationFeed', board, limit, JSON.stringify(rankingParams)],
    queryFn,
    enabled,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Flatten posts from all pages
  const posts = query.data?.pages.flatMap(page => page.posts) || [];
  
  // Check if we're on the last page
  const hasNextPage = query.hasNextPage || false;
  
  // Method to manually mark posts as seen (e.g., after viewing)
  const markPostsAsSeen = (postIds) => {
    if (!Array.isArray(postIds) || postIds.length === 0) return;
    
    setSeenPostIds(prev => [...new Set([...prev, ...postIds])]);
  };
  
  // Helper for manual refresh
  const refresh = async () => {
    await query.refetch();
  };
  
  return {
    ...query,
    posts,
    hasNextPage,
    markPostsAsSeen,
    refresh,
    seenPostIds
  };
} 