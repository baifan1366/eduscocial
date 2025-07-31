'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import useAuth from '@/hooks/useAuth';
import ReactionButton from './ReactionButton';
import ReactionPicker from './ReactionPicker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const Reactions = ({
  type, // 'post' or 'comment'
  targetId, // post ID or comment ID
  initialReactionCounts = {},
  initialUserReactions = [],
  className
}) => {
  const t = useTranslations('Reactions');
  const { user } = useAuth();
  const [reactionCounts, setReactionCounts] = useState(initialReactionCounts);
  const [userReactions, setUserReactions] = useState(initialUserReactions);
  const [isLoading, setIsLoading] = useState(false);

  // 更新初始数据
  useEffect(() => {
    setReactionCounts(initialReactionCounts);
    setUserReactions(initialUserReactions);
  }, [initialReactionCounts, initialUserReactions]);

  const handleReaction = async (emoji, action) => {
    if (!user) {
      toast.error(t('loginToReact'));
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      const endpoint = type === 'post'
        ? `/api/posts/${targetId}/reactions`
        : `/api/comments/${targetId}/reactions`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji, action }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update reaction');
      }

      const data = await response.json();

      if (data.success) {
        // 更新本地状态
        setReactionCounts(data.reactionCounts || {});

        if (action === 'add') {
          setUserReactions(prev => [...prev.filter(r => r !== emoji), emoji]);
          toast.success(t('reactionAdded'));
        } else {
          setUserReactions(prev => prev.filter(r => r !== emoji));
          toast.success(t('reactionRemoved'));
        }
      }

    } catch (error) {
      console.error('Error updating reaction:', error);
      toast.error(error.message || t('reactionFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // 获取所有有计数的emoji
  const emojisWithCounts = Object.entries(reactionCounts)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a); // 按计数降序排列

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {/* 显示有计数的reactions */}
      {emojisWithCounts.map(([emoji, count]) => (
        <ReactionButton
          key={emoji}
          emoji={emoji}
          count={count}
          isActive={userReactions.includes(emoji)}
          onClick={handleReaction}
          disabled={isLoading}
        />
      ))}

      {/* Reaction选择器 */}
      <ReactionPicker
        onEmojiSelect={handleReaction}
        disabled={isLoading || !user}
      />
    </div>
  );
};

export default Reactions;
