/**
 * Embedding更新工具函数
 * 用于管理帖子embedding的更新逻辑
 */

/**
 * 异步触发帖子embedding更新
 * @param {string} postId - 帖子ID
 * @param {Object} options - 选项
 * @param {number} options.delay - 延迟时间（毫秒），默认1000ms
 * @param {boolean} options.background - 是否在后台执行，默认true
 * @returns {Promise<void>}
 */
export async function triggerPostEmbeddingUpdate(postId, options = {}) {
  const { delay = 1000, background = true } = options;
  
  const updateFunction = async () => {
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const updateResponse = await fetch(`${baseUrl}/api/posts/${postId}/update-embedding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (updateResponse.ok) {
        const result = await updateResponse.json();
        console.log(`[embeddingUpdater] Successfully updated embedding for post ${postId}:`, result.metadata);
        return result;
      } else {
        const error = await updateResponse.json();
        console.error(`[embeddingUpdater] Failed to update embedding for post ${postId}:`, error.error);
        throw new Error(error.error || 'Failed to update embedding');
      }
    } catch (error) {
      console.error(`[embeddingUpdater] Error updating embedding for post ${postId}:`, error);
      throw error;
    }
  };
  
  if (background) {
    // 后台执行，不阻塞当前操作
    if (delay > 0) {
      setTimeout(updateFunction, delay);
    } else {
      // 使用setImmediate或Promise.resolve来异步执行
      Promise.resolve().then(updateFunction).catch(error => {
        console.error(`[embeddingUpdater] Background embedding update failed:`, error);
      });
    }
  } else {
    // 同步等待执行
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return await updateFunction();
  }
}

/**
 * 批量触发多个帖子的embedding更新
 * @param {string[]} postIds - 帖子ID数组
 * @param {Object} options - 选项
 * @param {number} options.batchSize - 批次大小，默认5
 * @param {number} options.delayBetweenBatches - 批次间延迟（毫秒），默认2000ms
 * @param {boolean} options.background - 是否在后台执行，默认true
 * @returns {Promise<Object>} 更新结果统计
 */
export async function triggerBatchEmbeddingUpdate(postIds, options = {}) {
  const { batchSize = 5, delayBetweenBatches = 2000, background = true } = options;
  
  if (!Array.isArray(postIds) || postIds.length === 0) {
    return { success: true, processed: 0, results: [] };
  }
  
  const updateFunction = async () => {
    const results = [];
    const errors = [];
    
    // 分批处理
    for (let i = 0; i < postIds.length; i += batchSize) {
      const batch = postIds.slice(i, i + batchSize);
      console.log(`[embeddingUpdater] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(postIds.length / batchSize)}`);
      
      // 并行处理当前批次
      const batchPromises = batch.map(async (postId) => {
        try {
          const result = await triggerPostEmbeddingUpdate(postId, { delay: 0, background: false });
          results.push({ postId, success: true, result });
          return { postId, success: true };
        } catch (error) {
          errors.push({ postId, success: false, error: error.message });
          return { postId, success: false, error: error.message };
        }
      });
      
      await Promise.allSettled(batchPromises);
      
      // 批次间延迟
      if (i + batchSize < postIds.length && delayBetweenBatches > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }
    
    const summary = {
      success: true,
      processed: postIds.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    };
    
    console.log(`[embeddingUpdater] Batch update completed:`, {
      processed: summary.processed,
      successful: summary.successful,
      failed: summary.failed
    });
    
    return summary;
  };
  
  if (background) {
    // 后台执行
    Promise.resolve().then(updateFunction).catch(error => {
      console.error(`[embeddingUpdater] Background batch update failed:`, error);
    });
    return { success: true, message: 'Batch update started in background' };
  } else {
    // 同步等待执行
    return await updateFunction();
  }
}

/**
 * 检查帖子是否需要更新embedding
 * @param {string} postId - 帖子ID
 * @returns {Promise<Object>} 检查结果
 */
export async function checkEmbeddingUpdateNeeded(postId) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/posts/${postId}/update-embedding`);
    
    if (response.ok) {
      return await response.json();
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check embedding status');
    }
  } catch (error) {
    console.error(`[embeddingUpdater] Error checking embedding status for post ${postId}:`, error);
    throw error;
  }
}

/**
 * 获取系统embedding统计信息
 * @param {boolean} includeDetails - 是否包含详细信息
 * @returns {Promise<Object>} 统计信息
 */
export async function getEmbeddingStatistics(includeDetails = false) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/embeddings/batch-update${includeDetails ? '?include_details=true' : ''}`;
    const response = await fetch(url);
    
    if (response.ok) {
      return await response.json();
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get embedding statistics');
    }
  } catch (error) {
    console.error(`[embeddingUpdater] Error getting embedding statistics:`, error);
    throw error;
  }
}

/**
 * 智能embedding更新策略
 * 根据帖子的活跃度和重要性决定更新优先级
 * @param {string} postId - 帖子ID
 * @param {Object} context - 上下文信息
 * @param {string} context.action - 触发更新的动作 ('comment_created', 'comment_updated', 'comment_deleted')
 * @param {number} context.commentCount - 当前评论数
 * @param {Date} context.lastUpdated - 最后更新时间
 * @returns {Promise<void>}
 */
export async function smartEmbeddingUpdate(postId, context = {}) {
  const { action, commentCount = 0, lastUpdated } = context;
  
  // 根据不同情况决定更新策略
  let delay = 1000; // 默认延迟
  let shouldUpdate = true;
  
  switch (action) {
    case 'comment_created':
      // 新评论：立即更新，但有短延迟避免频繁更新
      delay = commentCount > 10 ? 2000 : 1000;
      break;
      
    case 'comment_updated':
      // 评论更新：稍长延迟，因为可能有连续编辑
      delay = 3000;
      break;
      
    case 'comment_deleted':
      // 评论删除：中等延迟
      delay = 2000;
      break;
      
    default:
      // 其他情况：使用默认延迟
      delay = 1000;
  }
  
  // 如果最近刚更新过，可能跳过此次更新
  if (lastUpdated) {
    const timeSinceUpdate = Date.now() - new Date(lastUpdated).getTime();
    if (timeSinceUpdate < 30000) { // 30秒内更新过
      console.log(`[embeddingUpdater] Skipping update for post ${postId} - recently updated`);
      shouldUpdate = false;
    }
  }
  
  if (shouldUpdate) {
    console.log(`[embeddingUpdater] Scheduling smart update for post ${postId} with ${delay}ms delay`);
    await triggerPostEmbeddingUpdate(postId, { delay, background: true });
  }
}

/**
 * 清理和维护embedding
 * 删除孤立的embedding记录，更新过期的embedding
 * @returns {Promise<Object>} 清理结果
 */
export async function cleanupEmbeddings() {
  try {
    console.log('[embeddingUpdater] Starting embedding cleanup...');
    
    // 这里可以添加清理逻辑，比如：
    // 1. 删除对应帖子已删除的embedding
    // 2. 更新使用旧模型版本的embedding
    // 3. 修复损坏的embedding数据
    
    // 目前返回占位符结果
    return {
      success: true,
      message: 'Embedding cleanup completed',
      cleaned: 0,
      updated: 0
    };
  } catch (error) {
    console.error('[embeddingUpdater] Error during embedding cleanup:', error);
    throw error;
  }
}
