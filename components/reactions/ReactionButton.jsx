'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ReactionButton = ({
  emoji,
  count = 0,
  isActive = false,
  onClick,
  disabled = false,
  size = 'sm'
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    try {
      await onClick(emoji, isActive ? 'remove' : 'add');
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    xs: "h-auto px-1 py-0.5 text-xs",
    sm: "h-auto px-2 py-1 text-sm",
    md: "h-auto px-3 py-1.5 text-base"
  };

  const emojiSizeClasses = {
    xs: "text-sm mr-0.5",
    sm: "text-base mr-1",
    md: "text-lg mr-1"
  };

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        "rounded-full transition-all duration-200",
        "hover:bg-white/10 dark:hover:bg-white/10",
        isActive && "bg-blue-500/20 border border-blue-400/30",
        isLoading && "opacity-50 cursor-not-allowed",
        sizeClasses[size] || sizeClasses.sm
      )}
    >
      <span className={cn(emojiSizeClasses[size] || emojiSizeClasses.sm)}>{emoji}</span>
      {count > 0 && (
        <span className={cn(
          "font-medium",
          size === 'xs' ? "text-xs" : "text-xs",
          isActive ? "text-blue-300" : "text-gray-400"
        )}>
          {count}
        </span>
      )}
    </Button>
  );
};

export default ReactionButton;
