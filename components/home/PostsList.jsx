'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import UserAvatar from '@/components/ui/UserAvatar';
import { useEnhancedPosts } from '@/hooks/useCachedCounts';
import Reactions from '@/components/reactions/Reactions';

export default function PostsList({ posts = [], isLoading, error }) {
  const t = useTranslations('NewPost');
  const { posts: enhancedPosts, isLoading: dataLoading } = useEnhancedPosts(posts);
  if (isLoading || dataLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-[#132F4C] rounded-lg p-6 border border-[#1E3A5F]">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-[#1E4976] rounded-full animate-pulse"></div>
              <div className="ml-3 space-y-2">
                <div className="h-4 bg-[#1E4976] rounded w-24 animate-pulse"></div>
                <div className="h-3 bg-[#1E4976] rounded w-16 animate-pulse"></div>
              </div>
            </div>
            <div className="h-6 bg-[#1E4976] rounded w-3/4 mb-3 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-[#1E4976] rounded w-full animate-pulse"></div>
              <div className="h-4 bg-[#1E4976] rounded w-5/6 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#132F4C] rounded-lg p-8 text-center">
        <h3 className="text-xl font-semibold mb-4 text-white">Error loading posts</h3>
        <p className="text-gray-400">{error.message}</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="bg-[#132F4C] rounded-lg p-8 text-center">
        <h3 className="text-xl font-semibold mb-4 text-white">No posts yet</h3>
        <p className="text-gray-400">Follow topics or users to see posts here</p>
      </div>
    );
  }

  // Use enhanced posts with cached data and hot comments
  const displayPosts = enhancedPosts.length > 0 ? enhancedPosts : posts;

  // Helper function to get post type display
  const getPostTypeDisplay = (postType) => {
    const typeMap = {
      'general': t('article'),
      'article': t('article'),
      'picture': t('picture'),
      'video': t('video'),
      'poll': t('poll'),
      'question': 'Question',
      'sharing': 'Sharing'
    };
    return typeMap[postType] || t('article');
  };

  return (
    <div className="space-y-4">
      {displayPosts.map((post) => {
        const postHotComments = post.hotComments || [];

        return (
          <div key={post.id} className="bg-[#132F4C] rounded-lg p-6 border border-[#1E3A5F] hover:border-[#2E5A8A] transition-colors">
            <div className="flex items-center mb-4">
              <UserAvatar
                user={post.author}
                isAnonymous={post.is_anonymous}
                size="md"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white">
                    {post.is_anonymous ? t('anonymousPost') : (post.author?.username || post.author?.name || t('anonymousPost'))}
                  </p>
                  <span className="px-2 py-1 bg-[#1E4976] text-xs text-blue-300 rounded-full">
                    {getPostTypeDisplay(post.post_type)}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <Link href={`/home/${post.slug || post.id}`} className="block group">
              <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-blue-300 transition-colors">
                {post.title}
              </h3>
              <p className="text-gray-300 mb-4 line-clamp-3">
                {post.content?.substring(0, 200)}{post.content?.length > 200 ? '...' : ''}
              </p>
            </Link>

            {/* Hot Comments Preview */}
            {postHotComments.length > 0 && (
              <div className="mb-4 bg-[#0F2A44] rounded-lg p-4 border border-[#1E3A5F]">
                <h4 className="text-sm font-medium text-blue-300 mb-3">🔥 Hot Comments</h4>
                <div className="space-y-3">
                  {postHotComments.slice(0, 2).map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-3">
                      <UserAvatar
                        user={comment.author}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-white">
                            {comment.author?.username || 'Anonymous'}
                          </p>
                          <span className="text-xs text-gray-500">
                            {comment.like_count || 0} ❤️
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-2">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {postHotComments.length > 2 && (
                  <Link
                    href={`/home/${post.slug || post.id}#comments`}
                    className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block"
                  >
                    View {postHotComments.length - 2} more hot comments...
                  </Link>
                )}
              </div>
            )}

            <div className="space-y-3">
              {/* Stats and Actions Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-400 text-sm">
                  <span className="mr-4">{post.like_count || 0} likes</span>
                  <span>{post.comment_count || 0} comments</span>
                </div>
                <div className="flex items-center gap-2">
                  {post.board && (
                    <span className="text-xs text-gray-500 bg-[#1E3A5F] px-2 py-1 rounded">
                      {post.board.name}
                    </span>
                  )}
                  <Link
                    href={`/home/${post.slug || post.id}`}
                    className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded border border-blue-400/30 hover:border-blue-300/50 transition-colors"
                  >
                    View More
                  </Link>
                </div>
              </div>

              {/* Reactions Row */}
              <div className="flex justify-start">
                <Reactions
                  type="post"
                  targetId={post.id}
                  initialReactionCounts={post.reaction_counts || {}}
                  initialUserReactions={[]}
                  className="scale-90"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}