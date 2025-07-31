import redis from '@/lib/redis/redis';

/**
 * Create a like notification
 * @param {string} userId - The user who will receive the notification
 * @param {string} triggeredBy - The user who liked the content
 * @param {string} postId - The post that was liked
 * @param {string} postTitle - The title of the post
 */
export async function createLikeNotification(userId, triggeredBy, postId, postTitle) {
  if (userId === triggeredBy) {
    // Don't notify users about their own actions
    return;
  }

  try {
    const response = await fetch(`/api/users/${userId}/notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'like',
        title: 'Someone liked your post',
        message: `Your post "${postTitle}" received a like`,
        data: {
          post_id: postId,
          post_title: postTitle
        },
        post_id: postId,
        triggered_by: triggeredBy
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create like notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating like notification:', error);
    throw error;
  }
}

/**
 * Create a comment notification
 * @param {string} userId - The user who will receive the notification
 * @param {string} triggeredBy - The user who commented
 * @param {string} postId - The post that was commented on
 * @param {string} commentId - The comment ID
 * @param {string} postTitle - The title of the post
 * @param {string} commentPreview - Preview of the comment content
 */
export async function createCommentNotification(userId, triggeredBy, postId, commentId, postTitle, commentPreview) {
  if (userId === triggeredBy) {
    // Don't notify users about their own actions
    return;
  }

  try {
    const response = await fetch(`/api/users/${userId}/notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'comment',
        title: 'New comment on your post',
        message: `Someone commented on "${postTitle}": ${commentPreview}`,
        data: {
          post_id: postId,
          comment_id: commentId,
          post_title: postTitle,
          comment_preview: commentPreview
        },
        post_id: postId,
        comment_id: commentId,
        triggered_by: triggeredBy
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create comment notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating comment notification:', error);
    throw error;
  }
}

/**
 * Create a reply notification
 * @param {string} userId - The user who will receive the notification
 * @param {string} triggeredBy - The user who replied
 * @param {string} postId - The post containing the comment
 * @param {string} commentId - The original comment ID
 * @param {string} replyId - The reply comment ID
 * @param {string} replyPreview - Preview of the reply content
 */
export async function createReplyNotification(userId, triggeredBy, postId, commentId, replyId, replyPreview) {
  if (userId === triggeredBy) {
    // Don't notify users about their own actions
    return;
  }

  try {
    const response = await fetch(`/api/users/${userId}/notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'reply',
        title: 'Someone replied to your comment',
        message: `Reply: ${replyPreview}`,
        data: {
          post_id: postId,
          comment_id: commentId,
          reply_id: replyId,
          reply_preview: replyPreview
        },
        post_id: postId,
        comment_id: replyId,
        triggered_by: triggeredBy
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create reply notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating reply notification:', error);
    throw error;
  }
}

/**
 * Create a comment mention notification
 * @param {string} userId - The user who will receive the notification
 * @param {string} triggeredBy - The user who mentioned
 * @param {string} postId - The post ID
 * @param {string} commentId - The comment ID
 * @param {string} mentionText - The text containing the mention
 */
export async function createMentionNotification(userId, triggeredBy, postId, commentId, mentionText) {
  if (userId === triggeredBy) {
    return;
  }

  try {
    const response = await fetch(`/api/users/${userId}/notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'mention',
        title: 'You were mentioned in a comment',
        message: `Mentioned in: ${mentionText}`,
        data: {
          post_id: postId,
          comment_id: commentId,
          mention_text: mentionText
        },
        post_id: postId,
        comment_id: commentId,
        triggered_by: triggeredBy
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create mention notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating mention notification:', error);
    throw error;
  }
}

/**
 * Batch create notifications for multiple users
 * @param {Array} notifications - Array of notification objects
 * @returns {Promise<Array>} Results of notification creation
 */
export async function createBatchNotifications(notifications) {
  const results = [];

  for (const notification of notifications) {
    try {
      let result;
      switch (notification.type) {
        case 'comment':
          result = await createCommentNotification(
            notification.userId,
            notification.triggeredBy,
            notification.postId,
            notification.commentId,
            notification.postTitle,
            notification.commentPreview
          );
          break;
        case 'reply':
          result = await createReplyNotification(
            notification.userId,
            notification.triggeredBy,
            notification.postId,
            notification.commentId,
            notification.replyId,
            notification.replyPreview
          );
          break;
        case 'mention':
          result = await createMentionNotification(
            notification.userId,
            notification.triggeredBy,
            notification.postId,
            notification.commentId,
            notification.mentionText
          );
          break;
        default:
          throw new Error(`Unknown notification type: ${notification.type}`);
      }

      results.push({ success: true, result });
    } catch (error) {
      console.error(`Error creating ${notification.type} notification:`, error);
      results.push({ success: false, error: error.message });
    }
  }

  return results;
}

/**
 * Create a follow notification
 * @param {string} userId - The user who will receive the notification
 * @param {string} triggeredBy - The user who followed
 * @param {string} followerName - The name of the follower
 */
export async function createFollowNotification(userId, triggeredBy, followerName) {
  if (userId === triggeredBy) {
    // Don't notify users about their own actions
    return;
  }

  try {
    const response = await fetch(`/api/users/${userId}/notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'follow',
        title: 'New follower',
        message: `${followerName} started following you`,
        data: {
          follower_id: triggeredBy,
          follower_name: followerName
        },
        triggered_by: triggeredBy
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create follow notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating follow notification:', error);
    throw error;
  }
}

/**
 * Get unread notification count from Redis
 * @param {string} userId - The user ID
 * @returns {Promise<number>} The unread count
 */
export async function getUnreadCount(userId) {
  try {
    const count = await redis.get(`user:${userId}:unread_count`);
    return count ? parseInt(count) : 0;
  } catch (error) {
    console.error('Error getting unread count from Redis:', error);
    return 0;
  }
}

/**
 * Update unread notification count in Redis
 * @param {string} userId - The user ID
 * @param {number} increment - The number to increment by (can be negative)
 */
export async function updateUnreadCount(userId, increment = 1) {
  try {
    if (increment > 0) {
      await redis.incrby(`user:${userId}:unread_count`, increment);
    } else if (increment < 0) {
      const currentCount = await redis.get(`user:${userId}:unread_count`) || 0;
      const newCount = Math.max(0, parseInt(currentCount) + increment);
      await redis.set(`user:${userId}:unread_count`, newCount);
    }
    
    // Set expiration to 5 minutes
    await redis.expire(`user:${userId}:unread_count`, 300);
  } catch (error) {
    console.error('Error updating unread count in Redis:', error);
  }
}

/**
 * Clear all unread notifications for a user
 * @param {string} userId - The user ID
 */
export async function clearUnreadCount(userId) {
  try {
    await redis.set(`user:${userId}:unread_count`, 0);
    await redis.expire(`user:${userId}:unread_count`, 300);
  } catch (error) {
    console.error('Error clearing unread count in Redis:', error);
  }
}