'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW, enUS } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import { Heart, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/ui/UserAvatar';
import Reactions from '@/components/reactions/Reactions';
import useAuth from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function FacebookStyleComment({ comment, onReply }) {
  const locale = useLocale();
  const { user } = useAuth();
  const tComments = useTranslations('Comments');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likesCount || 0);
  const [isAnonymousReply, setIsAnonymousReply] = useState(false);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const localeMap = {
      'zh': zhTW,
      'en': enUS,
    };
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: localeMap[locale] || enUS 
    });
  };

  // Handle like comment
  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like comments');
      return;
    }

    try {
      const response = await fetch(`/api/comments/${comment.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voteType: isLiked ? 'remove' : 'like'
        }),
      });

      if (response.ok) {
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  };

  return (
    <div className="flex items-start space-x-3">
      <UserAvatar 
        user={comment.author} 
        isAnonymous={comment.is_anonymous}
        size="sm" 
      />
      <div className="flex-1 min-w-0">
        {/* Comment Content */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2 relative">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
              {comment.is_anonymous 
                ? 'Anonymous' 
                : (comment.author?.username || comment.author?.name || 'Anonymous')
              }
            </h4>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {comment.content}
          </p>
        </div>

        {/* Comment Actions */}
        <div className="flex items-center space-x-4 mt-1 px-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(comment.created_at)}
          </span>
          
          <button
            onClick={handleLike}
            className={`text-xs font-semibold transition-colors ${
              isLiked
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tComments('like')}
            {likeCount > 0 && (
              <span className="ml-1">({likeCount})</span>
            )}
          </button>
          
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {tComments('reply')}
          </button>

          {/* Reactions */}
          <div className="flex-1 flex justify-end">
            <Reactions
              type="comment"
              targetId={comment.id}
              initialReactionCounts={comment.reaction_counts || {}}
              initialUserReactions={[]}
              className="scale-75"
            />
          </div>
        </div>

        {/* Reply Form */}
        {showReplyForm && user && (
          <div className="mt-3 ml-2">
            <div className="flex items-start space-x-2">
              <UserAvatar
                user={isAnonymousReply ? null : user}
                isAnonymous={isAnonymousReply}
                size="xs"
              />
              <div className="flex-1 space-y-2">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-3 py-2">
                  <input
                    type="text"
                    placeholder={isAnonymousReply
                      ? tComments('replyAnonymouslyTo', { username: comment.author?.username || 'Anonymous' })
                      : tComments('replyTo', { username: comment.author?.username || 'Anonymous' })
                    }
                    className="w-full bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-none outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        onReply && onReply(comment.id, e.target.value.trim(), isAnonymousReply);
                        e.target.value = '';
                        setShowReplyForm(false);
                        setIsAnonymousReply(false);
                      }
                    }}
                  />
                </div>

                {/* Anonymous Reply Toggle */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymousReply}
                      onChange={(e) => setIsAnonymousReply(e.target.checked)}
                      className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-1 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {tComments('replyAnonymously')}
                    </span>
                  </label>

                  <button
                    onClick={() => {
                      setShowReplyForm(false);
                      setIsAnonymousReply(false);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {tComments('cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <FacebookStyleComment
                key={reply.id}
                comment={reply}
                onReply={onReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
