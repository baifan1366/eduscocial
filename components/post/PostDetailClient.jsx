'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import useGetPost from '@/hooks/useGetPost';
import UserAvatar from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/button';
import CommentsList from '@/components/comments/CommentsList';

export default function PostDetailClient({ postId, locale, isAuthenticated }) {
  const t = useTranslations('PostDetail');
  const tPost = useTranslations('NewPost');
  const router = useRouter();
  const { data: post, isLoading, error } = useGetPost(postId);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

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

  const handleLike = () => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
    setIsLiked(!isLiked);
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-[#132F4C] rounded-lg p-6 border border-[#1E3A5F]">
          <div className="animate-pulse">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-[#1E4976] rounded-full"></div>
              <div className="ml-3 space-y-2">
                <div className="h-4 bg-[#1E4976] rounded w-32"></div>
                <div className="h-3 bg-[#1E4976] rounded w-24"></div>
              </div>
            </div>
            <div className="h-8 bg-[#1E4976] rounded w-3/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-[#1E4976] rounded w-full"></div>
              <div className="h-4 bg-[#1E4976] rounded w-5/6"></div>
              <div className="h-4 bg-[#1E4976] rounded w-4/5"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-[#132F4C] rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold mb-4 text-white">Error loading post</h3>
          <p className="text-gray-400 mb-4">{error.message}</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-[#132F4C] rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold mb-4 text-white">Post not found</h3>
          <p className="text-gray-400 mb-4">The post you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <div className="mb-6">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Post content */}
      <div className="bg-[#132F4C] rounded-lg p-6 border border-[#1E3A5F]">
        {/* Author info */}
        <div className="flex items-center mb-6">
          <UserAvatar 
            user={post.author} 
            isAnonymous={post.is_anonymous}
            size="lg"
          />
          <div className="ml-4 flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h4 className="font-semibold text-white text-lg">
                {post.is_anonymous ? tPost('anonymousPost') : (post.author?.username || post.author?.name || tPost('anonymousPost'))}
              </h4>
              <span className="px-3 py-1 bg-[#1E4976] text-sm text-blue-300 rounded-full">
                {getPostTypeDisplay(post.post_type)}
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              {new Date(post.created_at).toLocaleDateString()} • {new Date(post.created_at).toLocaleTimeString()}
            </p>
            {post.board && (
              <p className="text-gray-500 text-sm mt-1">
                in {post.board.name}
              </p>
            )}
          </div>
        </div>

        {/* Post title */}
        <h1 className="text-2xl font-bold text-white mb-4">
          {post.title}
        </h1>

        {/* Post content */}
        <div className="text-gray-300 mb-6 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between border-t border-[#1E3A5F] pt-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleLike}
              variant="ghost"
              size="sm"
              className={`text-gray-400 hover:text-red-400 ${isLiked ? 'text-red-400' : ''}`}
            >
              <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
              {post.likesCount || post.likes_count || 0}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-blue-400"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {post.commentsCount || post.comments_count || 0}
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={handleBookmark}
              variant="ghost"
              size="sm"
              className={`text-gray-400 hover:text-yellow-400 ${isBookmarked ? 'text-yellow-400' : ''}`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </Button>
            
            <Button
              onClick={handleShare}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-green-400"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div className="mt-6">
        <CommentsList
          postId={postId}
          initialCommentsCount={post.commentsCount || post.comments_count || 0}
        />
      </div>
    </div>
  );
}
