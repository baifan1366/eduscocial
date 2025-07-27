'use client';

import { useState, useEffect } from 'react';
import useAuth from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useCreatePost, useSaveDraft, useGetDraft } from '@/hooks/useNewPost';
import { useGetDraftById } from '@/hooks/useDrafts';
import DraftSelectionDropdown from './DraftSelectionDropdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Image, Camera, FileText, Info, Edit, ChevronDown, Save, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function NewPostClient() {
  const t = useTranslations('NewPost');
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('general');
  const [selectedBoard, setSelectedBoard] = useState(t('selectBoard'));
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Check for draft ID in URL
  const searchParams = useSearchParams();
  const draftIdFromUrl = searchParams?.get('draft');

  // Fetch specific draft by ID if present in URL
  const { data: draftById, isLoading: isDraftByIdLoading } = useGetDraftById(draftIdFromUrl, {
    enabled: !!draftIdFromUrl && isAuthenticated,
    onSuccess: (data) => {
      if (data && !draftLoaded) {
        setTitle(data.title || '');
        setContent(data.content || '');
        if (data.post_type) {
          setActiveTab(data.post_type);
        }
        if (data.template) {
          setSelectedBoard(data.template);
        }
        setDraftLoaded(true);
        setLastSaved(new Date(data.updated_at));
        toast.info(t('draftLoaded'), {
          description: t('continueDraft'),
          duration: 3000,
        });
      }
    }
  });

  // Fetch latest draft if no specific draft is requested
  const { data: draft, isLoading: isDraftLoading } = useGetDraft(activeTab, {
    enabled: isAuthenticated && !draftLoaded && !draftIdFromUrl,
    onSuccess: (data) => {
      if (data && !draftLoaded) {
        setTitle(data.title || '');
        setContent(data.content || '');
        if (data.template) {
          setSelectedBoard(data.template);
        }
        setDraftLoaded(true);
        setLastSaved(new Date(data.updated_at));
        toast.info(t('draftLoaded'), {
          description: t('continueDraft'),
          duration: 3000,
        });
      }
    }
  });

  const { mutate: createPost, isPending: isSubmitting } = useCreatePost();
  const { mutate: saveDraft, isPending: isSavingDraft } = useSaveDraft();

  const tabs = [t('article'), t('picture'), t('video'), t('poll')];

  // Auto-save draft at regular intervals if enabled
  useEffect(() => {
    let autoSaveInterval;
    if (autoSaveEnabled && (title.trim() || content.trim())) {
      autoSaveInterval = setInterval(() => {
        handleSaveDraft(true);
      }, 30000); // Auto-save every 30 seconds
    }
    return () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    };
  }, [autoSaveEnabled, title, content, selectedBoard]);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error(t('titleRequired'));
      return;
    }

    if (!content.trim()) {
      toast.error(t('contentRequired'));
      return;
    }

    const postData = {
      title: title.trim(),
      content: content.trim(),
      type: activeTab,
      board: selectedBoard !== t('selectBoard') ? selectedBoard : null,
    };

    createPost(postData, {
      onSuccess: () => {
        toast.success(t('publishSuccess'));
        router.push('/my');
      },
      onError: (error) => {
        console.error('Error creating post:', error);
        toast.error(t('publishError'));
      }
    });
  };

  const handleSaveDraft = (silent = false) => {
    if (!title.trim() && !content.trim()) {
      // Don't save empty drafts
      return;
    }

    const draftData = {
      title: title.trim(),
      content: content.trim(),
      type: activeTab,
      template: selectedBoard !== t('selectBoard') ? selectedBoard : null,
    };

    saveDraft(draftData, {
      onSuccess: (data) => {
        setLastSaved(new Date());
        if (!silent) {
          toast.success(t('draftSaved'));
        }
      },
      onError: (error) => {
        console.error('Error saving draft:', error);
        if (!silent) {
          toast.error(t('draftSaveError'));
        }
      }
    });
  };

  const handleCancel = () => {
    router.back();
  };

  const handleNext = () => {
    if (!title.trim()) {
      toast.error(t('titleRequired'));
      return;
    }

    if (!content.trim()) {
      toast.error(t('contentRequired'));
      return;
    }

    // For now, just submit the post
    handleSubmit();
  };

  const navigateToTab = (tab) => {
    const tabRoutes = {
      [t('article')]: '/newpost',
      [t('picture')]: '/newpost/picture',
      [t('video')]: '/newpost/video',
      [t('poll')]: '/newpost/poll'
    };

    const locale = window.location.pathname.split('/')[1];
    router.push(`/${locale}${tabRoutes[tab]}`);
  };

  return (
    <div className="min-h-screen bg-[#0A1929]">
      {/* 顶部标签栏 */}
      <div className="bg-card border-b border-border bg-[#0A1929] mx-2">
        <div className="flex bg-[#0A1929]">
          {tabs.map((tab) => (
            <Button
              key={tab}
              variant="ghost"
              onClick={() => navigateToTab(tab)}
              className={`px-6 py-3 text-sm font-medium rounded-none transition-colors
                        ${activeTab === tab
                  ? 'text-[#FF7D00] hover:bg-[#132F4C] transition-colors outline-none relative'
                  : 'text-white border-transparent hover:text-[#FF7D00] hover:bg-[#132F4C] transition-colors outline-none relative'
                }`}
            >
              {tab}
            </Button>
          ))}
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-4xl mx-auto p-4 ">
        {(isDraftLoading || isDraftByIdLoading) && (
          <div className="mb-4 p-2 bg-blue-900/30 text-blue-200 rounded flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{t('loadingDraft')}</span>
          </div>
        )}
        
        {/* Draft Selection Dropdown */}
        {isAuthenticated && !isDraftLoading && !isDraftByIdLoading && !draftLoaded && (
          <DraftSelectionDropdown activeTab={activeTab} onDraftSelect={(draft) => {
            if (draft) {
              setTitle(draft.title || '');
              setContent(draft.content || '');
              if (draft.template) {
                setSelectedBoard(draft.template);
              }
              setDraftLoaded(true);
              setLastSaved(new Date(draft.updated_at));
            }
          }} />
        )}
        
        {/* 顶部控制区域 */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Select value={selectedBoard} onValueChange={setSelectedBoard}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={t('selectBoard')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={t('selectBoard')}>{t('selectBoard')}</SelectItem>
                    <SelectItem value={t('studyDiscussion')}>{t('studyDiscussion')}</SelectItem>
                    <SelectItem value={t('lifeSharing')}>{t('lifeSharing')}</SelectItem>
                    <SelectItem value={t('techExchange')}>{t('techExchange')}</SelectItem>
                    <SelectItem value={t('helpQA')}>{t('helpQA')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <span className="text-sm">{t('postRules')}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-5 h-5 p-0 rounded-full bg-[#0A1929]hover:bg-accent"
                    >
                      <Info className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p>{t('cardSelectHint')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* 用户信息 */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-[#FF7D00] rounded-full flex items-center justify-center">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <FileText className="w-4 h-4 text-white" />
                )}
              </div>
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">
                          {user?.name || user?.username || t('selectIdentity')}
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem>
                      <span>{user?.name || user?.username || t('defaultIdentity')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span>{t('anonymousPost')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span>{t('studentIdentity')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date().toLocaleDateString(t('locale'), {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>

            {/* 标题输入框 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="title" className="text-white font-medium">
                  {t('title')}
                </Label>
                <Button variant="ghost" size="sm" className="p-1 h-auto">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('enterTitle')}
                maxLength={80}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground mt-1">({title.length}/80)</div>
            </div>

            {/* 内容输入框 */}
            <div className="mb-4">
              <Label htmlFor="content" className="text-white font-medium mb-2 block">
                {t('content')}
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('enterContent')}
                className="min-h-[256px] resize-none"
              />
            </div>

            {/* 显示上次保存时间 */}
            {lastSaved && (
              <div className="text-xs text-muted-foreground text-right">
                {t('lastSaved')}: {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 底部工具栏 */}
        <Card >
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="p-2">
                  <Image className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2">
                  <Camera className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2">
                  <FileText className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2"
                  onClick={() => handleSaveDraft(false)}
                  disabled={isSavingDraft || (!title.trim() && !content.trim())}
                >
                  <Save className="w-5 h-5" />
                  <span className="ml-1">{t('saveDraft')}</span>
                </Button>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  {t('cancel')}
                </Button>
                <Button
                  variant="orange"
                  onClick={handleNext}
                  disabled={isSubmitting || !title.trim() || !content.trim()}
                >
                  {isSubmitting ? t('publishing') : t('nextStep')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}