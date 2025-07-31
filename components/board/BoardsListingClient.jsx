'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Search, Grid, List, Filter, Hash, Globe, Lock, MessageCircle, Eye, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useGetBoards from '@/hooks/user/board/useGetBoards';

export default function BoardsListingClient({ locale, isAuthenticated, user }) {
  const t = useTranslations('BoardsListing');
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');

  // Fetch boards with filters
  const { data: boardsData, isLoading, error } = useGetBoards({
    limit: 50,
    orderBy: sortBy === 'name' ? 'name' : sortBy === 'posts' ? 'created_at' : 'created_at',
    orderDirection: sortBy === 'name' ? 'asc' : 'desc',
    filters: { 
      status: 'approved', 
      is_active: true,
      ...(filterBy !== 'all' && { visibility: filterBy })
    }
  });

  const boards = boardsData?.boards || [];

  // Filter boards based on search query
  const filteredBoards = boards.filter(board => 
    board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    board.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBoardClick = (board) => {
    router.push(`/${locale}/boards/${board.slug}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-8 w-48 bg-[#1E3A5F] rounded mb-4"></div>
            <div className="h-4 w-96 bg-[#1E3A5F] rounded"></div>
          </div>
          
          {/* Filters skeleton */}
          <div className="flex gap-4 mb-6">
            <div className="h-10 w-64 bg-[#1E3A5F] rounded"></div>
            <div className="h-10 w-32 bg-[#1E3A5F] rounded"></div>
            <div className="h-10 w-32 bg-[#1E3A5F] rounded"></div>
          </div>
          
          {/* Boards grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-[#132F4C] rounded-lg p-6 border border-[#1E3A5F]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#1E3A5F] rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-[#1E3A5F] rounded mb-2"></div>
                    <div className="h-3 bg-[#1E3A5F] rounded w-2/3"></div>
                  </div>
                </div>
                <div className="h-4 bg-[#1E3A5F] rounded mb-2"></div>
                <div className="h-4 bg-[#1E3A5F] rounded w-3/4"></div>
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
          <h3 className="text-xl font-semibold text-white mb-4">Error loading boards</h3>
          <p className="text-gray-400 mb-4">{error.message || 'Failed to load boards'}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">All Boards</h1>
        <p className="text-gray-400">Discover and join discussion communities</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search boards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#132F4C] border-[#1E3A5F] text-white placeholder-gray-400"
          />
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40 bg-[#132F4C] border-[#1E3A5F] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#132F4C] border-[#1E3A5F]">
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="posts">Most Posts</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter */}
        <Select value={filterBy} onValueChange={setFilterBy}>
          <SelectTrigger className="w-32 bg-[#132F4C] border-[#1E3A5F] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#132F4C] border-[#1E3A5F]">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode */}
        <div className="flex gap-1 bg-[#132F4C] rounded-lg p-1 border border-[#1E3A5F]">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="p-2"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="p-2"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-6">
        <p className="text-gray-400 text-sm">
          {filteredBoards.length} board{filteredBoards.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Boards Grid/List */}
      {filteredBoards.length === 0 ? (
        <div className="bg-[#132F4C] rounded-lg p-8 text-center border border-[#1E3A5F]">
          <Hash className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No boards found</h3>
          <p className="text-gray-400 text-sm">
            {searchQuery ? 'Try adjusting your search terms.' : 'No boards are available at the moment.'}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "space-y-4"
        }>
          {filteredBoards.map(board => (
            <Card 
              key={board.id} 
              className={`bg-[#132F4C] border-[#1E3A5F] hover:border-blue-500/50 transition-all duration-200 cursor-pointer group ${
                viewMode === 'list' ? 'flex-row' : ''
              }`}
              onClick={() => handleBoardClick(board)}
            >
              <CardHeader className={viewMode === 'list' ? 'flex-row items-center space-y-0 pb-3' : 'pb-3'}>
                <div className={`flex items-center gap-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  {/* Board Icon */}
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-semibold text-white flex-shrink-0"
                    style={{ backgroundColor: board.color || '#1E3A5F' }}
                  >
                    {board.icon || board.name.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Board Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                      {board.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={board.visibility === 'public' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {board.visibility === 'public' ? (
                          <><Globe className="w-3 h-3 mr-1" />Public</>
                        ) : (
                          <><Lock className="w-3 h-3 mr-1" />Private</>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Description */}
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {board.description || 'No description available'}
                </p>
                
                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{board.postsCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{board.view_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(board.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Categories */}
                  {board.categories && board.categories.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      <span className="truncate max-w-20">
                        {board.categories[0].name}
                        {board.categories.length > 1 && ` +${board.categories.length - 1}`}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
