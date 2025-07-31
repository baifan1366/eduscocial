'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import { usePostComments } from '@/hooks/useComments';

export default function CommentsList({ postId, initialCommentsCount = 0 }) {
  const t = useTranslations('Comments');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [limit, setLimit] = useState(20);
  
  const {
    data: commentsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = usePostComments(postId, {
    limit,
    orderBy: sortBy,
    orderDirection: sortDirection,
    queryOptions: {
      keepPreviousData: true
    }
  });
  
  const comments = commentsData?.comments || [];
  const totalComments = commentsData?.pagination?.total || initialCommentsCount;
  
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    // Reset to first page when sorting changes
  };
  
  const handleSortDirectionToggle = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  const loadMoreComments = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };
  
  if (error) {
    return (
      <div className="bg-[#132F4C] rounded-lg p-6 border border-[#1E3A5F]">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('errorTitle', { default: 'Failed to load comments' })}
          </h3>
          <p className="text-gray-400 mb-4">
            {t('errorMessage', { default: 'There was an error loading the comments. Please try again.' })}
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="border-[#2E5A8A] text-gray-300 hover:text-white hover:bg-[#2E5A8A]"
          >
            {t('retry', { default: 'Retry' })}
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-[#132F4C] rounded-lg border border-[#1E3A5F]">
      {/* Comments header */}
      <div className="p-6 border-b border-[#1E3A5F]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            {t('commentsTitle', { default: 'Comments' })} ({totalComments})
          </h3>
          
          {/* Sort controls */}
          <div className="flex items-center space-x-2">
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-32 bg-[#1E3A5F] border-[#2E5A8A] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1E3A5F] border-[#2E5A8A]">
                <SelectItem value="created_at" className="text-gray-300 hover:text-white">
                  {t('sortByTime', { default: 'Time' })}
                </SelectItem>
                <SelectItem value="like_count" className="text-gray-300 hover:text-white">
                  {t('sortByLikes', { default: 'Likes' })}
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSortDirectionToggle}
              className="text-gray-400 hover:text-white"
            >
              {sortDirection === 'asc' ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Add comment button */}
        <Button
          onClick={() => setShowCommentForm(!showCommentForm)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {showCommentForm 
            ? t('hideCommentForm', { default: 'Hide comment form' })
            : t('addComment', { default: 'Add a comment' })
          }
        </Button>
      </div>
      
      {/* Comment form */}
      {showCommentForm && (
        <div className="p-6 border-b border-[#1E3A5F]">
          <CommentForm
            postId={postId}
            onCancel={() => setShowCommentForm(false)}
          />
        </div>
      )}
      
      {/* Comments list */}
      <div className="divide-y divide-[#1E3A5F]">
        {isLoading ? (
          // Loading skeleton
          <div className="p-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="py-4">
                <div className="bg-[#1A2332] rounded-lg p-4 animate-pulse">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-[#2E3A4A] rounded-full"></div>
                    <div className="ml-3 space-y-1">
                      <div className="h-4 bg-[#2E3A4A] rounded w-20"></div>
                      <div className="h-3 bg-[#2E3A4A] rounded w-16"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-[#2E3A4A] rounded w-full"></div>
                    <div className="h-4 bg-[#2E3A4A] rounded w-3/4"></div>
                  </div>
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="h-6 bg-[#2E3A4A] rounded w-12"></div>
                    <div className="h-6 bg-[#2E3A4A] rounded w-12"></div>
                    <div className="h-6 bg-[#2E3A4A] rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          // Empty state
          <div className="p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-white mb-2">
              {t('noComments', { default: 'No comments yet' })}
            </h4>
            <p className="text-gray-400 mb-4">
              {t('beFirstToComment', { default: 'Be the first to share your thoughts!' })}
            </p>
            <Button
              onClick={() => setShowCommentForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {t('addFirstComment', { default: 'Add the first comment' })}
            </Button>
          </div>
        ) : (
          // Comments
          <div>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={postId}
                level={0}
                maxLevel={3}
              />
            ))}
            
            {/* Load more button */}
            {hasNextPage && (
              <div className="p-6 text-center border-t border-[#1E3A5F]">
                <Button
                  onClick={loadMoreComments}
                  disabled={isFetchingNextPage}
                  variant="outline"
                  className="border-[#2E5A8A] text-gray-300 hover:text-white hover:bg-[#2E5A8A]"
                >
                  {isFetchingNextPage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mr-2" />
                      {t('loading', { default: 'Loading...' })}
                    </>
                  ) : (
                    t('loadMore', { default: 'Load more comments' })
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
