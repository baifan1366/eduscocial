import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

import { bufferUserAction } from './redis/redisUtils';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getQueryParams(searchParams) {
  // Check for both 'settings' and 'showSettings' parameters
  const showSettings = searchParams.get('settings') === 'true' || searchParams.get('showSettings') === 'true';
  
  // Check for both 'tab' and 'activeTab' parameters, with proper default for settings
  const activeTab = searchParams.get('tab') || searchParams.get('activeTab') || 'general';
  
  return {
    showSettings,
    activeTab
  };
}

/**
 * Track user action by buffering it to Redis
 * This provides a convenient interface for application code to log user actions
 * 
 * @param {string} userId - The ID of the user
 * @param {string} action - The action performed (e.g., 'view_post', 'like_comment')
 * @param {object} options - Additional options
 * @param {string} [options.targetTable] - The target table name
 * @param {string} [options.targetId] - The target record ID
 * @param {object} [options.oldData] - Previous data state (for change tracking)
 * @param {object} [options.newData] - New data state (for change tracking)
 * @param {object} [options.metadata] - Additional context about the action
 * @returns {Promise<void>}
 */
export async function trackUserAction(userId, action, options = {}) {
  if (!userId || !action) {
    console.warn('Invalid parameters for trackUserAction: userId and action are required');
    return;
  }
  
  try {
    const {
      targetTable = null,
      targetId = null,
      oldData = null,
      newData = null,
      metadata = {}
    } = options;
    
    // Add timestamp metadata
    const enhancedMetadata = {
      ...metadata,
      client_timestamp: new Date().toISOString()
    };
    
    // Buffer the action to Redis
    await bufferUserAction(
      userId,
      action,
      targetTable,
      targetId,
      oldData,
      newData,
      enhancedMetadata
    );
    
    // Note: We immediately return without waiting for database write
    // This keeps the user experience snappy
  } catch (error) {
    // Log error but don't throw to avoid disrupting the user flow
    console.error('Error tracking user action:', error);
  }
}
