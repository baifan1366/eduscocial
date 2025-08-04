'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Sparkles, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BoardCard from '@/components/board/BoardCard';

export default function BoardsList({ boards, isLoading, error, locale = 'en', isAuthenticated = false }) {
  const t = useTranslations('HomePage');
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Popular Boards</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/10 rounded-2xl"></div>
                <div className="flex-1">
                  <div className="h-5 bg-white/10 rounded mb-2"></div>
                  <div className="h-3 bg-white/10 rounded w-2/3"></div>
                </div>
              </div>
              <div className="h-3 bg-white/10 rounded mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-3/4 mb-4"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-3 bg-white/10 rounded w-8"></div>
                  <div className="h-3 bg-white/10 rounded w-8"></div>
                  <div className="h-3 bg-white/10 rounded w-8"></div>
                </div>
                <div className="h-3 bg-white/10 rounded w-12"></div>
              </div>
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
      <div className="grid grid-cols-1 gap-4">
        {boards.slice(0, 6).map(board => (
          <BoardCard
            key={board.id}
            board={board}
            locale={locale}
            isAuthenticated={isAuthenticated}
            viewMode="list"
            showFollowButton={true}
          />
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
