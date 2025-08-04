'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { zhTW, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  MoreHorizontal,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import UserAvatar from '@/components/ui/UserAvatar';
import Reactions from '@/components/reactions/Reactions';
import Comment from './Comment';
import useAuth from '@/hooks/useAuth';
import { usePostLike, usePostLikeStatus } from '@/hooks/usePostLike';
import { toast } from 'sonner';

export default function PostCard({ post }) {
  const tComments = useTranslations('Comments');
  const locale = useLocale();
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isAnonymousComment, setIsAnonymousComment] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);

  const { mutateAsync: toggleLike, isPending: isLiking } = usePostLike();

  // Get like status using React Query
  const { data: likeStatus, isLoading: isLoadingLikeStatus } = usePostLikeStatus(
    user?.id ? post.id : null
  );

  const isLiked = likeStatus?.isLiked || false;

  // Debug logging
  useEffect(() => {
    console.log(`[PostCard] Post ${post.id} - likeStatus:`, likeStatus, 'isLiked:', isLiked);
  }, [likeStatus, isLiked, post.id]);



  // Sync with post data changes
  useEffect(() => {
    setLikeCount(post.like_count || 0);
  }, [post.like_count]);

  // Update like count from server if available
  useEffect(() => {
    if (likeStatus?.likeCount !== undefined) {
      setLikeCount(likeStatus.likeCount);
    }
  }, [likeStatus?.likeCount]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const localeMap = {
      'zh': zhTW,
      'en': enUS,
    };
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: localeMap[locale] || enUS 
    });
  };

  // Get post type display
  const getPostTypeDisplay = (postType) => {
    const typeMap = {
      'general': 'Article',
      'article': 'Article',
      'picture': 'Picture',
      'video': 'Video',
      'poll': 'Poll',
      'question': 'Question',
      'sharing': 'Sharing'
    };
    return typeMap[postType] || 'Article';
  };

  // Handle like
  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }

    console.log(`[handleLike] Current state - isLiked: ${isLiked}, likeCount: ${likeCount}`);

    // Optimistic update for like count only
    const newLikeCount = isLiked ? likeCount - 1 : likeCount + 1;
    setLikeCount(newLikeCount);

    try {
      const result = await toggleLike({
        postId: post.id,
        isLiked: isLiked
      });

      console.log(`[handleLike] API result:`, result);

      // Show feedback to user
      if (isLiked) {
        toast.success('Removed like');
      } else {
        toast.success('Liked post');
      }

      // React Query will automatically refetch the like status
    } catch (error) {
      // Revert optimistic update on error
      setLikeCount(likeCount);
      console.error('[handleLike] Error:', error);
      toast.error('Failed to update like');
    }
  };

  // Load comments
  const loadComments = async () => {
    if (isLoadingComments) return;
    
    setIsLoadingComments(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments?limit=5&offset=0`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Toggle comments visibility
  const toggleComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  // Submit comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
          is_anonymous: isAnonymousComment,
        }),
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments(prev => [newCommentData, ...prev]);
        setNewComment('');
        toast.success('Comment added successfully');
      } else {
        throw new Error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle reply to comment
  const handleReplyToComment = async (parentCommentId, content, isAnonymous = false) => {
    if (!user || !content.trim()) return;

    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          parent_id: parentCommentId,
          is_anonymous: isAnonymous,
        }),
      });

      if (response.ok) {
        const newReply = await response.json();
        // Update the comments list to include the new reply
        setComments(prev => prev.map(comment => {
          if (comment.id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newReply]
            };
          }
          return comment;
        }));
        toast.success('Reply added successfully');
      } else {
        throw new Error('Failed to add reply');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add reply');
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-500 bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-blue-500/20 rounded-2xl">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500" />

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500"
           style={{
             backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
             backgroundSize: '20px 20px'
           }} />

      {/* Post Header */}
      <div className="relative z-10 p-6 border-b border-white/10 group-hover:border-white/20 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <UserAvatar
                user={post.author}
                isAnonymous={post.is_anonymous}
                size="md"
                className="transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm" />
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="font-bold text-white group-hover:text-blue-300 transition-colors duration-300">
                  {post.is_anonymous ? 'Anonymous' : (post.author?.username || post.author?.name || 'Anonymous')}
                </h3>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-300">
                  {getPostTypeDisplay(post.post_type)}
                </span>
              </div>
              <p className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors duration-300">
                {formatDate(post.created_at)}
                {post.board && (
                  <>
                    {' • '}
                    <Link
                      href={`/boards/${post.board.slug}`}
                      className="text-blue-400 hover:text-blue-300 transition-colors duration-200 font-medium"
                    >
                      {post.board.name}
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 rounded-full">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Post Content */}
      <div className="relative z-10 p-6">
        <Link href={`/home/${post.slug || post.id}`} className="block">
          <h2 className="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-all duration-300 leading-relaxed">
            {post.title}
          </h2>
          {post.content && (
            <div className="text-gray-300 mb-4 line-clamp-3 group-hover:text-gray-200 transition-colors duration-300 leading-relaxed">
              {post.content.length > 200
                ? `${post.content.substring(0, 200)}...`
                : post.content
              }
            </div>
          )}
        </Link>

        {/* Post Image/Media */}
        {post.image_url && (
          <div className="mb-4 rounded-2xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        )}
      </div>

      {/* Post Stats */}
      <div className="relative z-10 px-6 py-4 border-t border-white/10 group-hover:border-white/20 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-gray-400 group-hover:text-pink-300 transition-colors duration-300">
              <div className="p-1 bg-pink-500/10 rounded-lg group-hover:bg-pink-500/20 transition-colors duration-300">
                <Heart className="w-4 h-4" />
              </div>
              <span className="font-medium">{likeCount}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 group-hover:text-green-300 transition-colors duration-300">
              <div className="p-1 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors duration-300">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="font-medium">{post.comment_count || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 group-hover:text-blue-300 transition-colors duration-300">
              <div className="p-1 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors duration-300">
                <Eye className="w-4 h-4" />
              </div>
              <span className="font-medium">{post.view_count || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 group-hover:text-purple-300 transition-colors duration-300">
              <div className="p-1 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors duration-300">
                <Share2 className="w-4 h-4" />
              </div>
              <span className="font-medium">{post.share_count || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar with integrated reactions */}
      <div className="relative z-10 px-6 py-3 border-t border-white/10 group-hover:border-white/20 transition-colors duration-300">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            {/* Like count */}
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4 text-pink-400 fill-current" />
              <span>{likeCount}</span>
            </div>

            {/* Comment count */}
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4 text-green-400" />
              <span>{post.commentsCount || post.comments_count || 0}</span>
            </div>

            {/* View count */}
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4 text-blue-400" />
              <span>{post.viewCount || post.view_count || 0}</span>
            </div>

            {/* Share count */}
            <div className="flex items-center space-x-1">
              <Share2 className="w-4 h-4 text-purple-400" />
              <span>{post.share_count || 0}</span>
            </div>

            {/* Reaction counts - integrated in the same line */}
            <Reactions
              type="post"
              targetId={post.id}
              initialReactionCounts={post.reaction_counts || {}}
              initialUserReactions={[]}
              className="scale-75"
              compact={true}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 px-6 py-3 border-t border-white/10 group-hover:border-white/20 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLiking}
            className={`flex-1 flex items-center justify-center space-x-2 transition-all duration-300 rounded-lg py-2 mx-1 ${
              isLiked
                ? 'text-pink-400 bg-pink-500/20 hover:text-pink-300 hover:bg-pink-500/30'
                : 'text-gray-400 hover:text-pink-300 hover:bg-pink-500/10'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="font-medium">{isLiked ? 'Liked' : 'Like'}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleComments}
            className="flex-1 flex items-center justify-center space-x-2 text-gray-400 hover:text-blue-300 hover:bg-blue-500/10 transition-all duration-300 rounded-lg py-2 mx-1"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">Comment</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex-1 flex items-center justify-center space-x-2 text-gray-400 hover:text-green-300 hover:bg-green-500/10 transition-all duration-300 rounded-lg py-2 mx-1"
          >
            <Share2 className="w-5 h-5" />
            <span className="font-medium">Share</span>
          </Button>
        </div>
      </div>

      {/* Hot Comments Preview */}
      {post.hotComments && post.hotComments.length > 0 && (
        <div className="relative z-10 px-6 py-4 border-t border-white/10 group-hover:border-white/20 transition-colors duration-300">
          <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
            🔥 Hot Comments
          </h4>
          <div className="space-y-3">
            {post.hotComments.slice(0, 2).map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <UserAvatar
                  user={comment.author}
                  isAnonymous={comment.is_anonymous}
                  size="xs"
                />
                <div className="flex-1 min-w-0">
                  <div className="bg-white/5 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-medium text-white">
                        {comment.is_anonymous
                          ? 'Anonymous'
                          : (comment.author?.username || 'Anonymous')
                        }
                      </p>
                      <span className="text-xs text-gray-400 flex items-center">
                        <Heart className="w-3 h-3 mr-1 text-pink-400" />
                        {comment.like_count || 0}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 line-clamp-2">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {post.hotComments.length > 2 && (
              <button
                onClick={toggleComments}
                className="text-xs text-blue-400 hover:underline"
              >
                View {post.hotComments.length - 2} more hot comment{post.hotComments.length - 2 > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hover effect line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-b-2xl" />

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-white/10 group-hover:border-white/20 transition-colors duration-300">
          {/* Comment Input */}
          {user && (
            <div className="p-4 border-b border-white/10">
              <form onSubmit={handleSubmitComment} className="flex items-start space-x-3">
                <UserAvatar
                  user={isAnonymousComment ? null : user}
                  isAnonymous={isAnonymousComment}
                  size="sm"
                />
                <div className="flex-1">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={isAnonymousComment ? tComments('writeAnonymousComment') : tComments('writeComment')}
                    className="min-h-[60px] resize-none bg-white/5 border-white/20 text-white placeholder-gray-400"
                    disabled={isSubmittingComment}
                  />
                  <div className="flex items-center justify-between mt-2">
                    {/* Anonymous Mode Toggle */}
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAnonymousComment}
                          onChange={(e) => setIsAnonymousComment(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-400">
                          {tComments('commentAnonymously')}
                        </span>
                      </label>
                    </div>

                    <Button
                      type="submit"
                      size="sm"
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="flex items-center space-x-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300"
                    >
                      <Send className="w-3 h-3" />
                      <span>{tComments('post')}</span>
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Comments List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoadingComments ? (
              <div className="p-4 text-center text-gray-400">Loading comments...</div>
            ) : comments.length > 0 ? (
              <div className="space-y-4 p-4">
                {comments.map((comment) => (
                  <Comment
                    key={comment.id}
                    comment={comment}
                    onReply={handleReplyToComment}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-400">No comments yet</div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
