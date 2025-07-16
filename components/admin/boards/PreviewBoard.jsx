'use client';

import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Button } from '../../ui/button';
import { Icon } from '@iconify/react';
import { VenetianMask, Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { useState } from 'react';

export default function PreviewBoard({ trigger, boardData }) {
  const t = useTranslations('Board');
  const [isOpen, setIsOpen] = useState(false);
  const [currentBoardData, setCurrentBoardData] = useState({});

  //if bg too dark, text white, otherwise text black
  const isDarkColor = (color) => {
    if (!color || typeof color !== 'string') return false;
    const rgb = color.match(/^#([0-9a-f]{6})$/i);
    if (!rgb) return false;
    const r = parseInt(rgb[1].slice(0, 2), 16);
    const g = parseInt(rgb[1].slice(2, 4), 16);
    const b = parseInt(rgb[1].slice(4, 6), 16);
    return r * 0.299 + g * 0.587 + b * 0.114 < 186;
  };
  
  // 从boardData中解构所需数据
  const { 
    boardName, 
    description, 
    color, 
    categoryIcon, 
    visibility, 
    anonymousPost 
  } = currentBoardData || {};

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (open) {
      if (typeof boardData === 'function') {
        setCurrentBoardData(boardData());
      } else {
        setCurrentBoardData(boardData || {});
      }
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button type="button" variant="orange">
            {t('previewBoard')}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[800px] p-0 border-none shadow-lg">
        <div className="flex h-[500px] bg-background rounded-md overflow-hidden">          
          {/* 中间内容区 */}
          <div className="flex-1 flex flex-col">
            {/* 顶部图片区域 */}
            <div 
              className="h-[150px] flex items-center justify-center" 
              style={{ backgroundColor: color || '#ff80ab' }}
            >
            </div>
            
            {/* 板块名称、通知和关注区域 */}
            <div className="border-b p-4 flex items-center flex-col gap-2 w-full">
                <div className="flex items-center justify-end w-full">
                    <div className="flex items-center">
                        {categoryIcon && <Icon icon={categoryIcon} className="text-xl" />}
                        <span className="ml-2 font-bold text-lg truncate max-w-[100%]">{boardName || t('boardNamePlaceholder')}</span>
                    </div>
                    <div className="ml-auto flex items-center space-x-2">
                        {anonymousPost && (
                            <div className="text-sm text-muted-foreground text-left w-full flex items-center">                        
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <VenetianMask className="text-green-500 w-4 h-4 hover:text-green-600" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {t('anonymousPostAllowed')}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        )} 
                        <Button variant="ghost" size="sm">
                            <Bell className="text-xl" />
                        </Button>
                        <Button variant="secondary" size="sm">
                            {visibility === 'public' ? t('public') : t('private')}
                        </Button>
                        <Button variant="secondary" size="sm">
                            {t('following') || "Following"}
                        </Button>
                    </div>
                </div>           
            </div>
            
            {/* 选项卡导航 */}
            <div className="flex border-b">
              <div className="px-6 py-3 font-medium border-b-2 border-primary">
                {t('trending') || "Trending"}
              </div>
              <div className="px-6 py-3 text-muted-foreground">
                {t('latest') || "Latest"}
              </div>
              <div className="px-6 py-3 text-muted-foreground">
                {t('rule') || "Rule"}
              </div>
            </div>
            
            {/* 帖子区域 */}
            <div className="flex-1 p-4 bg-background overflow-y-auto">
                <div className="flex items-center justify-center h-full">
                    {t('noPostsYet')}
                </div>
            </div>
          </div>
          
          {/* 右上角信息区 */}
          <div className="w-[250px] border-l p-4 bg-secondary/5">
            <div className="font-bold text-lg mb-2 flex items-center gap-2">
                {categoryIcon && <Icon icon={categoryIcon} className="text-xl" />}
                {boardName || t('boardNamePlaceholder')}
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <span>0 {t('followers')}</span>
              <span>•</span>
              <span>0 {t('discussions')}</span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {description || t('descriptionPlaceholder')}
            </div>
            
            <div className="mt-6 space-y-2 text-sm border-t pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('posts')}</span>
                <span>0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('members')}</span>
                <span>0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('createdAt')}</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm font-medium">{t('rules')}</div>
              <span className="text-sm text-blue-500 hover:underline">
                {t('viewBoardRules')}
              </span>
            </div>

            <div className="mt-4">
              <Button className="w-full" variant="outline" style={{ backgroundColor: color || '#ffffff', color: isDarkColor(color) ? '#ffffff' : '#000000' }}>
                {t('post') || "Post"}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
