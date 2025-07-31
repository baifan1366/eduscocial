'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

// 常用的emoji列表
const COMMON_EMOJIS = [
  '👍', '❤️', '😂', '😮', '😢', '😡',
  '🔥', '👏', '🎉', '💯', '🤔', '😍',
  '🙏', '👌', '✨', '💪', '🤝', '🎯'
];

const ReactionPicker = ({ onEmojiSelect, disabled = false, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);
  const buttonRef = useRef(null);

  // 点击外部关闭选择器
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerRef.current && 
        !pickerRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleEmojiClick = (emoji) => {
    onEmojiSelect(emoji, 'add');
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="h-auto px-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Smile className="w-4 h-4 text-gray-500" />
      </Button>

      {isOpen && (
        <div
          ref={pickerRef}
          className={cn(
            "absolute bottom-full left-0 mb-2 z-50",
            "bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700",
            "p-3 grid grid-cols-6 gap-1 min-w-[200px]"
          )}
        >
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className={cn(
                "w-8 h-8 rounded hover:bg-gray-100 dark:hover:bg-gray-700",
                "flex items-center justify-center text-lg",
                "transition-colors duration-150"
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReactionPicker;
