'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

/**
 * UserAvatar component that displays user avatar or initials fallback
 * @param {Object} props
 * @param {Object} props.user - User object with username, name, avatar_url
 * @param {boolean} props.isAnonymous - Whether the post is anonymous
 * @param {string} props.size - Size of the avatar ('sm', 'md', 'lg')
 * @param {string} props.className - Additional CSS classes
 */
export default function UserAvatar({ 
  user, 
  isAnonymous = false, 
  size = 'md', 
  className = '' 
}) {
  const t = useTranslations('NewPost');
  const [imageError, setImageError] = useState(false);

  // Size configurations
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg'
  };

  // Get user display name and initials
  const getDisplayName = () => {
    if (isAnonymous) return t('anonymousPost');
    return user?.username || user?.name || t('anonymousPost');
  };

  const getInitials = () => {
    if (isAnonymous) return '?';
    
    const displayName = user?.username || user?.name || '';
    if (!displayName) return '?';
    
    // Get first letter of each word, max 2 letters
    const words = displayName.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    } else {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
  };

  const shouldShowImage = !isAnonymous && user?.avatar_url && !imageError;

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center ${className}`}>
      {shouldShowImage ? (
        <img
          src={user.avatar_url}
          alt={getDisplayName()}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full bg-[#1E4976] flex items-center justify-center">
          <span className="text-white font-medium">
            {getInitials()}
          </span>
        </div>
      )}
    </div>
  );
}
