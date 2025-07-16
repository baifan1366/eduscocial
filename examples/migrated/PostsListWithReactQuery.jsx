'use client';

import PostCard from '@/components/post/PostCard';
import useGetPosts from '@/hooks/useGetPosts';
import { useSearchParams } from 'next/navigation';

export default function PostsListWithReactQuery() {
  // Get URL search params for filtering
  const searchParams = useSearchParams();
  const filter = {
    tag: searchParams.get('tag'),
    topic: searchParams.get('topic'),
    boardId: searchParams.get('boardId')
  };
  
  // Clean up filter object to remove undefined/null values
  const cleanFilter = Object.entries(filter)
    .filter(([_, value]) => value)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  
  // Use the custom hook for fetching posts with the filter
  const { 
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useGetPosts(cleanFilter);
  
  // Show loading spinner when initially loading
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }
  
  // Handle error states
  if (isError) {
    return (
      <div className="text-center py-8 bg-slate-50 rounded-lg shadow-sm p-6">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-12 w-12 mx-auto text-red-500 mb-3" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
        <p className="text-gray-700 font-medium">Error loading posts</p>
        <p className="text-gray-500 text-sm mt-1">{error?.message || "Something went wrong"}</p>
        <button 
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  // Show empty state when no posts found
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 rounded-lg shadow-sm p-6">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-12 w-12 mx-auto text-gray-400 mb-3" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" 
          />
        </svg>
        <p className="text-gray-500 font-medium">No posts found</p>
        <p className="text-gray-400 text-sm mt-1">Check back later for more content</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 rounded-t-lg px-4 py-3 flex items-center justify-between shadow-sm">
        <h2 className="text-white font-medium">For You</h2>
        <div className="flex space-x-2">
          {/* Show a subtle loading indicator for background refetches */}
          {isFetching && !isLoading && (
            <div className="text-slate-300">
              <div className="animate-spin h-4 w-4 border border-slate-300 rounded-full border-t-transparent"></div>
            </div>
          )}
          <button className="text-slate-300 hover:text-white p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          <button className="text-slate-300 hover:text-white p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </div>
      <div>
        {data.map(post => (
          <div key={post.id} className="mb-3 last:mb-0">
            <PostCard post={post} />
          </div>
        ))}
      </div>
    </div>
  );
} 