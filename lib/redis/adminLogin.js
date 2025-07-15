import redis from './redis';
import { updateUserOnlineStatus } from './redisUtils';

/**
 * 存储管理员会话信息到Redis
 * @param {string} userId - 用户ID
 * @param {object} sessionData - 会话数据
 * @param {number} ttlInSeconds - 会话有效期（秒），默认24小时
 * @returns {Promise<void>}
 */
export async function storeAdminSession(userId, sessionData, ttlInSeconds = 86400) {
  const sessionKey = `admin:${userId}:session`;
  
  // 存储会话数据
  await redis.hset(sessionKey, sessionData);
  
  // 设置过期时间
  await redis.expire(sessionKey, ttlInSeconds);
  
  // 更新在线状态
  await updateUserOnlineStatus(userId, true);
}

/**
 * 获取管理员会话信息
 * @param {string} userId - 用户ID
 * @returns {Promise<object|null>} - 会话数据或null
 */
export async function getAdminSession(userId) {
  const sessionKey = `admin:${userId}:session`;
  const sessionData = await redis.hgetall(sessionKey);
  
  // 如果会话存在，更新最后活动时间
  if (Object.keys(sessionData).length > 0) {
    await updateUserOnlineStatus(userId, true);
    return sessionData;
  }
  
  return null;
}

/**
 * 删除管理员会话
 * @param {string} userId - 用户ID
 * @returns {Promise<void>}
 */
export async function removeAdminSession(userId) {
  const sessionKey = `admin:${userId}:session`;
  await redis.del(sessionKey);
}

/**
 * 验证用户是否为管理员
 * @param {string} userId - 用户ID
 * @returns {Promise<boolean>} - 是否为管理员
 */
export async function isAdmin(userId) {
  const sessionData = await getAdminSession(userId);
  return sessionData !== null && sessionData.isAdmin === 'true';
}

/**
 * 检查管理员角色权限
 * @param {string} userId - 用户ID
 * @param {string|string[]} requiredRoles - 所需角色或角色数组
 * @returns {Promise<boolean>} - 是否有权限
 */
export async function checkAdminRole(userId, requiredRoles) {
  const sessionData = await getAdminSession(userId);
  
  if (!sessionData || sessionData.isAdmin !== 'true') {
    return false;
  }
  
  if (!requiredRoles) {
    return true;
  }
  
  const userRole = sessionData.role;
  
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(userRole);
  }
  
  return requiredRoles === userRole;
}
