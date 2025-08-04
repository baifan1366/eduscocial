'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Pin, Calendar, Hash, Filter, TrendingUp, Clock, Star, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import UserAvatar from '@/components/ui/UserAvatar';
import useGetBoard from '@/hooks/useGetBoard';
import BoardHeader from './BoardHeader';

export default function BoardDetailClient({ boardSlug, locale, isAuthenticated, user }) {
  const t = useTranslations('BoardDetail');
  const tPost = useTranslations('NewPost');
  const router = useRouter();
  const { data: board, isLoading, error } = useGetBoard(boardSlug);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('trending');

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
      {/* Board Header */}
      <div className="mb-8">
        <BoardHeader
          board={board}
          locale={locale}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Posts Section */}
        <div className="lg:col-span-3">
          <Card className="bg-[#132F4C] border-[#1E3A5F]">
            <div className="p-6">
              {/* Content Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-white">Posts</h2>
                  {isAuthenticated && (
                    <Button
                      onClick={handleCreatePost}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Post
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>

              {/* Post Tabs */}
              <div className="w-full">
                <div className="grid w-full grid-cols-3 bg-[#1E3A5F] rounded-lg p-1 mb-6">
                  <Button
                    variant={activeTab === 'trending' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('trending')}
                    className={`${activeTab === 'trending' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Trending
                  </Button>
                  <Button
                    variant={activeTab === 'latest' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('latest')}
                    className={`${activeTab === 'latest' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Latest
                  </Button>
                  <Button
                    variant={activeTab === 'pinned' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('pinned')}
                    className={`${activeTab === 'pinned' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  >
                    <Pin className="w-4 h-4 mr-2" />
                    Pinned
                  </Button>
                </div>

                {activeTab === 'trending' && (
                  <div>
                    {filteredPosts.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">No posts yet</p>
                        {isAuthenticated && (
                          <Button
                            onClick={handleCreatePost}
                            className="mt-4 bg-blue-600 hover:bg-blue-700"
                          >
                            Create the first post
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                      {filteredPosts.map(post => (
                        <Card key={post.id} className="bg-[#1E3A5F]/30 border-[#1E3A5F] hover:border-blue-500/50 transition-colors cursor-pointer">
                          <CardContent className="p-4">
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
                                  size="sm"
                                  showUsername={true}
                                  isAnonymous={post.is_anonymous}
                                />
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3" />
                                  <span>{post.likesCount}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="w-3 h-3" />
                                  <span>{post.commentsCount}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'latest' && (
                  <div className="text-center py-8 text-gray-400">
                    Latest posts will be shown here
                  </div>
                )}

                {activeTab === 'pinned' && (
                  <div className="text-center py-8 text-gray-400">
                    Pinned posts will be shown here
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Board Info */}
            <Card className="bg-[#132F4C] border-[#1E3A5F]">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-3">About</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Created {new Date(board.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    <span>#{board.slug}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rules */}
            <Card className="bg-[#132F4C] border-[#1E3A5F]">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-3">Rules</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>1. Be respectful to other members</p>
                  <p>2. Stay on topic</p>
                  <p>3. No spam or self-promotion</p>
                  <p>4. Use appropriate post types</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
