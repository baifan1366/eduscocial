/**
 * 解析评论中的@提及功能
 */

/**
 * 从文本中提取@提及的用户名
 * @param {string} text - 要解析的文本
 * @returns {Array<string>} 提及的用户名数组
 */
export function extractMentions(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  // 匹配@username格式，用户名可以包含字母、数字、下划线、连字符
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1];
    if (username && !mentions.includes(username)) {
      mentions.push(username);
    }
  }
  
  return mentions;
}

/**
 * 将文本中的@提及转换为可点击的链接
 * @param {string} text - 要处理的文本
 * @param {Function} linkRenderer - 自定义链接渲染函数
 * @returns {string} 处理后的HTML字符串
 */
export function renderMentions(text, linkRenderer = null) {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  const defaultLinkRenderer = (username) => {
    return `<a href="/user/${username}" class="mention-link text-blue-400 hover:text-blue-300">@${username}</a>`;
  };
  
  const renderer = linkRenderer || defaultLinkRenderer;
  
  return text.replace(/@([a-zA-Z0-9_-]+)/g, (match, username) => {
    return renderer(username);
  });
}

/**
 * 验证提及的用户是否存在
 * @param {Array<string>} usernames - 用户名数组
 * @returns {Promise<Array<Object>>} 存在的用户信息数组
 */
export async function validateMentions(usernames) {
  if (!Array.isArray(usernames) || usernames.length === 0) {
    return [];
  }
  
  try {
    // 这里应该调用API来验证用户是否存在
    const response = await fetch('/api/users/validate-usernames', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usernames }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to validate usernames');
    }
    
    const result = await response.json();
    return result.users || [];
  } catch (error) {
    console.error('Error validating mentions:', error);
    return [];
  }
}

/**
 * 处理评论中的提及，包括验证和通知
 * @param {string} commentText - 评论文本
 * @param {string} postId - 帖子ID
 * @param {string} commentId - 评论ID
 * @param {string} authorId - 评论作者ID
 * @returns {Promise<Object>} 处理结果
 */
export async function processMentions(commentText, postId, commentId, authorId) {
  try {
    // 1. 提取提及的用户名
    const mentionedUsernames = extractMentions(commentText);
    
    if (mentionedUsernames.length === 0) {
      return {
        success: true,
        mentionsCount: 0,
        validMentions: [],
        notifications: []
      };
    }
    
    console.log(`[processMentions] Found ${mentionedUsernames.length} mentions:`, mentionedUsernames);
    
    // 2. 验证用户是否存在
    const validUsers = await validateMentions(mentionedUsernames);
    
    if (validUsers.length === 0) {
      return {
        success: true,
        mentionsCount: mentionedUsernames.length,
        validMentions: [],
        notifications: []
      };
    }
    
    console.log(`[processMentions] Found ${validUsers.length} valid users`);
    
    // 3. 发送提及通知
    const notificationResults = [];
    
    for (const user of validUsers) {
      if (user.id === authorId) {
        // 不给自己发通知
        continue;
      }
      
      try {
        // 动态导入避免循环依赖
        const { createMentionNotification } = await import('./notifications.js');
        
        const result = await createMentionNotification(
          user.id,
          authorId,
          postId,
          commentId,
          commentText.substring(0, 100) + (commentText.length > 100 ? '...' : '')
        );
        
        notificationResults.push({
          userId: user.id,
          username: user.username,
          success: true,
          result
        });
        
        console.log(`[processMentions] Sent mention notification to ${user.username}`);
      } catch (error) {
        console.error(`[processMentions] Failed to send mention notification to ${user.username}:`, error);
        notificationResults.push({
          userId: user.id,
          username: user.username,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      success: true,
      mentionsCount: mentionedUsernames.length,
      validMentions: validUsers,
      notifications: notificationResults
    };
    
  } catch (error) {
    console.error('[processMentions] Error processing mentions:', error);
    return {
      success: false,
      error: error.message,
      mentionsCount: 0,
      validMentions: [],
      notifications: []
    };
  }
}

/**
 * 为React组件提供的提及处理Hook数据
 * @param {string} text - 文本内容
 * @returns {Object} 提及相关数据
 */
export function useMentionData(text) {
  const mentions = extractMentions(text);
  const hasMentions = mentions.length > 0;
  
  return {
    mentions,
    hasMentions,
    mentionsCount: mentions.length,
    renderText: (linkRenderer) => renderMentions(text, linkRenderer)
  };
}

/**
 * 创建用户名验证API的辅助函数
 * 这个函数应该在API路由中使用
 * @param {Array<string>} usernames - 要验证的用户名数组
 * @param {Object} supabase - Supabase客户端
 * @returns {Promise<Array<Object>>} 验证结果
 */
export async function validateUsernamesInDatabase(usernames, supabase) {
  if (!Array.isArray(usernames) || usernames.length === 0) {
    return [];
  }
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .in('username', usernames)
      .limit(50); // 限制查询数量
    
    if (error) {
      console.error('[validateUsernamesInDatabase] Database error:', error);
      throw error;
    }
    
    return users || [];
  } catch (error) {
    console.error('[validateUsernamesInDatabase] Error:', error);
    throw error;
  }
}
