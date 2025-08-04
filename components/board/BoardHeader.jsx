'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Globe,
  Lock,
  Users,
  MessageCircle,
  Eye,
  Bell,
  BellOff,
  UserPlus,
  UserMinus,
  Share2,
  MoreHorizontal,
  Sparkles,
  Shield,
  MessageSquare,
  Plane,
  Laptop,
  BookOpen,
  GraduationCap,
  Briefcase,
  Coffee,
  Music,
  Camera,
  Gamepad2,
  Palette,
  Code,
  Zap,
  Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBoardFollow } from '@/hooks/useBoardFollow';
import { cn } from '@/lib/utils';

// Icon mapping for board icons
const ICON_MAP = {
  'chat-dots': MessageSquare,
  'airplane': Plane,
  'laptop-code': Laptop,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  'briefcase': Briefcase,
  'coffee': Coffee,
  'music': Music,
  'camera': Camera,
  'gamepad': Gamepad2,
  'palette': Palette,
  'code': Code,
  'zap': Zap,
  'message-circle': MessageCircle,
  'users': Users,
  'globe': Globe,
  'sparkles': Sparkles,
  'megaphone': Megaphone
};

export default function BoardHeader({
  board, 
  locale, 
  isAuthenticated = false,
  onBack 
}) {
  const t = useTranslations('BoardDetail');
  const router = useRouter();
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  
  const { 
    isFollowing, 
    isLoading: isFollowLoading, 
    toggleFollow,
    error: followError 
  } = useBoardFollow(board?.slug);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleFollowClick = () => {
    if (!isAuthenticated) {
      router.push(`/${locale}/auth/login`);
      return;
    }
    toggleFollow();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: board.name,
          text: board.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const toggleNotifications = () => {
    setIsNotificationEnabled(!isNotificationEnabled);
    // TODO: Implement notification toggle API call
  };

  if (!board) return null;

  const isPrivate = board.visibility === 'private';
  const canAccess = !isPrivate || isFollowing;

  // Get the icon component
  const IconComponent = board.icon && ICON_MAP[board.icon] ? ICON_MAP[board.icon] : null;

  return (
    <div className="relative">
      {/* Background gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-r opacity-10 rounded-t-lg"
        style={{ 
          background: `linear-gradient(135deg, ${board.color || '#1E3A5F'} 0%, ${board.color || '#1E3A5F'}80 100%)`
        }}
      />
      
      <Card className="relative bg-[#132F4C]/95 backdrop-blur-sm border-[#1E3A5F] overflow-hidden">
        <div className="p-6">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-gray-400 hover:text-white hover:bg-[#1E3A5F]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#132F4C] border-[#1E3A5F]">
                <DropdownMenuItem onClick={handleShare} className="text-gray-300 hover:text-white">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Board
                </DropdownMenuItem>
                {isAuthenticated && isFollowing && (
                  <DropdownMenuItem onClick={toggleNotifications} className="text-gray-300 hover:text-white">
                    {isNotificationEnabled ? (
                      <><BellOff className="w-4 h-4 mr-2" />Turn off notifications</>
                    ) : (
                      <><Bell className="w-4 h-4 mr-2" />Turn on notifications</>
                    )}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Board Info */}
          <div className="flex items-start gap-4 mb-6">
            {/* Board Icon */}
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg flex-shrink-0"
              style={{ 
                backgroundColor: board.color || '#1E3A5F',
                boxShadow: `0 8px 32px ${board.color || '#1E3A5F'}40`
              }}
            >
              {IconComponent ? (
                <IconComponent className="w-8 h-8" />
              ) : (
                board.name.charAt(0).toUpperCase()
              )}
            </div>

            {/* Board Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-white truncate">
                  {board.name}
                </h1>
                {board.featured && (
                  <Sparkles className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                )}
                {board.verified && (
                  <Shield className="w-5 h-5 text-blue-400 flex-shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge 
                  variant={isPrivate ? 'secondary' : 'default'}
                  className={cn(
                    "text-sm",
                    isPrivate 
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30" 
                      : "bg-green-500/20 text-green-300 border-green-500/30"
                  )}
                >
                  {isPrivate ? (
                    <><Lock className="w-4 h-4 mr-1" />Private</>
                  ) : (
                    <><Globe className="w-4 h-4 mr-1" />Public</>
                  )}
                </Badge>
                
                {isFollowing && (
                  <Badge className="text-sm bg-blue-500/20 text-blue-300 border-blue-500/30">
                    Following
                  </Badge>
                )}
              </div>

              <p className={cn(
                "text-gray-400 text-sm mb-4 line-clamp-2",
                !canAccess && "blur-sm"
              )}>
                {board.description || 'No description available'}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{board.followersCount || 0} followers</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{board.postsCount || 0} posts</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{board.view_count || 0} views</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isAuthenticated && (
                <>
                  <Button
                    variant={isFollowing ? "secondary" : "default"}
                    onClick={handleFollowClick}
                    disabled={isFollowLoading}
                    className={cn(
                      "transition-all duration-200",
                      isFollowing 
                        ? "bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30" 
                        : "bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30"
                    )}
                  >
                    {isFollowLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : isFollowing ? (
                      <><UserMinus className="w-4 h-4 mr-2" />Unfollow</>
                    ) : (
                      <><UserPlus className="w-4 h-4 mr-2" />Follow</>
                    )}
                  </Button>

                  {isFollowing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleNotifications}
                      className={cn(
                        "text-gray-400 hover:text-white",
                        isNotificationEnabled && "text-blue-400"
                      )}
                    >
                      {isNotificationEnabled ? (
                        <Bell className="w-4 h-4" />
                      ) : (
                        <BellOff className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Access Restriction Notice */}
          {!canAccess && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-amber-300">
                <Lock className="w-5 h-5" />
                <div>
                  <p className="font-medium">Private Board</p>
                  <p className="text-sm text-amber-400">
                    You need to follow this board to view its content and posts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Follow Error */}
          {followError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-300 text-center">
                {followError.message}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
