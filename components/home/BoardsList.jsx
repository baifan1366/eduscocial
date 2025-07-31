'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, Users, Eye, ChevronRight, Hash, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function BoardsList({ boards, isLoading, error, locale = 'en' }) {
  const t = useTranslations('HomePage');
  const router = useRouter();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Popular Boards</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-[#132F4C] rounded-lg p-4 border border-[#1E3A5F] animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#1E3A5F] rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-[#1E3A5F] rounded mb-2"></div>
                  <div className="h-3 bg-[#1E3A5F] rounded w-2/3"></div>
                </div>
              </div>
              <div className="h-3 bg-[#1E3A5F] rounded mb-2"></div>
              <div className="h-3 bg-[#1E3A5F] rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#132F4C] rounded-lg p-6 border border-red-500/20 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Failed to load boards</h3>
        <p className="text-gray-400 text-sm">{error.message || 'Something went wrong'}</p>
      </div>
    );
  }

  if (!boards || boards.length === 0) {
    return (
      <div className="bg-[#132F4C] rounded-lg p-6 border border-[#1E3A5F] text-center">
        <Hash className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No boards available</h3>
        <p className="text-gray-400 text-sm">Check back later for new discussion boards.</p>
      </div>
    );
  }

  const handleBoardClick = (board) => {
    router.push(`/${locale}/boards/${board.slug}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Popular Boards</h2>
        <Link href={`/${locale}/boards`}>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Boards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {boards.slice(0, 6).map(board => (
          <Card 
            key={board.id} 
            className="bg-[#132F4C] border-[#1E3A5F] hover:border-blue-500/50 transition-all duration-200 cursor-pointer group"
            onClick={() => handleBoardClick(board)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                {/* Board Icon */}
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-semibold text-white"
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

      {/* Show more button if there are more boards */}
      {boards.length > 6 && (
        <div className="text-center pt-4">
          <Link href={`/${locale}/boards`}>
            <Button variant="outline" className="border-[#1E3A5F] hover:border-blue-500">
              View All {boards.length} Boards
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
