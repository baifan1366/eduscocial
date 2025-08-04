'use client';

import { useTranslations } from 'next-intl';
import FacebookStylePostCard from './FacebookStylePostCard';
import { useEnhancedPosts } from '@/hooks/useCachedCounts';

export default function FacebookStylePostsList({ posts = [], isLoading, error }) {
  const t = useTranslations('NewPost');
  const { posts: enhancedPosts, isLoading: dataLoading } = useEnhancedPosts(posts);
  
  if (isLoading || dataLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
            {/* Header skeleton */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                </div>
              </div>
            </div>
            
            {/* Content skeleton */}
            <div className="p-4">
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
              </div>
            </div>
            
            {/* Stats skeleton */}
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
              <div className="flex space-x-4">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-14"></div>
              </div>
            </div>
            
            {/* Actions skeleton */}
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
              <div className="flex justify-between">
                <div className="flex space-x-4">
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                </div>
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <div className="text-red-600 dark:text-red-400 mb-2">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Failed to load posts</h3>
          <p className="text-sm">{error.message || 'Something went wrong while loading posts.'}</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const displayPosts = enhancedPosts.length > 0 ? enhancedPosts : posts;

  if (displayPosts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div className="text-gray-400 dark:text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No posts yet</h3>
          <p className="text-gray-500 dark:text-gray-400">Be the first to share something with the community!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Latest Posts</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {displayPosts.length} post{displayPosts.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      {displayPosts.map((post) => (
        <FacebookStylePostCard key={post.id} post={post} />
      ))}
      
      {/* Load More Button */}
      {displayPosts.length >= 10 && (
        <div className="text-center pt-6">
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            Load More Posts
          </button>
        </div>
      )}
    </div>
  );
}
