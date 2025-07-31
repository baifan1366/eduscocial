'use client';

import { useState, useEffect } from 'react';

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

        // Fetch cached counts from API
        const response = await fetch('/api/posts/cached-counts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ postIds })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { results } = await response.json();

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
            // Add metadata about cache status
            _cached: {
              hasCommentCount: cachedData?.commentCount !== null && cachedData?.commentCount !== undefined,
              hasLikeCount: cachedData?.likeCount !== null && cachedData?.likeCount !== undefined,
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
          _cached: {
            hasCommentCount: false,
            hasLikeCount: false,
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
 * Hook to fetch hot comments for posts
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
        // Fetch hot comments for each post
        const promises = postIds.map(async (postId) => {
          try {
            const response = await fetch(`/api/posts/${postId}/hot-comments`);
            if (response.ok) {
              const data = await response.json();
              return { postId, comments: data.comments || [] };
            } else {
              console.warn(`Failed to fetch hot comments for post ${postId}`);
              return { postId, comments: [] };
            }
          } catch (error) {
            console.error(`Error fetching hot comments for post ${postId}:`, error);
            return { postId, comments: [] };
          }
        });

        const results = await Promise.all(promises);
        
        // Convert to object with postId as key
        const commentsMap = {};
        results.forEach(({ postId, comments }) => {
          if (comments.length > 0) {
            commentsMap[postId] = comments;
          }
        });

        setHotComments(commentsMap);
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
