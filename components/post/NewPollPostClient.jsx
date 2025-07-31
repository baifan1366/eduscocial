'use client';

import { useState } from 'react';
import useAuth from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCreatePost, useSaveDraft } from '@/hooks/useNewPost';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Image, Camera, FileText, Info, Edit, ChevronDown, Plus, X, BarChart3 } from 'lucide-react';

export default function NewPollPostClient() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('发起投票');
    const [selectedBoard, setSelectedBoard] = useState('点此选择文章看板');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [allowMultiple, setAllowMultiple] = useState(false);
    const [pollDuration, setPollDuration] = useState('7');

    const { mutate: createPost, isPending: isSubmitting } = useCreatePost();
    const { mutate: saveDraft, isPending: isSavingDraft } = useSaveDraft();

    const tabs = ['文章', '图片', '影片', '发起投票'];

    const addPollOption = () => {
        if (pollOptions.length < 10) {
            setPollOptions([...pollOptions, '']);
        } else {
            toast.error('最多只能添加10个选项');
        }
    };

    const removePollOption = (index) => {
        if (pollOptions.length > 2) {
            setPollOptions(pollOptions.filter((_, i) => i !== index));
        } else {
            toast.error('至少需要2个选项');
        }
    };

    const updatePollOption = (index, value) => {
        const newOptions = [...pollOptions];
        newOptions[index] = value;
        setPollOptions(newOptions);
    };

    const handleSubmit = () => {
        if (!title.trim()) {
            toast.error('请输入标题');
            return;
        }

        const validOptions = pollOptions.filter(option => option.trim());
        if (validOptions.length < 2) {
            toast.error('至少需要2个有效选项');
            return;
        }

        const postData = {
            title: title.trim(),
            content: content.trim(),
            type: '发起投票',
            board: selectedBoard !== '点此选择文章看板' ? selectedBoard : null,
            poll: {
                options: validOptions,
                allowMultiple,
                duration: parseInt(pollDuration)
            }
        };

        createPost(postData, {
            onSuccess: (data) => {
                toast.success('投票发布成功！');
                // Redirect to the new post using slug if available, otherwise use ID
                const postIdentifier = data.slug || data.id;
                const locale = window.location.pathname.split('/')[1];
                router.push(`/${locale}/home/${postIdentifier}`);
            },
            onError: (error) => {
                console.error('Error creating post:', error);
                toast.error('发布失败，请重试');
            }
        });
    };

    const handleCancel = () => {
        router.back();
    };

    const handleNext = () => {
        handleSubmit();
    };

    const navigateToTab = (tab) => {
        const tabRoutes = {
            '文章': '/newpost',
            '图片': '/newpost/picture',
            '影片': '/newpost/video',
            '发起投票': '/newpost/poll'
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
            <div className="max-w-4xl mx-auto p-4">
                {/* 顶部控制区域 */}
                <Card className="mb-4">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                                <Select value={selectedBoard} onValueChange={setSelectedBoard}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="点此选择文章看板" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="点此选择文章看板">点此选择文章看板</SelectItem>
                                        <SelectItem value="学习讨论">学习讨论</SelectItem>
                                        <SelectItem value="生活分享">生活分享</SelectItem>
                                        <SelectItem value="技术交流">技术交流</SelectItem>
                                        <SelectItem value="求助问答">求助问答</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2 text-muted-foreground">
                <span className="text-sm">发文规则</span>
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
                    <p>选择卡牌可在下一步文章设定<br />开启私讯功能！</p>
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
                                    <BarChart3 className="w-4 h-4 text-white" />
                                )}
                            </div>
                            <div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-white font-medium">
                                                    {user?.name || user?.username || '选择发文身份'}
                                                </span>
                                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuItem>
                                            <span>{user?.name || user?.username || '默认身份'}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <span>匿名发布</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <span>学生身份</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {new Date().toLocaleDateString('zh-CN', {
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
                                    投票标题
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
                                placeholder="请输入投票标题"
                                maxLength={80}
                                className="w-full"
                            />
                            <div className="text-xs text-muted-foreground mt-1">({title.length}/80)</div>
                        </div>

                        {/* 投票选项 */}
                        <div className="mb-4">
                            <Label className="text-white font-medium mb-2 block">
                                投票选项
                            </Label>
                            <div className="space-y-2">
                                {pollOptions.map((option, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <div className="flex-1">
                                            <Input
                                                value={option}
                                                onChange={(e) => updatePollOption(index, e.target.value)}
                                                placeholder={`选项 ${index + 1}`}
                                                className="w-full"
                                            />
                                        </div>
                                        {pollOptions.length > 2 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removePollOption(index)}
                                                className="p-2"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    onClick={addPollOption}
                                    className="w-full"
                                    disabled={pollOptions.length >= 10}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    添加选项
                                </Button>
                            </div>
                        </div>

                        {/* 投票设置 */}
                        <div className="mb-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-white font-medium">
                                    允许多选
                                </Label>
                                <Switch
                                    checked={allowMultiple}
                                    onCheckedChange={setAllowMultiple}
                                />
                            </div>
                            
                            <div>
                                <Label className="text-white font-medium mb-2 block">
                                    投票持续时间
                                </Label>
                                <Select value={pollDuration} onValueChange={setPollDuration}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1天</SelectItem>
                                        <SelectItem value="3">3天</SelectItem>
                                        <SelectItem value="7">7天</SelectItem>
                                        <SelectItem value="14">14天</SelectItem>
                                        <SelectItem value="30">30天</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* 内容输入框 */}
                        <div className="mb-4">
                            <Label htmlFor="content" className="text-white font-medium mb-2 block">
                                描述 (可选)
                            </Label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="为你的投票添加描述..."
                                className="min-h-[128px] resize-none"
                            />
                        </div>
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
              </div>
              <div className="flex items-center space-x-3">
                                <Button
                                    variant="ghost"
                                    onClick={handleCancel}
                                    disabled={isSubmitting}
                                >
                                    取消
                                </Button>
                                <Button
                                    variant="orange"
                                    onClick={handleNext}
                                    disabled={isSubmitting || !title.trim() || pollOptions.filter(opt => opt.trim()).length < 2}
                                >
                                    {isSubmitting ? '发布中...' : '发布投票'}
                                </Button>
                            </div>
            </div>
          </CardContent>
        </Card>
            </div>
        </div>
    );
}