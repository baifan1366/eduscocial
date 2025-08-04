'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { usePostLike, usePostLikeStatus } from '@/hooks/usePostLike';
import { toast } from 'sonner';

export default function TestLikeClient({ locale, isAuthenticated, user: initialUser }) {
  const { user } = useAuth();
  const [testPostId] = useState('test-post-123');
  const [likeCount, setLikeCount] = useState(0);

  const { mutateAsync: toggleLike, isPending: isLiking } = usePostLike();

  // Get like status using React Query
  const { data: likeStatus, isLoading: isLoadingLikeStatus, refetch } = usePostLikeStatus(
    user?.id ? testPostId : null
  );

  const isLiked = likeStatus?.isLiked || false;

  // Update like count from server if available
  useEffect(() => {
    if (likeStatus?.likeCount !== undefined) {
      setLikeCount(likeStatus.likeCount);
    }
  }, [likeStatus?.likeCount]);

  // Handle like
  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }

    console.log(`[TestLike] Current state - isLiked: ${isLiked}, likeCount: ${likeCount}`);

    // Optimistic update for like count only
    const newLikeCount = isLiked ? likeCount - 1 : likeCount + 1;
    setLikeCount(newLikeCount);

    try {
      const result = await toggleLike({
        postId: testPostId,
        isLiked: isLiked
      });

      console.log(`[TestLike] API result:`, result);

      // Show feedback to user
      if (isLiked) {
        toast.success('Removed like');
      } else {
        toast.success('Liked post');
      }

      // Refetch the like status to get updated data
      setTimeout(() => {
        refetch();
      }, 1000);

    } catch (error) {
      // Revert optimistic update on error
      setLikeCount(likeCount);
      console.error('[TestLike] Error:', error);
      toast.error('Failed to update like');
    }
  };

  // Check Redis cache
  const checkRedisCache = async () => {
    try {
      const response = await fetch('/api/test/redis-cache');
      const data = await response.json();
      console.log('Redis cache data:', data);
      toast.info(`Redis cache checked. See console for details.`);
    } catch (error) {
      console.error('Error checking Redis cache:', error);
      toast.error('Failed to check Redis cache');
    }
  };

  // Process pending operations manually
  const processOperations = async () => {
    try {
      const response = await fetch('/api/actions/process-likes', {
        method: 'GET' // Use GET for manual processing in development
      });
      const data = await response.json();
      console.log('Process operations result:', data);
      toast.success(`Processed ${data.processed || 0} operations`);
      
      // Refetch like status after processing
      setTimeout(() => {
        refetch();
      }, 1000);
    } catch (error) {
      console.error('Error processing operations:', error);
      toast.error('Failed to process operations');
    }
  };

  return (
    <div className="space-y-6">
      {/* User Info */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">User Status</h2>
        <div className="space-y-2">
          <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
          <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
          <p><strong>Username:</strong> {user?.username || 'N/A'}</p>
        </div>
      </Card>

      {/* Test Post */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Test Post</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Sample Post Title</h3>
            <p className="text-gray-600">This is a test post to verify the like functionality.</p>
            <p className="text-sm text-gray-500 mt-2">Post ID: {testPostId}</p>
          </div>

          {/* Like Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Heart className="w-4 h-4" />
              <span>{likeCount} likes</span>
            </div>
            <div className="text-gray-500">
              Status: {isLoadingLikeStatus ? 'Loading...' : (isLiked ? 'Liked' : 'Not liked')}
            </div>
          </div>

          {/* Like Button */}
          <Button
            onClick={handleLike}
            disabled={isLiking || !user}
            className={`flex items-center space-x-2 ${
              isLiked
                ? 'bg-pink-500 hover:bg-pink-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{isLiked ? 'Liked' : 'Like'}</span>
          </Button>
        </div>
      </Card>

      {/* Debug Tools */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Debug Tools</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={checkRedisCache} variant="outline">
              Check Redis Cache
            </Button>
            <Button onClick={processOperations} variant="outline">
              Process Pending Operations
            </Button>
            <Button onClick={() => refetch()} variant="outline">
              Refresh Like Status
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Instructions:</strong></p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Click "Like" to add a like (should update immediately)</li>
              <li>Click "Check Redis Cache" to see buffered operations</li>
              <li>Click "Process Pending Operations" to sync to database</li>
              <li>Refresh the page to verify persistence</li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  );
}
