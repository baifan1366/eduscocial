'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Flag,
  ThumbsDown
} from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import CommentForm from './CommentForm';
import { useVoteComment, useDeleteComment, useUpdateComment, useCommentVoteStatus } from '@/hooks/useComments';
import useAuth from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { zhTW, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';
import { renderMentions } from '@/lib/mentionParser';
import Reactions from '@/components/reactions/Reactions';

export default function CommentItem({ 
  comment, 
  postId,
  level = 0,
  maxLevel = 3,
  onReply = null 
}) {
  const t = useTranslations('Comments');
  const locale = useLocale();
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(true);
  
  const voteCommentMutation = useVoteComment();
  const deleteCommentMutation = useDeleteComment();
  const updateCommentMutation = useUpdateComment();

  // Get real-time vote status from cache
  const { data: voteStatus } = useCommentVoteStatus(comment.id);
  
  const isAuthor = user?.id === comment.author?.id;
  const canReply = level < maxLevel;
  
  // Format time
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: locale === 'zh-TW' ? zhTW : enUS
  });
  
  const handleVote = async (voteType) => {
    if (!user) {
      // Redirect to login
      return;
    }

    // Prevent voting if already voting
    if (voteCommentMutation.isPending) {
      return;
    }

    // If user clicks the same vote type they already voted, remove the vote
    const actualVoteType = voteStatus?.userVote === voteType ? 'remove' : voteType;

    try {
      await voteCommentMutation.mutateAsync({
        commentId: comment.id,
        voteType: actualVoteType
      });
    } catch (error) {
      console.error('Failed to vote:', error);
      // Show error message to user
      if (error.message.includes('already voted')) {
        // Handle duplicate vote error silently or show a message
        console.log('Duplicate vote prevented');
      }
    }
  };
  
  const handleDelete = async () => {
    if (!confirm(t('confirmDelete', { default: 'Are you sure you want to delete this comment?' }))) {
      return;
    }
    
    try {
      await deleteCommentMutation.mutateAsync(comment.id);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };
  
  const handleEdit = async () => {
    if (!editContent.trim()) {
      return;
    }
    
    try {
      await updateCommentMutation.mutateAsync({
        commentId: comment.id,
        updateData: { content: editContent.trim() }
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };
  
  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };
  
  if (comment.is_deleted) {
    return (
      <div className={`${level > 0 ? 'ml-8' : ''} py-4`}>
        <div className="bg-[#1A2332] rounded-lg p-4 border border-[#2E3A4A]">
          <p className="text-gray-500 italic text-sm">
            {t('deletedComment', { default: 'This comment has been deleted' })}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${level > 0 ? 'ml-8' : ''} py-4`}>
      <div className="bg-[#132F4C] rounded-lg p-4 border border-[#1E3A5F]">
        {/* Comment header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <UserAvatar
              user={comment.author}
              isAnonymous={comment.is_anonymous}
              size="sm"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-white text-sm">
                  {comment.is_anonymous 
                    ? t('anonymous', { default: 'Anonymous' })
                    : comment.author?.username || t('unknown', { default: 'Unknown' })
                  }
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-400">{timeAgo}</span>
                {comment.updated_at !== comment.created_at && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-400">
                      {t('edited', { default: 'edited' })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1E3A5F] border-[#2E5A8A]">
              {isAuthor && (
                <>
                  <DropdownMenuItem 
                    onClick={() => setIsEditing(true)}
                    className="text-gray-300 hover:text-white hover:bg-[#2E5A8A]"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {t('edit', { default: 'Edit' })}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-red-400 hover:text-red-300 hover:bg-[#2E5A8A]"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('delete', { default: 'Delete' })}
                  </DropdownMenuItem>
                </>
              )}
              {!isAuthor && (
                <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-[#2E5A8A]">
                  <Flag className="mr-2 h-4 w-4" />
                  {t('report', { default: 'Report' })}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Comment content */}
        <div className="mb-3">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[80px] p-3 bg-[#1E3A5F] border border-[#2E5A8A] rounded-md text-white placeholder-gray-400 resize-none"
                maxLength={2000}
              />
              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-white"
                >
                  {t('cancel', { default: 'Cancel' })}
                </Button>
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={!editContent.trim() || editContent.length > 2000}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {t('save', { default: 'Save' })}
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="text-gray-300 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: renderMentions(comment.content, (username) =>
                  `<a href="/user/${username}" class="text-blue-400 hover:text-blue-300 font-medium">@${username}</a>`
                )
              }}
            />
          )}
        </div>
        
        {/* Comment actions */}
        {!isEditing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Like button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote('like')}
                  disabled={voteCommentMutation.isPending}
                  className={`p-1 ${
                    voteStatus?.userVote === 'like'
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-gray-400 hover:text-red-400'
                  }`}
                >
                  <Heart className={`w-4 h-4 mr-1 ${voteStatus?.userVote === 'like' ? 'fill-current' : ''}`} />
                  <span className="text-xs">{voteStatus?.likesCount ?? comment.likesCount ?? 0}</span>
                </Button>

                {/* Dislike button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote('dislike')}
                  disabled={voteCommentMutation.isPending}
                  className={`p-1 ${
                    voteStatus?.userVote === 'dislike'
                      ? 'text-blue-500 hover:text-blue-600'
                      : 'text-gray-400 hover:text-blue-400'
                  }`}
                >
                  <ThumbsDown className={`w-4 h-4 mr-1 ${voteStatus?.userVote === 'dislike' ? 'fill-current' : ''}`} />
                  <span className="text-xs">{voteStatus?.dislikesCount ?? comment.dislikesCount ?? 0}</span>
                </Button>

                {/* Reply button */}
                {canReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="text-gray-400 hover:text-blue-400 p-1"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    <span className="text-xs">{t('reply', { default: 'Reply' })}</span>
                  </Button>
                )}
              </div>

              {/* Replies count */}
              {comment.replies && comment.replies.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  {showReplies ? t('hideReplies', { default: 'Hide replies' }) : t('showReplies', { default: 'Show replies' })} ({comment.replies.length})
                </Button>
              )}
            </div>

            {/* Reactions */}
            <div className="flex justify-start">
              <Reactions
                type="comment"
                targetId={comment.id}
                initialReactionCounts={comment.reaction_counts || {}}
                initialUserReactions={[]}
                className="scale-90"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Reply form */}
      {showReplyForm && canReply && (
        <div className="mt-4 ml-4">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            onCancel={() => setShowReplyForm(false)}
            autoFocus={true}
          />
        </div>
      )}
      
      {/* Replies */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              level={level + 1}
              maxLevel={maxLevel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
