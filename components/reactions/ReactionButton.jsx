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

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        "h-auto px-2 py-1 rounded-full transition-all duration-200",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        isActive && "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800",
        isLoading && "opacity-50 cursor-not-allowed"
      )}
    >
      <span className="text-base mr-1">{emoji}</span>
      {count > 0 && (
        <span className={cn(
          "text-xs font-medium",
          isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
        )}>
          {count}
        </span>
      )}
    </Button>
  );
};

export default ReactionButton;
