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
import { Image, Camera, FileText, Info, Edit, ChevronDown, Upload, X } from 'lucide-react';

export default function NewPicturePostClient() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('图片');
    const [selectedBoard, setSelectedBoard] = useState('点此选择文章看板');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedImages, setSelectedImages] = useState([]);

    const { mutate: createPost, isPending: isSubmitting } = useCreatePost();
    const { mutate: saveDraft, isPending: isSavingDraft } = useSaveDraft();

    const tabs = ['文章', '图片', '影片', '发起投票'];

    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files);
        const validImages = files.filter(file => file.type.startsWith('image/'));
        
        if (validImages.length !== files.length) {
            toast.error('请只选择图片文件');
        }

        const newImages = validImages.map(file => ({
            file,
            url: URL.createObjectURL(file),
            id: Math.random().toString(36).substr(2, 9)
        }));

        setSelectedImages(prev => [...prev, ...newImages]);
    };

    const removeImage = (imageId) => {
        setSelectedImages(prev => {
            const imageToRemove = prev.find(img => img.id === imageId);
            if (imageToRemove) {
                URL.revokeObjectURL(imageToRemove.url);
            }
            return prev.filter(img => img.id !== imageId);
        });
    };

    const handleSubmit = () => {
        if (!title.trim()) {
            toast.error('请输入标题');
            return;
        }

        if (selectedImages.length === 0) {
            toast.error('请至少上传一张图片');
            return;
        }

        const postData = {
            title: title.trim(),
            content: content.trim(),
            type: '图片',
            board: selectedBoard !== '点此选择文章看板' ? selectedBoard : null,
            images: selectedImages.map(img => img.file)
        };

        createPost(postData, {
            onSuccess: () => {
                toast.success('发布成功！');
                router.push('/my');
            },
            onError: (error) => {
                console.error('Error creating post:', error);
                toast.error('发布失败，请重试');
            }
        });
    };

    const handleCancel = () => {
        // Clean up object URLs
        selectedImages.forEach(img => URL.revokeObjectURL(img.url));
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
                                    <Image className="w-4 h-4 text-white" />
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

                        {/* 图片上传区域 */}
                        <div className="mb-4">
                            <Label className="text-white font-medium mb-2 block">
                                图片上传
                            </Label>
                            <div className="border-2 border-dashed border-muted-foreground rounded-lg p-6 text-center">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label htmlFor="image-upload" className="cursor-pointer">
                                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-muted-foreground">点击上传图片或拖拽图片到此处</p>
                                    <p className="text-xs text-muted-foreground mt-1">支持 JPG、PNG、GIF 格式</p>
                                </label>
                            </div>
                            
                            {/* 已选择的图片预览 */}
                            {selectedImages.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {selectedImages.map((image) => (
                                        <div key={image.id} className="relative">
                                            <img
                                                src={image.url}
                                                alt="Preview"
                                                className="w-full h-24 object-cover rounded-lg"
                                            />
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                                                onClick={() => removeImage(image.id)}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
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
                                placeholder="为你的图片添加描述..."
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
                    disabled={isSubmitting || !title.trim() || selectedImages.length === 0}
                    >
                    {isSubmitting ? '发布中...' : '发布'}
                    </Button>
                </div>
            </div>
          </CardContent>
        </Card>
            </div>
        </div>
    );
}