'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Globe,
  Lock,
  Users,
  MessageCircle,
  Eye,
  Heart,
  UserPlus,
  UserMinus,
  Sparkles,
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
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

export default function BoardCard({
  board, 
  locale = 'en', 
  isAuthenticated = false,
  viewMode = 'grid',
  showFollowButton = true 
}) {
  const t = useTranslations('BoardCard');
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  
  const { 
    isFollowing, 
    isLoading: isFollowLoading, 
    toggleFollow,
    error: followError 
  } = useBoardFollow(board.slug);

  const handleBoardClick = (e) => {
    // Don't navigate if clicking on follow button
    if (e.target.closest('button')) return;
    router.push(`/${locale}/boards/${board.slug}`);
  };

  const handleFollowClick = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push(`/${locale}/auth/login`);
      return;
    }
    toggleFollow();
  };

  const isPrivate = board.visibility === 'private';
  const canAccess = !isPrivate || isFollowing || !isAuthenticated;

  // Get the icon component
  const IconComponent = board.icon && ICON_MAP[board.icon] ? ICON_MAP[board.icon] : null;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-500 cursor-pointer",
        "bg-white/5 backdrop-blur-sm border border-white/10",
        "hover:bg-white/10 hover:border-white/20",
        "hover:shadow-2xl hover:shadow-blue-500/20",
        "hover:-translate-y-1 transform-gpu",
        "rounded-2xl",
        viewMode === 'list' && "flex-row",
        !canAccess && "opacity-75"
      )}
      onClick={handleBoardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500" />

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500"
           style={{
             backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
             backgroundSize: '20px 20px'
           }} />

      <CardHeader className={cn(
        "relative z-10 p-6",
        viewMode === 'list' ? 'flex-row items-center space-y-0 pb-4' : 'pb-4'
      )}>
        <div className={cn(
          "flex items-start gap-4",
          viewMode === 'list' ? 'flex-1 items-center' : ''
        )}>
          {/* Board Icon */}
          <div className="relative flex-shrink-0">
            <div
              className={cn(
                "relative flex items-center justify-center text-white font-bold",
                "rounded-2xl shadow-xl transition-all duration-500",
                "group-hover:scale-110 group-hover:rotate-3",
                viewMode === 'list' ? 'w-14 h-14' : 'w-16 h-16'
              )}
              style={{
                background: `linear-gradient(135deg, ${board.color || '#3B82F6'}, ${board.color || '#3B82F6'}dd)`,
                boxShadow: `0 8px 32px ${board.color || '#3B82F6'}40, 0 0 0 1px ${board.color || '#3B82F6'}20`
              }}
            >
              {IconComponent ? (
                <IconComponent className={cn(
                  "transition-transform duration-300 group-hover:scale-110",
                  viewMode === 'list' ? 'w-6 h-6' : 'w-7 h-7'
                )} />
              ) : (
                <span className={cn(
                  "font-bold transition-transform duration-300 group-hover:scale-110",
                  viewMode === 'list' ? 'text-lg' : 'text-xl'
                )}>
                  {board.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Status indicators */}
            {isPrivate && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Lock className="w-3 h-3 text-white" />
              </div>
            )}

            {isFollowing && (
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                <Heart className="w-3 h-3 text-white fill-current" />
              </div>
            )}
          </div>

          {/* Board Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className={cn(
                  "font-bold text-white group-hover:text-blue-300 transition-all duration-300 truncate",
                  viewMode === 'list' ? 'text-lg' : 'text-xl'
                )}>
                  {board.name}
                </h3>
                {board.featured && (
                  <div className="flex-shrink-0 p-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Follow Button - moved to top right */}
              {showFollowButton && isAuthenticated && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFollowClick}
                  disabled={isFollowLoading}
                  className={cn(
                    "transition-all duration-300 flex-shrink-0 h-8 px-3 rounded-full",
                    "bg-white/10 hover:bg-white/20 border border-white/20",
                    "text-white hover:text-white",
                    isFollowing && "bg-pink-500/20 border-pink-500/30 text-pink-300 hover:bg-pink-500/30",
                    isHovered && "scale-105"
                  )}
                >
                  {isFollowLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isFollowing ? (
                    <><Heart className="w-4 h-4 mr-1 fill-current" />{t('following')}</>
                  ) : (
                    <><UserPlus className="w-4 h-4 mr-1" />{t('follow')}</>
                  )}
                </Button>
              )}
            </div>

            {/* Visibility badge */}
            <div className="flex items-center gap-2 mb-3">
              <Badge
                className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full border transition-all duration-300",
                  isPrivate
                    ? "bg-amber-500/10 text-amber-300 border-amber-500/20 group-hover:bg-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 group-hover:bg-emerald-500/20"
                )}
              >
                {isPrivate ? (
                  <><Lock className="w-3 h-3 mr-1" />{t('private')}</>
                ) : (
                  <><Globe className="w-3 h-3 mr-1" />{t('public')}</>
                )}
              </Badge>
            </div>
          </div>

        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 px-6 pb-6 pt-0">
        {/* Description */}
        <p className={cn(
          "text-gray-300 text-sm mb-4 line-clamp-2 transition-all duration-300 leading-relaxed",
          "group-hover:text-gray-200",
          !canAccess && "blur-sm"
        )}>
          {board.description || t('noDescription')}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-gray-400 group-hover:text-blue-300 transition-colors duration-300">
              <div className="p-1 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors duration-300">
                <Users className="w-4 h-4" />
              </div>
              <span className="font-medium">{board.followersCount || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 group-hover:text-green-300 transition-colors duration-300">
              <div className="p-1 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors duration-300">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="font-medium">{board.postsCount || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 group-hover:text-purple-300 transition-colors duration-300">
              <div className="p-1 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors duration-300">
                <Eye className="w-4 h-4" />
              </div>
              <span className="font-medium">{board.viewCount || 0}</span>
            </div>
          </div>

          {/* Activity indicator */}
          <div className="flex items-center gap-2 text-xs">
            <div className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              board.isActive
                ? "bg-emerald-400 shadow-lg shadow-emerald-400/50 group-hover:shadow-emerald-400/70"
                : "bg-gray-500"
            )} />
            <span className={cn(
              "font-medium transition-colors duration-300",
              board.isActive
                ? "text-emerald-300 group-hover:text-emerald-200"
                : "text-gray-500"
            )}>
              {board.isActive ? t('active') : t('inactive')}
            </span>
          </div>
        </div>

        {/* Access Restriction Notice */}
        {!canAccess && (
          <div className="p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl backdrop-blur-sm">
            <p className="text-sm text-amber-300 text-center font-medium">
              <Lock className="w-4 h-4 inline mr-2" />
              {t('followToUnlock')}
            </p>
          </div>
        )}

        {/* Follow Error */}
        {followError && (
          <div className="p-3 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm">
            <p className="text-sm text-red-300 text-center font-medium">
              {followError.message}
            </p>
          </div>
        )}

        {/* Hover effect line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-b-2xl" />
      </CardContent>
    </Card>
  );
}
