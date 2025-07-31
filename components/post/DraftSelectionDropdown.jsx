'use client';

import { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, FileText, FilePlus, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useGetUserDrafts } from '@/hooks/useDrafts';

export default function DraftSelectionDropdown({ activeTab = 'general', onDraftSelect }) {
  const t = useTranslations('NewPost');
  const [isOpen, setIsOpen] = useState(false);
  const postType = activeTab === 'article' ? 'general' : activeTab;

  // Fetch user drafts of the current type
  const { data: drafts, isLoading, isError } = useGetUserDrafts(postType, {
    enabled: true,
    staleTime: 30000, // 30 seconds
  });

  // Create new post without selecting a draft
  const handleCreateNew = () => {
    onDraftSelect(null);
    setIsOpen(false);
  };

  // Select a specific draft to continue editing
  const handleSelectDraft = (draft) => {
    onDraftSelect(draft);
    setIsOpen(false);
  };

  return (
    <div className="mb-4 p-4 bg-[#132F4C]/80 border border-blue-800 rounded-lg">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-white mb-1">{t('draftAvailable')}</h3>
          <p className="text-sm text-gray-300">{t('draftChooseOption')}</p>
        </div>

        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-blue-600 hover:border-blue-500">
              <span>{t('draftOptions')}</span>
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-[#0A1929] border border-gray-700 text-white" align="end">
            <DropdownMenuItem 
              className="cursor-pointer hover:bg-[#132F4C] gap-2 text-[#FF7D00]"
              onClick={handleCreateNew}
            >
              <FilePlus className="h-4 w-4" />
              <span>{t('createNewPost')}</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-gray-700" />
            
            {isLoading ? (
              <div className="text-center py-4 text-sm text-gray-400 flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                <span>{t('loadingDrafts')}</span>
              </div>
            ) : isError ? (
              <div className="text-center py-4 text-sm text-red-400 flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{t('errorLoadingDrafts')}</span>
              </div>
            ) : drafts && drafts.length > 0 ? (
              <>
                <div className="px-2 py-1 text-xs text-gray-400">{t('continueWithDraft')}</div>
                {drafts.map((draft) => (
                  <DropdownMenuItem 
                    key={draft.id} 
                    className="cursor-pointer hover:bg-[#132F4C] flex flex-col items-start px-2 py-2"
                    onClick={() => handleSelectDraft(draft)}
                  >
                    <div className="flex items-center gap-2 text-blue-300 w-full text-sm">
                      <FileText className="h-4 w-4" />
                      <span className="truncate flex-1 font-medium">
                        {draft.title || t('untitledDraft')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 ml-6 mt-1">
                      {t('lastSaved')}: {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            ) : (
              <div className="text-center py-4 text-sm text-gray-400">
                {t('noDraftsAvailable')}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 