'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import CreateBoardDialog from '@/components/boards/CreateBoardDialog';
import useGetBoardByUserId from '@/hooks/user/board/useGetBoardByUserId';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar({ isAuthenticated, userId }) {
  const t = useTranslations('HomePage');
  const { data, isLoading: boardsLoading, refetch: refetchBoards } = useGetBoardByUserId(userId);
  const boards = data?.boards || [];
  const [showAllBoards, setShowAllBoards] = useState(false);
  
  const MAX_VISIBLE_BOARDS = 5;
  const hasMoreBoards = boards.length > MAX_VISIBLE_BOARDS;
  const visibleBoards = showAllBoards ? boards : boards.slice(0, MAX_VISIBLE_BOARDS);

  return (
    <div className="space-y-6">
      {isAuthenticated ? (
        <>
          <div className="group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <h3 className="font-bold text-xl mb-3 text-white group-hover:text-blue-300 transition-colors duration-300">My Topics</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/my/topics" className="text-orange-400 hover:text-orange-300 transition-colors duration-200 font-medium flex items-center group/link">
                    <span className="group-hover/link:translate-x-1 transition-transform duration-200">View all topics</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <h3 className="font-bold text-xl mb-3 text-white group-hover:text-purple-300 transition-colors duration-300">My Cards</h3>
              <Link href="/my/cards" className="text-orange-400 hover:text-orange-300 transition-colors duration-200 font-medium flex items-center group/link">
                <span className="group-hover/link:translate-x-1 transition-transform duration-200">Create new card</span>
              </Link>
            </div>
          </div>
          <div className="group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <h3 className="font-bold text-xl mb-4 text-white group-hover:text-green-300 transition-colors duration-300">{t('myBoard')}</h3>

              <div className="space-y-3 mb-4">
                {boards && boards.length > 0 ? visibleBoards.map((board) => (
                  <div key={board.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300 group/item">
                    <span className="text-white font-medium group-hover/item:text-blue-300 transition-colors duration-200">{board.name}</span>
                    <Badge
                      variant={board.status === 'pending' ? 'pending' : board.status === 'approved' ? 'approved' : 'rejected'}
                      className="group-hover/item:scale-105 transition-transform duration-200"
                    >
                      {board.status === 'pending' ? t('pending') : board.status === 'approved' ? t('approved') : t('rejected')}
                    </Badge>
                  </div>
                )) : boardsLoading ? (
                  <div className="space-y-3">
                    <div className="bg-white/5 rounded-xl p-3 animate-pulse">
                      <div className="h-4 bg-white/10 rounded w-3/4"></div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 animate-pulse">
                      <div className="h-4 bg-white/10 rounded w-2/3"></div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 animate-pulse">
                      <div className="h-4 bg-white/10 rounded w-4/5"></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-300 text-center py-4">{t('noBoard')}</div>
                )}

                {hasMoreBoards && (
                  <button
                    className="w-full text-gray-300 hover:text-orange-300 transition-colors duration-200 text-sm mt-3 flex items-center justify-center cursor-pointer p-2 rounded-xl hover:bg-white/5"
                    onClick={() => setShowAllBoards(!showAllBoards)}
                  >
                    {showAllBoards ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        {t('viewLess')}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        {t('viewMore')}
                      </>
                    )}
                  </button>
                )}
              </div>

              <CreateBoardDialog onSuccess={() => refetchBoards()}>
                <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('createNewBoard')}
                </Button>
              </CreateBoardDialog>
            </div>
          </div>
        </>
      ) : (
        <div className="group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <h3 className="font-bold text-xl mb-3 text-white group-hover:text-orange-300 transition-colors duration-300">Join EduSocial</h3>
            <p className="mb-6 text-gray-300 group-hover:text-gray-200 transition-colors duration-300 leading-relaxed">Sign in to see personalized content and connect with your school community</p>
            <div className="flex flex-col gap-3">
              <Link href="/login" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25 text-center">
                Login
              </Link>
              <Link href="/register" className="border border-orange-500/50 text-orange-300 px-6 py-3 rounded-xl font-medium hover:bg-orange-500/10 hover:border-orange-500 transition-all duration-300 hover:scale-105 text-center">
                Register
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10">
          <h3 className="font-bold text-xl mb-4 text-white group-hover:text-pink-300 transition-colors duration-300">Trending Topics</h3>
          <ul className="space-y-3 text-gray-300">
            <li>
              <Link href="/topic/academic" className="flex items-center p-3 rounded-xl hover:bg-white/10 hover:text-orange-300 transition-all duration-300 group/link">
                <span className="group-hover/link:translate-x-1 transition-transform duration-200">Academic</span>
              </Link>
            </li>
            <li>
              <Link href="/topic/campus-life" className="flex items-center p-3 rounded-xl hover:bg-white/10 hover:text-orange-300 transition-all duration-300 group/link">
                <span className="group-hover/link:translate-x-1 transition-transform duration-200">Campus Life</span>
              </Link>
            </li>
            <li>
              <Link href="/topic/career" className="flex items-center p-3 rounded-xl hover:bg-white/10 hover:text-orange-300 transition-all duration-300 group/link">
                <span className="group-hover/link:translate-x-1 transition-transform duration-200">Career</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 