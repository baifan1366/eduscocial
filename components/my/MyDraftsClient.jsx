'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import useAuth from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { useGetUserDrafts, useDeleteDraft } from '@/hooks/useDrafts';
import { useTranslations } from 'next-intl';

export default function MyDraftsClient() {
  const t = useTranslations('MyDrafts');
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [postType, setPostType] = useState('all');

  // Get user's drafts
  const { data: drafts, isLoading, isError, refetch } = useGetUserDrafts(postType, {
    enabled: isAuthenticated,
  });

  // Delete draft mutation
  const { mutate: deleteDraft } = useDeleteDraft({
    onSuccess: () => {
      toast.success(t('deleteSuccess'));
      refetch(); // Refresh the drafts list after deletion
    },
    onError: (error) => {
      toast.error(error.message || t('deleteError'));
    }
  });

  // Handle edit draft button click
  const handleEditDraft = (draft) => {
    const locale = window.location.pathname.split('/')[1];
    
    // Determine the route based on post type
    let route = `/newpost`;
    if (draft.post_type === 'picture') {
      route = `/newpost/picture`;
    } else if (draft.post_type === 'video') {
      route = `/newpost/video`;
    } else if (draft.post_type === 'poll') {
      route = `/newpost/poll`;
    }
    
    // Navigate to edit page with draft ID
    router.push(`/${locale}${route}?draft=${draft.id}`);
  };

  // Handle delete draft button click
  const handleDeleteDraft = (draftId) => {
    if (window.confirm(t('deleteConfirm'))) {
      deleteDraft(draftId);
    }
  };

  // Format draft post types for display
  const getPostTypeLabel = (type) => {
    switch(type) {
      case 'general': return 'Article';
      case 'picture': return 'Picture';
      case 'video': return 'Video';
      case 'poll': return 'Poll';
      default: return 'Article';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white mb-2 md:mb-0">{t('title')}</h1>
        
        {/* Filter buttons */}
        <div className="flex space-x-2">
          <Button 
            variant={postType === 'all' ? 'orange' : 'outline'} 
            onClick={() => setPostType('all')}
            size="sm"
          >
            All
          </Button>
          <Button 
            variant={postType === 'general' ? 'orange' : 'outline'} 
            onClick={() => setPostType('general')}
            size="sm"
          >
            Articles
          </Button>
          <Button 
            variant={postType === 'picture' ? 'orange' : 'outline'} 
            onClick={() => setPostType('picture')}
            size="sm"
          >
            Pictures
          </Button>
          <Button 
            variant={postType === 'video' ? 'orange' : 'outline'} 
            onClick={() => setPostType('video')}
            size="sm"
          >
            Videos
          </Button>
          <Button 
            variant={postType === 'poll' ? 'orange' : 'outline'} 
            onClick={() => setPostType('poll')}
            size="sm"
          >
            Polls
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : isError ? (
        <Card className="bg-red-900/20 border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-300">
              <AlertCircle size={18} />
              <p>{t('loadError')}</p>
            </div>
          </CardContent>
        </Card>
      ) : drafts && drafts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drafts.map(draft => (
            <Card key={draft.id} className="bg-[#132F4C] border-gray-700 hover:border-orange-600 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">
                      {getPostTypeLabel(draft.post_type)}
                    </div>
                    <CardTitle className="text-lg text-white line-clamp-2">
                      {draft.title || t('untitled')}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="text-sm text-gray-300 line-clamp-3 mb-4">
                  {draft.content || t('noContent')}
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>{formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}</span>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditDraft(draft)}
                      className="h-8 px-2 text-blue-400 hover:text-blue-300"
                    >
                      <Pencil size={16} />
                      <span className="ml-1">{t('edit')}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="h-8 px-2 text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-[#0A1929]/50 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText size={48} className="text-gray-500 mb-4" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">{t('noDrafts')}</h3>
            <p className="text-gray-400 mb-6">{t('noDraftsDesc')}</p>
            <Button 
              variant="orange"
              onClick={() => {
                const locale = window.location.pathname.split('/')[1];
                router.push(`/${locale}/newpost`);
              }}
            >
              {t('createNew')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 