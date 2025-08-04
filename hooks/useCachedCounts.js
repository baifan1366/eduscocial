'use client';

import { useState, useEffect } from 'react';
import { getHotCommentsBatch, getCachedCountsBatch } from '@/lib/utils/requestDeduplication';

/**
 * Hook to fetch and manage cached counts for posts
 * @param {Array} posts - Array of post objects
 * @returns {Object} - Object containing posts with cached counts and loading state
 */
export const useCachedCounts = (posts = []) => {
  const [postsWithCounts, setPostsWithCounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCachedCounts = async () => {
      if (!posts || posts.length === 0) {
        setPostsWithCounts([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get post IDs
        const postIds = posts.map(post => post.id).filter(Boolean);
        
        if (postIds.length === 0) {
          setPostsWithCounts(posts);
          return;
        }

        // Use deduplicated request for cached counts
        console.log(`[useCachedCounts] Fetching cached counts for ${postIds.length} posts`);
        const data = await getCachedCountsBatch(postIds);
        const { results } = data;

        // Merge cached counts with original posts
        const updatedPosts = posts.map(post => {
          const cachedData = results[post.id];
          
          return {
            ...post,
            // Use cached counts if available, otherwise fall back to original values
            comment_count: cachedData?.commentCount !== null && cachedData?.commentCount !== undefined
              ? cachedData.commentCount
              : (post.commentsCount || post.comments_count || post.comment_count || 0),
            like_count: cachedData?.likeCount !== null && cachedData?.likeCount !== undefined
              ? cachedData.likeCount
              : (post.likesCount || post.likes_count || post.like_count || 0),
            view_count: cachedData?.viewCount !== null && cachedData?.viewCount !== undefined
              ? cachedData.viewCount
              : (post.viewsCount || post.views_count || post.view_count || 0),
            // Add metadata about cache status
            _cached: {
              hasCommentCount: cachedData?.commentCount !== null && cachedData?.commentCount !== undefined,
              hasLikeCount: cachedData?.likeCount !== null && cachedData?.likeCount !== undefined,
              hasViewCount: cachedData?.viewCount !== null && cachedData?.viewCount !== undefined,
              hasCachedData: cachedData?.hasCachedData || false
            }
          };
        });

        setPostsWithCounts(updatedPosts);
      } catch (err) {
        console.error('Error fetching cached counts:', err);
        setError(err.message);
        
        // Fallback to original posts with normalized counts
        const fallbackPosts = posts.map(post => ({
          ...post,
          comment_count: post.commentsCount || post.comments_count || post.comment_count || 0,
          like_count: post.likesCount || post.likes_count || post.like_count || 0,
          view_count: post.viewsCount || post.views_count || post.view_count || 0,
          _cached: {
            hasCommentCount: false,
            hasLikeCount: false,
            hasViewCount: false,
            hasCachedData: false
          }
        }));
        setPostsWithCounts(fallbackPosts);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCachedCounts();
  }, [posts]);

  return {
    posts: postsWithCounts,
    isLoading,
    error,
    refresh: () => {
      // Trigger a re-fetch by updating the dependency
      setPostsWithCounts([]);
    }
  };
};

/**
 * Hook to fetch hot comments for posts using batch API
 * @param {Array} postIds - Array of post IDs
 * @returns {Object} - Object containing hot comments by post ID and loading state
 */
export const useHotComments = (postIds = []) => {
  const [hotComments, setHotComments] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHotComments = async () => {
      if (!postIds || postIds.length === 0) {
        setHotComments({});
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Use deduplicated batch API for better performance
        console.log(`[useHotComments] Fetching hot comments for ${postIds.length} posts`);
        const data = await getHotCommentsBatch(postIds);

        if (data.success) {
          // Convert results to the expected format
          const commentsMap = {};
          Object.entries(data.results).forEach(([postId, result]) => {
            if (result.comments && result.comments.length > 0) {
              commentsMap[postId] = result.comments;
            }
          });

          setHotComments(commentsMap);
          console.log(`[useHotComments] Loaded hot comments for ${Object.keys(commentsMap).length} posts (${data.cachedPosts} cached, ${data.fetchedPosts} fetched)`);
        } else {
          throw new Error(data.error || 'Failed to fetch hot comments');
        }
      } catch (err) {
        console.error('Error fetching hot comments:', err);
        setError(err.message);
        setHotComments({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotComments();
  }, [postIds.join(',')]); // Use join to create a stable dependency

  return {
    hotComments,
    isLoading,
    error,
    refresh: () => {
      setHotComments({});
    }
  };
};

/**
 * Combined hook that fetches both cached counts and hot comments
 * @param {Array} posts - Array of post objects
 * @returns {Object} - Object containing enhanced posts with counts and hot comments
 */
export const useEnhancedPosts = (posts = []) => {
  const { posts: postsWithCounts, isLoading: countsLoading, error: countsError } = useCachedCounts(posts);
  const postIds = posts.map(post => post.id).filter(Boolean);
  const { hotComments, isLoading: commentsLoading, error: commentsError } = useHotComments(postIds);

  const enhancedPosts = postsWithCounts.map(post => ({
    ...post,
    hotComments: hotComments[post.id] || []
  }));

  return {
    posts: enhancedPosts,
    hotComments,
    isLoading: countsLoading || commentsLoading,
    error: countsError || commentsError,
    refresh: () => {
      // This would trigger both hooks to refresh
      // Implementation depends on how you want to handle refresh
    }
  };
};

export default useCachedCounts;
