'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Send, X } from 'lucide-react';
import { useCreateComment } from '@/hooks/useComments';
import useAuth from '@/hooks/useAuth';
import MentionTextarea from './MentionTextarea';

export default function CommentForm({ 
  postId, 
  parentId = null, 
  onCancel = null,
  placeholder = null,
  autoFocus = false,
  className = ""
}) {
  const t = useTranslations('Comments');
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createCommentMutation = useCreateComment(postId);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      return;
    }
    
    if (!user) {
      // Redirect to login or show login modal
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createCommentMutation.mutateAsync({
        content: content.trim(),
        parent_id: parentId,
        is_anonymous: isAnonymous
      });
      
      // Reset form
      setContent('');
      setIsAnonymous(false);
      
      // Call onCancel if this is a reply form
      if (onCancel) {
        onCancel();
      }
    } catch (error) {
      console.error('Failed to create comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    setContent('');
    setIsAnonymous(false);
    if (onCancel) {
      onCancel();
    }
  };
  
  if (!user) {
    return (
      <div className={`bg-[#1E3A5F] rounded-lg p-4 text-center ${className}`}>
        <p className="text-gray-400 mb-3">
          {t('loginToComment', { default: 'Please log in to leave a comment' })}
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.href = '/login'}
        >
          {t('login', { default: 'Log In' })}
        </Button>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div>
        <MentionTextarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder || (parentId ? t('replyPlaceholder', { default: 'Write a reply... (Use @username to mention someone)' }) : t('commentPlaceholder', { default: 'Write a comment... (Use @username to mention someone)' }))}
          className="min-h-[100px] bg-[#1E3A5F] border-[#2E5A8A] text-white placeholder-gray-400 resize-none"
          maxLength={2000}
          autoFocus={autoFocus}
          disabled={isSubmitting}
        />
        <div className="flex justify-between items-center mt-2 text-sm text-gray-400">
          <span>{content.length}/2000</span>
          {content.length > 1800 && (
            <span className="text-yellow-400">
              {t('characterLimit', { default: 'Character limit approaching' })}
            </span>
          )}
        </div>
      </div>
      
      {/* Anonymous option */}
      <div className="flex items-center space-x-2">
        <Switch
          id="anonymous"
          checked={isAnonymous}
          onCheckedChange={setIsAnonymous}
          disabled={isSubmitting}
        />
        <Label htmlFor="anonymous" className="text-sm text-gray-300">
          {t('postAnonymously', { default: 'Post anonymously' })}
        </Label>
      </div>
      
      {/* Action buttons */}
      <div className="flex items-center justify-end space-x-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4 mr-1" />
            {t('cancel', { default: 'Cancel' })}
          </Button>
        )}
        
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || isSubmitting || content.length > 2000}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
          ) : (
            <Send className="w-4 h-4 mr-1" />
          )}
          {parentId ? t('reply', { default: 'Reply' }) : t('comment', { default: 'Comment' })}
        </Button>
      </div>
    </form>
  );
}
