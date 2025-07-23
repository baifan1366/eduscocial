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
    <div className="space-y-4">
      {isAuthenticated ? (
        <>
          <div className="bg-[#132F4C] rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2 text-white">My Topics</h3>
            <ul className="space-y-1">
              <li><Link href="/my/topics" className="text-[#FF7D00] hover:underline">View all topics</Link></li>
            </ul>
          </div>
          <div className="bg-[#132F4C] rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2 text-white">My Cards</h3>
            <Link href="/my/cards" className="text-[#FF7D00] hover:underline">Create new card</Link>
          </div>
          <div className="bg-[#132F4C] rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2 text-white">{t('myBoard')}</h3>
            {/*map data and display board name and status in badge*/}
            <div className="space-y-2 mb-2">
              {boards && boards.length > 0 ? visibleBoards.map((board) => (
                <div key={board.id} className="flex justify-between items-center">
                  <span>{board.name}</span>
                  <Badge variant={board.status === 'pending' ? 'pending' : board.status === 'approved' ? 'approved' : 'rejected'}>                                    
                    {board.status === 'pending' ? t('pending') : board.status === 'approved' ? t('approved') : t('rejected')}
                  </Badge>
                </div>
              )) : boardsLoading ? (
                /*3 row loading*/
                <div className="space-y-2">
                  <Skeleton className="w-full h-6" />
                  <Skeleton className="w-full h-6" />
                  <Skeleton className="w-full h-6" />
                </div>
              ) : (
                <div className="text-gray-300">{t('noBoard')}</div>
              )}
              
              {hasMoreBoards && (
                <div 
                  className="w-full text-gray-300 transition-colors text-sm hover:text-[#FF7D00] mt-2 flex items-center justify-center cursor-pointer" 
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
                </div>
              )}
            </div>
            <CreateBoardDialog onSuccess={() => refetchBoards()}>
              <Button variant="orange" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                {t('createNewBoard')}
              </Button>
            </CreateBoardDialog>
          </div>
        </>
      ) : (
        <div className="bg-[#132F4C] rounded-lg p-4">
          <h3 className="font-bold text-lg mb-2 text-white">Join EduSocial</h3>
          <p className="mb-4 text-gray-300">Sign in to see personalized content and connect with your school community</p>
          <div className="space-x-2">
            <Link href="/login" className="bg-[#FF7D00] text-white px-4 py-2 rounded-md hover:bg-[#FF7D00]/90 transition-colors">
              Login
            </Link>
            <Link href="/register" className="border border-[#FF7D00] text-[#FF7D00] px-4 py-2 rounded-md hover:bg-[#FF7D00]/10 transition-colors">
              Register
            </Link>
          </div>
        </div>
      )}
      <div className="bg-[#132F4C] rounded-lg p-4">
        <h3 className="font-bold text-lg mb-2 text-white">Trending Topics</h3>
        <ul className="space-y-1 text-gray-300">
          <li><Link href="/topic/academic" className="hover:text-[#FF7D00]">Academic</Link></li>
          <li><Link href="/topic/campus-life" className="hover:text-[#FF7D00]">Campus Life</Link></li>
          <li><Link href="/topic/career" className="hover:text-[#FF7D00]">Career</Link></li>
        </ul>
      </div>
    </div>
  );
} 