import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api';

/**
 * Hook for fetching ranked post recommendations
 * 
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of posts to fetch per page
 * @param {number} options.page - Page number to fetch
 * @param {boolean} options.enabled - Whether the query should run automatically
 * @param {string[]} options.excludePostIds - Post IDs to exclude
 * @param {Object} options.rankingParams - Custom ranking parameters
 * @returns {Object} - Query result with posts data and pagination info
 */
export default function useRankedRecommendations(options = {}) {
  const {
    limit = 10,
    page = 1,
    enabled = true,
    excludePostIds = [],
    rankingParams = null,
  } = options;
  
  // Track seen posts to prevent duplicates across pagination
  const [seenPosts, setSeenPosts] = useState(new Set(excludePostIds));
  
  // Build query parameters
  const buildQueryParams = () => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      page: page.toString(),
    });
    
    // Add any excluded posts
    if (seenPosts.size > 0) {
      params.append('exclude', Array.from(seenPosts).join(','));
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
    
    return params.toString();
  };
  
  // Fetch recommendations
  const query = useQuery({
    queryKey: ['rankedRecommendations', page, limit, Array.from(seenPosts), rankingParams],
    queryFn: async () => {
      const queryParams = buildQueryParams();
      const response = await fetchWithAuth(`/api/recommend/ranked?${queryParams}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch recommendations');
      }
      
      return response.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    keepPreviousData: true,   // Keep old data while fetching new data
  });
  
  // Update seen posts when new data comes in
  useEffect(() => {
    if (query.data?.posts && query.data.posts.length > 0) {
      setSeenPosts(prevSeen => {
        const newSeen = new Set(prevSeen);
        query.data.posts.forEach(post => {
          newSeen.add(post.id);
        });
        return newSeen;
      });
    }
  }, [query.data]);
  
  // Helper to fetch the next page
  const fetchNextPage = () => {
    if (query.data?.hasMore) {
      // The query will automatically refetch with the new page
      return true;
    }
    return false;
  };
  
  // Helper to refresh recommendations
  const refresh = async () => {
    await query.refetch();
  };
  
  return {
    ...query,
    posts: query.data?.posts || [],
    hasMore: query.data?.hasMore || false,
    rankingParams: query.data?.rankingParams,
    fetchNextPage,
    refresh,
    seenPosts: Array.from(seenPosts)
  };
} 