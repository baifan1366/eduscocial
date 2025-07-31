'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, MessageCircle, Eye, Plus, Pin, Calendar, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserAvatar from '@/components/ui/UserAvatar';
import useGetBoard from '@/hooks/useGetBoard';

export default function BoardDetailClient({ boardSlug, locale, isAuthenticated, user }) {
  const t = useTranslations('BoardDetail');
  const tPost = useTranslations('NewPost');
  const router = useRouter();
  const { data: board, isLoading, error } = useGetBoard(boardSlug);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Increment view count when board loads
  useEffect(() => {
    if (board?.id) {
      // Non-blocking view count increment
      fetch(`/api/boards/${boardSlug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'increment_view' }),
      }).catch(err => {
        console.log('Failed to increment view count:', err);
      });
    }
  }, [board?.id, boardSlug]);

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

  // Filter posts based on selected filter
  const filteredPosts = board?.posts?.filter(post => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pinned') return post.is_pinned;
    if (selectedFilter === 'recent') return new Date(post.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return post.post_type === selectedFilter;
  }) || [];

  const handleCreatePost = () => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login?callbackUrl=/${locale}/newpost?board=${board?.slug}`);
      return;
    }
    router.push(`/${locale}/newpost?board=${board?.slug}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse">
          {/* Back button skeleton */}
          <div className="mb-6">
            <div className="h-10 w-20 bg-[#1E3A5F] rounded"></div>
          </div>
          
          {/* Board header skeleton */}
          <div className="bg-[#132F4C] rounded-lg p-6 border border-[#1E3A5F] mb-6">
            <div className="h-8 w-64 bg-[#1E3A5F] rounded mb-4"></div>
            <div className="h-4 w-full bg-[#1E3A5F] rounded mb-2"></div>
            <div className="h-4 w-3/4 bg-[#1E3A5F] rounded mb-4"></div>
            <div className="flex gap-4">
              <div className="h-6 w-20 bg-[#1E3A5F] rounded"></div>
              <div className="h-6 w-20 bg-[#1E3A5F] rounded"></div>
              <div className="h-6 w-20 bg-[#1E3A5F] rounded"></div>
            </div>
          </div>
          
          {/* Posts skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#132F4C] rounded-lg p-6 border border-[#1E3A5F]">
                <div className="h-6 w-3/4 bg-[#1E3A5F] rounded mb-3"></div>
                <div className="h-4 w-full bg-[#1E3A5F] rounded mb-2"></div>
                <div className="h-4 w-2/3 bg-[#1E3A5F] rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-[#132F4C] rounded-lg p-8 text-center border border-red-500/20">
          <h3 className="text-xl font-semibold mb-4 text-white">Error loading board</h3>
          <p className="text-gray-400 mb-4">{error.message || 'Failed to load board details'}</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-[#132F4C] rounded-lg p-8 text-center border border-[#1E3A5F]">
          <h3 className="text-xl font-semibold mb-4 text-white">Board not found</h3>
          <p className="text-gray-400 mb-4">The board you're looking for doesn't exist or is not available.</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
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

      {/* Board header */}
      <div className="bg-[#132F4C] rounded-lg p-6 border border-[#1E3A5F] mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {board.icon && (
              <div className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl"
                   style={{ backgroundColor: board.color || '#1E3A5F' }}>
                {board.icon}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{board.name}</h1>
              <p className="text-gray-400 text-lg">{board.description}</p>
            </div>
          </div>
          
          {isAuthenticated && (
            <Button onClick={handleCreatePost} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          )}
        </div>

        {/* Board stats */}
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span>{board.postsCount || 0} posts</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>{board.view_count || 0} views</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Created {new Date(board.created_at).toLocaleDateString()}</span>
          </div>
          <Badge variant={board.visibility === 'public' ? 'default' : 'secondary'}>
            {board.visibility}
          </Badge>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="bg-[#132F4C] rounded-lg p-4 border border-[#1E3A5F] mb-6">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'All Posts' },
            { key: 'pinned', label: 'Pinned' },
            { key: 'recent', label: 'Recent' },
            { key: 'general', label: 'General' },
            { key: 'question', label: 'Questions' },
            { key: 'poll', label: 'Polls' }
          ].map(filter => (
            <Button
              key={filter.key}
              variant={selectedFilter === filter.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedFilter(filter.key)}
              className={selectedFilter === filter.key ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Posts list */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-[#132F4C] rounded-lg p-8 text-center border border-[#1E3A5F]">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No posts yet</h3>
            <p className="text-gray-400 mb-4">
              {selectedFilter === 'all' 
                ? 'Be the first to create a post in this board!' 
                : `No ${selectedFilter} posts found.`}
            </p>
            {isAuthenticated && selectedFilter === 'all' && (
              <Button onClick={handleCreatePost} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create First Post
              </Button>
            )}
          </div>
        ) : (
          filteredPosts.map(post => (
            <Link key={post.id} href={`/${locale}/home/${post.slug}`}>
              <div className="bg-[#132F4C] rounded-lg p-6 border border-[#1E3A5F] hover:border-blue-500/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {post.is_pinned && (
                      <Pin className="w-4 h-4 text-yellow-400" />
                    )}
                    <Badge variant="outline" className="text-xs">
                      {getPostTypeDisplay(post.post_type)}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-2 hover:text-blue-400 transition-colors">
                  {post.title}
                </h3>
                
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {post.content?.substring(0, 150)}...
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserAvatar 
                      user={post.author} 
                      isAnonymous={post.is_anonymous}
                      size="sm"
                    />
                    <span className="text-sm text-gray-400">
                      {post.is_anonymous ? 'Anonymous' : (post.author?.username || 'Unknown')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{post.view_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.commentsCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
