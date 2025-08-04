'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, Eye } from 'lucide-react';
import useGetPost from '@/hooks/useGetPost';
import { usePostLike } from '@/hooks/usePostLike';
import UserAvatar from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/button';
import CommentsList from '@/components/comments/CommentsList';
import Reactions from '@/components/reactions/Reactions';

export default function PostDetailClient({ postId, locale, isAuthenticated }) {
  const tPost = useTranslations('NewPost');
  const router = useRouter();
  const { data: post, isLoading, error } = useGetPost(postId);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const postLikeMutation = usePostLike();

  // Helper function to get post type display
  const getPostTypeDisplay = (postType) => {
    const typeMap = {
      'general': tPost('article'),
      'article': tPost('article'),
      'picture': tPost('picture'),
      'video': tPost('video'),
      'poll': tPost('poll'),
      'question': 'Question',
      'sharing': 'Sharing'
    };
    return typeMap[postType] || tPost('article');
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }

    try {
      await postLikeMutation.mutateAsync({
        postId: post.id,
        isLiked: isLiked
      });

      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error liking/unliking post:', error);
    }
  };

  const handleBookmark = () => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.content?.substring(0, 100),
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A1929]">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="animate-pulse">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-white/10 rounded-full"></div>
                <div className="ml-4 space-y-3">
                  <div className="h-5 bg-white/10 rounded-lg w-40"></div>
                  <div className="h-4 bg-white/10 rounded-lg w-32"></div>
                </div>
              </div>
              <div className="h-10 bg-white/10 rounded-lg w-3/4 mb-6"></div>
              <div className="space-y-3">
                <div className="h-5 bg-white/10 rounded-lg w-full"></div>
                <div className="h-5 bg-white/10 rounded-lg w-5/6"></div>
                <div className="h-5 bg-white/10 rounded-lg w-4/5"></div>
                <div className="h-5 bg-white/10 rounded-lg w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A1929]">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white/5 backdrop-blur-sm border border-red-500/20 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4 text-white">Error loading post</h3>
            <p className="text-gray-300 mb-6 text-lg">{error.message}</p>
            <Button
              onClick={() => router.back()}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl transition-all duration-300"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0A1929]">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white/5 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4 text-white">Post not found</h3>
            <p className="text-gray-300 mb-6 text-lg">The post you're looking for doesn't exist or has been removed.</p>
            <Button
              onClick={() => router.back()}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl transition-all duration-300"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1929]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <div className="mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="text-gray-400 hover:text-white transition-all duration-300 hover:bg-white/10 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Post content */}
        <div className="group relative overflow-hidden transition-all duration-500 bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-blue-500/20 rounded-2xl">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500" />

          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500"
               style={{
                 backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                 backgroundSize: '20px 20px'
               }} />

          {/* Author info */}
          <div className="relative z-10 p-6 border-b border-white/10 group-hover:border-white/20 transition-colors duration-300">
            <div className="flex items-center">
              <div className="relative">
                <UserAvatar
                  user={post.author}
                  isAnonymous={post.is_anonymous}
                  size="lg"
                  className="transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm" />
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-bold text-white text-lg group-hover:text-blue-300 transition-colors duration-300">
                    {post.is_anonymous ? tPost('anonymousPost') : (post.author?.username || post.author?.name || tPost('anonymousPost'))}
                  </h4>
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 text-sm rounded-full border border-blue-500/30 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-300">
                    {getPostTypeDisplay(post.post_type)}
                  </span>
                </div>
                <p className="text-gray-400 text-sm group-hover:text-gray-200 transition-colors duration-300">
                  {new Date(post.created_at).toLocaleDateString()} • {new Date(post.created_at).toLocaleTimeString()}
                </p>
                {post.board && (
                  <p className="text-blue-400 hover:text-blue-300 text-sm mt-1 font-medium transition-colors duration-200">
                    in {post.board.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Post title */}
          <div className="relative z-10 px-6 pt-6">
            <h1 className="text-3xl font-bold text-white mb-6 group-hover:text-blue-300 transition-all duration-300 leading-relaxed">
              {post.title}
            </h1>
          </div>

          {/* Post content */}
          <div className="relative z-10 px-6 pb-6">
            <div className="text-gray-300 mb-6 whitespace-pre-wrap leading-relaxed text-lg group-hover:text-gray-200 transition-colors duration-300">
              {post.content}
            </div>

            {/* Post Image/Media */}
            {post.image_url && (
              <div className="mb-6 rounded-2xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full h-auto max-h-96 object-cover"
                />
              </div>
            )}
          </div>

          {/* Stats bar with integrated reactions */}
          <div className="relative z-10 px-6 py-3 border-t border-white/10 group-hover:border-white/20 transition-colors duration-300">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center space-x-4">
                {/* Like count */}
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4 text-pink-400 fill-current" />
                  <span>{post.likesCount || post.likes_count || 0}</span>
                </div>

                {/* Comment count */}
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4 text-green-400" />
                  <span>{post.commentsCount || post.comments_count || 0}</span>
                </div>

                {/* View count */}
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span>{post.view_count || 0}</span>
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

          {/* Action buttons */}
          <div className="relative z-10 px-6 py-3 border-t border-white/10 group-hover:border-white/20 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <Button
                onClick={handleLike}
                variant="ghost"
                size="sm"
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
                className="flex-1 flex items-center justify-center space-x-2 text-gray-400 hover:text-blue-300 hover:bg-blue-500/10 transition-all duration-300 rounded-lg py-2 mx-1"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">Comment</span>
              </Button>

              <Button
                onClick={handleShare}
                variant="ghost"
                size="sm"
                className="flex-1 flex items-center justify-center space-x-2 text-gray-400 hover:text-green-300 hover:bg-green-500/10 transition-all duration-300 rounded-lg py-2 mx-1"
              >
                <Share2 className="w-5 h-5" />
                <span className="font-medium">Share</span>
              </Button>

              <Button
                onClick={handleBookmark}
                variant="ghost"
                size="sm"
                className={`flex items-center justify-center space-x-2 transition-all duration-300 rounded-lg py-2 px-3 ${
                  isBookmarked
                    ? 'text-yellow-400 bg-yellow-500/20 hover:text-yellow-300 hover:bg-yellow-500/30'
                    : 'text-gray-400 hover:text-yellow-300 hover:bg-yellow-500/10'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>


        </div>

        {/* Comments section */}
        <div className="mt-6">
          {post.id && (
            <CommentsList
              postId={post.id}
              initialCommentsCount={post.commentsCount || post.comments_count || 0}
            />
          )}
        </div>
      </div>
    </div>
  );
}
