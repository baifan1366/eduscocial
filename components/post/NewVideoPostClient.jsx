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
import { Image, Camera, FileText, Info, Edit, ChevronDown, Upload, X, Video, Play } from 'lucide-react';

export default function NewVideoPostClient() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('影片');
    const [selectedBoard, setSelectedBoard] = useState('点此选择文章看板');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedVideo, setSelectedVideo] = useState(null);

    const { mutate: createPost, isPending: isSubmitting } = useCreatePost();
    const { mutate: saveDraft, isPending: isSavingDraft } = useSaveDraft();

    const tabs = ['文章', '图片', '影片', '发起投票'];

    const handleVideoUpload = (event) => {
        const file = event.target.files[0];

        if (!file) return;

        if (!file.type.startsWith('video/')) {
            toast.error('请选择视频文件');
            return;
        }

        // Check file size (max 100MB)
        if (file.size > 100 * 1024 * 1024) {
            toast.error('视频文件大小不能超过100MB');
            return;
        }

        const videoData = {
            file,
            url: URL.createObjectURL(file),
            name: file.name,
            size: file.size
        };

        setSelectedVideo(videoData);
    };

    const removeVideo = () => {
        if (selectedVideo) {
            URL.revokeObjectURL(selectedVideo.url);
            setSelectedVideo(null);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleSubmit = () => {
        if (!title.trim()) {
            toast.error('请输入标题');
            return;
        }

        if (!selectedVideo) {
            toast.error('请上传视频文件');
            return;
        }

        const postData = {
            title: title.trim(),
            content: content.trim(),
            type: '影片',
            board: selectedBoard !== '点此选择文章看板' ? selectedBoard : null,
            video: selectedVideo.file
        };

        createPost(postData, {
            onSuccess: (data) => {
                toast.success('发布成功！');
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
        // Clean up object URL
        if (selectedVideo) {
            URL.revokeObjectURL(selectedVideo.url);
        }
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
                                    <Video className="w-4 h-4 text-white" />
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
                                    标题
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
                                placeholder="请输入标题"
                                maxLength={80}
                                className="w-full"
                            />
                            <div className="text-xs text-muted-foreground mt-1">({title.length}/80)</div>
                        </div>

                        {/* 视频上传区域 */}
                        <div className="mb-4">
                            <Label className="text-white font-medium mb-2 block">
                                视频上传
                            </Label>
                            {!selectedVideo ? (
                                <div className="border-2 border-dashed border-muted-foreground rounded-lg p-6 text-center">
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={handleVideoUpload}
                                        className="hidden"
                                        id="video-upload"
                                    />
                                    <label htmlFor="video-upload" className="cursor-pointer">
                                        <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-muted-foreground">点击上传视频或拖拽视频到此处</p>
                                        <p className="text-xs text-muted-foreground mt-1">支持 MP4、AVI、MOV 格式，最大100MB</p>
                                    </label>
                                </div>
                            ) : (
                                <div className="border border-muted-foreground rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="relative">
                                                <video
                                                    src={selectedVideo.url}
                                                    className="w-16 h-16 object-cover rounded"
                                                    muted
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
                                                    <Play className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-medium">{selectedVideo.name}</p>
                                                <p className="text-muted-foreground text-xs">{formatFileSize(selectedVideo.size)}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={removeVideo}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
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
                                placeholder="为你的视频添加描述..."
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
                  disabled={isSubmitting || !title.trim() || !content.trim()}
                >
                  {isSubmitting ? '发布中...' : '下一步'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
            </div>
        </div>
    );
}