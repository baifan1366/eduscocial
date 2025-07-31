import React, { useState } from 'react';
import useRecommendationFeed from '@/hooks/useRecommendationFeed';
import PostCard from '@/components/post/PostCard';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

/**
 * RecommendedFeed component displays personalized content recommendations
 * using the recommendation system's feed API
 */
export default function RecommendedFeed({ boardId = null }) {
  // Ranking configuration state
  const [rankingConfig, setRankingConfig] = useState({
    similarityWeight: 0.5,
    recencyWeight: 0.3,
    engagementWeight: 0.2,
    applyDiversity: true
  });
  
  // Posts per page
  const [postsPerPage, setPostsPerPage] = useState(10);
  
  // Feed query
  const {
    posts,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refresh,
    markPostsAsSeen
  } = useRecommendationFeed({
    limit: postsPerPage,
    board: boardId,
    rankingParams: rankingConfig
  });
  
  // Handle post view
  const handlePostView = (postId) => {
    // Mark post as viewed in our tracking
    markPostsAsSeen([postId]);
    
    // Additional logic could be added here, e.g., analytics
  };
  
  // Handle ranking parameter change
  const handleRankingChange = (param, value) => {
    setRankingConfig(prev => {
      const newConfig = { ...prev, [param]: value };
      
      // Ensure weights sum to 1.0
      if (param.endsWith('Weight')) {
        const sum = newConfig.similarityWeight + newConfig.recencyWeight + newConfig.engagementWeight;
        if (Math.abs(sum - 1.0) > 0.01) {
          // Adjust other weights proportionally
          const otherParams = ['similarityWeight', 'recencyWeight', 'engagementWeight'].filter(p => p !== param);
          const remainder = 1.0 - value;
          const oldSum = otherParams.reduce((acc, p) => acc + prev[p], 0);
          
          if (oldSum > 0) {
            otherParams.forEach(p => {
              newConfig[p] = remainder * (prev[p] / oldSum);
            });
          } else {
            // Equal distribution if old sum was 0
            otherParams.forEach(p => {
              newConfig[p] = remainder / otherParams.length;
            });
          }
        }
      }
      
      return newConfig;
    });
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Loading recommendations...</span>
      </div>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Error loading recommendations</h3>
        <p className="text-red-600">{error?.message || 'Something went wrong'}</p>
        <Button onClick={refresh} variant="outline" className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }
  
  // Empty state
  if (posts.length === 0) {
    return (
      <div className="p-8 text-center border rounded-md">
        <h3 className="text-lg font-medium mb-2">No recommendations found</h3>
        <p className="text-gray-500 mb-4">
          We don't have any recommendations for you right now. Try again later or explore some trending content.
        </p>
        <Button onClick={refresh}>Refresh</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Optional: Recommendation Controls */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-md">
        <div>
          <label className="block text-sm font-medium mb-1">Similarity Weight</label>
          <input 
            type="range" 
            min="0.1" 
            max="0.8" 
            step="0.1" 
            value={rankingConfig.similarityWeight}
            onChange={e => handleRankingChange('similarityWeight', parseFloat(e.target.value))}
            className="w-32"
          />
          <span className="ml-2 text-sm">{rankingConfig.similarityWeight.toFixed(1)}</span>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Recency Weight</label>
          <input 
            type="range" 
            min="0.1" 
            max="0.8" 
            step="0.1"
            value={rankingConfig.recencyWeight}
            onChange={e => handleRankingChange('recencyWeight', parseFloat(e.target.value))}
            className="w-32"
          />
          <span className="ml-2 text-sm">{rankingConfig.recencyWeight.toFixed(1)}</span>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Engagement Weight</label>
          <input 
            type="range" 
            min="0.1" 
            max="0.8" 
            step="0.1"
            value={rankingConfig.engagementWeight}
            onChange={e => handleRankingChange('engagementWeight', parseFloat(e.target.value))}
            className="w-32"
          />
          <span className="ml-2 text-sm">{rankingConfig.engagementWeight.toFixed(1)}</span>
        </div>
        
        <div className="ml-auto flex items-end">
          <Button onClick={refresh} variant="outline" size="sm">
            Refresh Feed
          </Button>
        </div>
      </div>
      
      {/* Post List */}
      <div className="space-y-4">
        {posts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            onView={() => handlePostView(post.id)}
          />
        ))}
      </div>
      
      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center py-4">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            variant="outline"
            size="lg"
          >
            {isFetchingNextPage ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Loading more...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
} 